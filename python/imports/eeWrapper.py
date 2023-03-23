# gmsEEWrapper.py
#
# This script warps all of the relevant Earth Engine functionality so that it  
# can be easily invoked by the iterate function in the main gmsMalaria script.
import imports.eeProcessing as eeProcessing
import imports.jsConversion as jsConversion
import sys

class gmsEEWrapper:
    # Earth Engine data
    classifier = None; gms = None; imagery = None
    
    # Local data 
    environmental = None; landcover = None; satellite = None

    # Other private variables variables
    vector = None; year = None; scale = None; count = 0

    # Constructor
    def __init__(self): pass

    # Return the count of queued tasks
    def get_count(self): return self.count

    # Reset the current count of queued tasks
    def reset_count(self): self.count = 0

    # Set the scale to use for exports, in meters
    def set_scale(self, scale): 
        if scale <= 0:
            raise Exception('The scale must be greater than zero meters, got: {}'.format(scale))
        self.scale = scale

    # Set the vector to use
    def set_vector(self, vector): self.vector = vector


    # Initialize the connection to Earth Engine and load any additional data we need
    def init(self):
        # Parse the Earth Engine Javascript files
        jsConversion.convert()

        # Initialize the library, this can take a couple seconds
        sys.stdout.write("Initializing Earth Engine...")
        sys.stdout.flush()
        import ee
        import keys.secrets as secrets
        credentials = ee.ServiceAccountCredentials(secrets.ACCOUNT, secrets.KEY)
        ee.Initialize(credentials)
        print("done!")

        # Load the various common objects
        import temp.shapefiles as shp
        self.gms = shp.getGms()


    # Set the year of the study and update any derived values
    def set_year(self, year): 
        # Make sure the year is valid
        if year < 2001: 
            raise Exception('Year must be greater or equal to 2001, got: {}'.format(year))
        self.year = year

        # Set the satellite to use
        previous = self.satellite
        import temp.landsat as landsat
        if self.year > 2013: self.satellite = landsat.landsat8
        else: self.satellite = landsat.landsat7

        # Prepare the classified landcover
        if previous != self.satellite:
            self.classifier = eeProcessing.get_classifier(self.satellite)

        # Load the imagery to process
        import temp.gms_wrs2_swaths as indices
        self.imagery = eeProcessing.get_imagery(self.satellite, indices.indices, self.gms, self.year)

        # Prepare the generic tasks for the year
        self.landcover = eeProcessing.classify(self.classifier, self.imagery, self.satellite)
        self.environmental = eeProcessing.get_environmental(self.gms, self.year)
        

    # Queue the processing tasks related to the environment, this requires that the year be set
    def queue_environment(self):
        # Verify the current status
        if self.year is None:
            raise Exception('The year must be set prior to queuing environment tasks')
        # Verify the current scale status
        if self.scale is None:
            raise Exception('The scale must be set prior to queuing environment tasks')
        
        # Start the tasks
        TASKS = 3
        eeProcessing.export_raster(self.landcover, self.gms, str(self.year) + '_landcover', self.scale)
        eeProcessing.export_raster(self.environmental.select('total_rainfall'), self.gms, str(self.year) + '_total_rainfall', self.scale)
        eeProcessing.export_raster(self.environmental.select('mean_temperature'), self.gms, str(self.year) + '_mean_temperature', self.scale)
        
        # Update the count, return the total tasks queued
        self.count += TASKS
        return TASKS


    # Queue the processing tasks related to the vector for the given deviation,
    # this requires that the year and vector be set
    def queue_vector(self, deviation):
        # Make sure we have a vector
        if self.vector is None: 
            raise Exception('The vector must be set before setting the deviation')

        # Load the temperature bounds
        minima = self.vector['tempMin']
        maxima = self.vector['tempMax']
        temperature = eeProcessing.get_temperature_bounds(self.gms, self.year, minima, maxima)

        # Determine the correct pathway based upon if we are dealing with a range or greater-than clause
        if self.vector['tempMean'][0] == self.vector['tempMean'][1]:
            # The values are the same, so we are dealing with a greater-than clause
            return self.__queue_vector_greater_than(deviation, temperature)
        else:
            # The values are different, so we are dealing with a range
            return self.__queue_vector_range(deviation, temperature)


    def __queue_vector_greater_than(self, deviation, temperature):
        TASK_TYPE = ['minus', 'plus']
        TASK_MULTIPLIER = [-1, 1]

        tasks = 0
        for ndx in [0, 1]:
            # Classify the habitat and risk based upon the inputs
            mean = self.vector['tempMean'][0] + (TASK_MULTIPLIER[ndx] * deviation)
            habitat = eeProcessing.get_habitat({
                # Raster data
                'totalRainfall'     : self.environmental.select('total_rainfall'),
                'meanTemperature'   : self.environmental.select('mean_temperature'),
                'daysOutsideBounds' : temperature.select('days_outside_bounds'),
                'landcover'         : self.landcover,

                # Species data
                'speciesRainfall'   : self.vector['rainfall'],
                'speciesLife'       : self.vector['lifeExpectancy'],

                # Set the upper and lower bound to be the same since this is a range  
                'speciesMeanLower'  : mean,
                'speciesMeanUpper'  : mean,
            })
            risk = eeProcessing.get_risk(self.landcover, habitat)

            # Prepare the prefix
            prefix = '{}_{}_{}{}'.format(self.year, self.vector['species'].replace(' ', '_').replace('.', ''), TASK_TYPE[ndx], deviation)

            # Start the tasks
            BASE_TASKS = 3
            eeProcessing.export_raster(temperature.select('days_outside_bounds'), self.gms, prefix + '_days_outside_bounds', self.scale)
            eeProcessing.export_raster(habitat, self.gms, prefix + '_habitat', self.scale)
            eeProcessing.export_raster(risk, self.gms, prefix + '_risk', self.scale)
            tasks += BASE_TASKS
        
        # Update the count, return the total tasks queued
        self.count += tasks
        return tasks
    

    def __queue_vector_range(self, deviation, temperature):
        # Classify the habitat and risk based upon the inputs
        habitat = eeProcessing.get_habitat({
            # Raster data
            'totalRainfall'     : self.environmental.select('total_rainfall'),
            'meanTemperature'   : self.environmental.select('mean_temperature'),
            'daysOutsideBounds' : temperature.select('days_outside_bounds'),
            'landcover'         : self.landcover,

            # Species data
            'speciesRainfall'   : self.vector['rainfall'],
            'speciesLife'       : self.vector['lifeExpectancy'],

            # Update the upper and lower bounds of the range    
            'speciesMeanLower'  : self.vector['tempMean'][0] - deviation,
            'speciesMeanUpper'  : self.vector['tempMean'][1] + deviation,
        })
        risk = eeProcessing.get_risk(self.landcover, habitat)

        # Start the tasks
        TASKS = 3
        prefix = '{}_{}_{}'.format(self.year, self.vector['species'].replace(' ', '_').replace('.', ''), deviation)
        eeProcessing.export_raster(temperature.select('days_outside_bounds'), self.gms, prefix + '_days_outside_bounds', self.scale)
        eeProcessing.export_raster(habitat, self.gms, prefix + '_habitat', self.scale)
        eeProcessing.export_raster(risk, self.gms, prefix + '_risk', self.scale)
        
        # Update the count, return the total tasks queued
        self.count += TASKS
        return TASKS

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
    vector = None; year = None; count = 0

    # Constructor
    def __init__(self): pass

    # Return the count of queued tasks
    def get_count(self): return self.count

    # Reset the current count of queued tasks
    def reset_count(self): self.count = 0

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
        
        # Start the tasks
        TASKS = 3
        eeProcessing.export_raster(self.landcover, self.gms, str(self.year) + '_landcover')
        eeProcessing.export_raster(self.environmental.select('total_rainfall'), self.gms, str(self.year) + '_total_rainfall')
        eeProcessing.export_raster(self.environmental.select('mean_temperature'), self.gms, str(self.year) + '_mean_temperature')
        
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

            # Use the lower bound of the SD for the UI, the Python scripts will interrogate the full range    
            'speciesMeanLower'  : self.vector['tempMean'][0] - deviation,
            'speciesMeanUpper'  : self.vector['tempMean'][1] + deviation,
        })
        risk = eeProcessing.get_risk(self.landcover, habitat)

        # Start the tasks
        TASKS = 3
        prefix = '{}_{}_{}'.format(self.year, self.vector['species'].replace(' ', '_').replace('.', ''), deviation)
        eeProcessing.export_raster(temperature.select('days_outside_bounds'), self.gms, prefix + '_days_outside_bounds')
        eeProcessing.export_raster(habitat, self.gms, prefix + '_habitat')
        eeProcessing.export_raster(risk, self.gms, prefix + '_risk')
        
        # Update the count, return the total tasks queued
        self.count += TASKS
        return TASKS

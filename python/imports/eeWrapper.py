# gmsEEWrapper.py
#
# This script warps all of the relevant Earth Engine functionality so that it  
# can be easily invoked by the iterate function in the main gmsMalaria script.
import imports.jsConversion as jsConversion
import sys

class gmsEEWrapper:
    # Shapefiles
    shp_gms = None
    
    # Rasters
    

    # JSON data
    json_satellite = None

    # Private variables
    vector = None; year = None; count = 0

    # Constructor
    def __init__(self): pass

    # Return the count of queued jobs
    def get_count(self): return self.count


    # Initialize the connection to Earth Engine and load any additional data we need
    def init(self):
        # Parse the Earth Engine Javascript files
        jsConversion.convert()

        # Initialize the library, this can take a couple seconds
        sys.stdout.write("Initializing Earth Engine...")
        sys.stdout.flush()
        import ee
        ee.Initialize()
        print("done!")

        # Load the various common objects
        import temp.shapefiles as shp
        shp_gms = shp.getGms()


    # Reset the current count of queued jobs
    def reset_count(self): self.count = 0


    def set_vector(self, vector):
        self.vector = vector


    # Set the year of the study and update any derived values
    def set_year(self, year): 
        # Make sure the year is valid
        if year < 2000: raise Exception('Year must be greater or equal to 2000, got: {}'.format(year))
        self.year = year

        # Set the satellite to use
        import temp.landsat as landsat
        if self.year > 2013: self.json_satellite = landsat.landsat8
        else: self.json_satellite = landsat.landsat7

        # Get the imagery for the year
        
        

    def queue(self, scalar):
        self.count += 1
        pass

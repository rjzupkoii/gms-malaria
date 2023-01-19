# processing.py
#
# This script warps all of the relevant Earth Engine functionality.
import gmsConversion
import sys

class gmsProcessing:
    gms = None
    vector = None
    year = None

    count = 0

    # Constructor
    def __init__(self): pass

    # Return the count of queued jobs
    def get_count(self): return self.count

    # Initialize the connection to Earth Engine and load any additional data we need
    def init(self):
        # Parse the Earth Engine Javascript files
        gmsConversion.convert()

        # Initialize the library, this can take a couple seconds
        sys.stdout.write("Initializing Earth Engine...")
        sys.stdout.flush()
        import ee
        ee.Initialize()
        print("done!")

        # Load the various common objects
        import temp.shapefiles as shp
        gms = shp.getGms()

    # Reset the current count of queued jobs
    def reset_count(self): self.count = 0

    def set_vector(self, vector):
        self.vector = vector

    def set_year(self, year): 
        self.year = year

    def queue(self, scalar):
        self.count += 1
        pass



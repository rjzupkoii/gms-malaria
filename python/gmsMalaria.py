#!/usr/bin/python3

# gmsMalaria.py
#
# This Python script uses the Earth Engine Python API to queue batch jobs using
# the same algorithm that is contained in the JavaScript files. 
# 
# NOTE: This script assumes that authentication has already been handled by 
# prior to being run.
import gmsConversion
from gmsProcessing import gmsProcessing


def iterate(processor):
    # Load common objects for this function    
    mosquitoes = gmsConversion.load_mosquitoes()

    # Iterate over each year 
    for year in range(2001, 2022 + 1):
        processor.set_year(year)

        # Iterate over each type of mosquito
        for key in mosquitoes:

            # Reset the zeroed flag and set the vector
            zeroed = False
            processor.set_vector(mosquitoes[key])

            # Iterate over each increment for the standard deviation
            minima = int(mosquitoes[key]['tempMeanSD'][0] * 100)
            maxima = int(mosquitoes[key]['tempMeanSD'][1] * 100)
            for value in range(minima, maxima + 1, 25):
                # Check to see if the range includes zero
                if value == 0: zeroed = True

                # Queue the job
                processor.queue(value / 100.0)

            # If we didn't encounter a zero scalar, then queue a last job so we can get a baseline
            if not zeroed: processor.queue(0.0)


def main():    
    # Prepare the processor
    processor = gmsProcessing()
    processor.init()

    # Start queuing the jobs
    iterate(processor)
    print("Queued Jobs: ", processor.get_count())


if __name__ == '__main__':
    main()
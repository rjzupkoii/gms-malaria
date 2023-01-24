#!/usr/bin/python3

# gmsMalaria.py
#
# This Python script is the main entry point for the batch processing of 
# imagery data in the Greater Mekong Subregion (GMS). It's written in a 
# semi-general manner so that it can be expanded to cover other parts of the 
# world, but conceptually is very tied to the original JavaScript code run via
# https://code.earthengine.google.com/ or as an Earth Engine App.
# 
# NOTE: This script assumes that authentication has already been handled by 
# prior to being run.
import imports.jsConversion as conversion
import imports.eeWrapper as ee


def iterate(wrapper):
    # Load common objects for this function    
    mosquitoes = conversion.load_mosquitoes()

    # Iterate over each year 
    for year in range(2001, 2022 + 1):
        wrapper.set_year(year)

        # Iterate over each type of mosquito
        for key in mosquitoes:

            # Reset the zeroed flag and set the vector
            zeroed = False
            wrapper.set_vector(mosquitoes[key])

            # Iterate over each increment for the standard deviation
            minima = int(mosquitoes[key]['tempMeanSD'][0] * 100)
            maxima = int(mosquitoes[key]['tempMeanSD'][1] * 100)
            for value in range(minima, maxima + 1, 25):
                # Check to see if the range includes zero
                if value == 0: zeroed = True

                # Queue the job
                wrapper.queue(value / 100.0)

            # If we didn't encounter a zero scalar, then queue a last job so we can get a baseline
            if not zeroed: wrapper.queue(0.0)


def main():    
    # Prepare the processor
    wrapper = ee.gmsEEWrapper()
    wrapper.init()

    # Start queuing the jobs
    iterate(wrapper)
    print("Queued Jobs: ", wrapper.get_count())


if __name__ == '__main__':
    main()
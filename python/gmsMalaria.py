#!/usr/bin/python3

# gmsMalaria.py
#
# This Python script is the main entry point for the batch processing of 
# imagery data in the Greater Mekong Subregion (GMS). It's written in a 
# semi-general manner so that it can be expanded to cover other parts of the 
# world, but conceptually is very tied to the original JavaScript code run via
# https://code.earthengine.google.com/ or as an Earth Engine App.
import argparse
import datetime
import os
import sys

from imports.progress import progressBar


def iterate(wrapper, year):
    # Load the analysis to be run
    import imports.jsConversion as conversion
    mosquitoes = conversion.load_mosquitoes()    
    analysis, size = generate_analysis(mosquitoes)

    # Prepare the progress bar
    status = 0; size += 1
    progressBar(status, size)

    # Start by setting the year
    wrapper.set_year(year)
    wrapper.queue_environment()

    # Update the progress bar, note we just want to indicate progress so it 
    # doesn't have to be accurate
    status += 1
    progressBar(status, size)

    # Iterate through the analysis set
    for key in analysis:
        wrapper.set_vector(mosquitoes[key])
        for scalar in analysis[key]:
            wrapper.queue_vector(scalar)
            
            # Note the progress
            status += 1
            progressBar(status, size)


# Generate the sensitivity analysis tasks for the mosquitoes can be loaded 
def generate_analysis(mosquitoes = None):

    # Load the mosquitoes from the JavaScript if we weren't provided them this
    # gives a bit of flexibility for command line processing
    if mosquitoes is None:
        import imports.jsConversion as conversion
        mosquitoes = conversion.load_mosquitoes()

    analysis = {}; size = 0
    for key in mosquitoes:
        analysis[key] = []

        # Iterate over each increment for the standard deviation
        minima = int(mosquitoes[key]['tempMeanSD'][0] * 100)
        maxima = int(mosquitoes[key]['tempMeanSD'][1] * 100)
        for value in range(minima, maxima + 1, 25):
            analysis[key].append(value / 100.0)
        
        # Append the zero value if one is not present
        if analysis[key][0] != 0:
            analysis[key].insert(0, 0.0)

        # Update the total size
        size += len(analysis[key])

    return analysis, size


def main(args):   
    # Prepare the processor
    import imports.eeWrapper as eeWrapper
    wrapper = eeWrapper.gmsEEWrapper()
    wrapper.init()

    # Start queuing the jobs
    iterate(wrapper, int(args.year))
    print("Queued Jobs: ", wrapper.get_count())


if __name__ == '__main__':
    # Parse the parameters
    parser = argparse.ArgumentParser()
    parser.add_argument('-y', action='store', dest='year', required=True, help='The year to run the sensitivity analysis for')
    args = parser.parse_args()

    # Verify the parameters
    year = int(args.year)
    if year < 2001 or year > (datetime.date.today().year - 1):
        print('The year must be an integer between 2001 and {} inclusive.'.format((datetime.date.today().year - 1)))
        sys.exit(os.EX_USAGE)

    main(args)
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


# Generate the sensitivity analysis tasks for the mosquitoes can be loaded 
def generate_analysis(mosquitoes):
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


def generate_missing(mosquitoes, path, year):
    # Start by generating the full analysis set
    analysis, _ = generate_analysis(mosquitoes)

    # Now parse these into the expected file prefixes
    prefixes = {}
    for key in analysis:
        name = mosquitoes[key]['species'].replace(' ', '_').replace('.', '')
        for value in analysis[key]:
            prefix = "{}_{}_{}".format(year, name, value)
            prefixes[prefix] = key, value
    
    # Scan the files in the directory
    for file in os.listdir(path):
        for key in prefixes.keys():
            if key in file:
                del prefixes[key]
                break
    
    # Return the missing jobs
    return prefixes


def iterate(wrapper, year, scale):
    # Load the analysis to be run
    import imports.jsConversion as conversion
    mosquitoes = conversion.load_mosquitoes()    
    analysis, size = generate_analysis(mosquitoes)

    # Initialize and prepare the progress bar
    wrapper.init()
    status = 0; size += 1
    progressBar(status, size)

    # Start by setting the scale and year
    wrapper.set_scale(scale)
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


def iterate_missing(wrapper, path, year, scale):
    # Load the analysis to be run
    import imports.jsConversion as conversion
    mosquitoes = conversion.load_mosquitoes()
    jobs = generate_missing(mosquitoes, path, year)

    # Return if there is nothing to do
    if len(jobs) == 0:
        print('No jobs are missing from {}'.format(path))
        return

    # We've got missing jobs, start by setting the year and scale
    wrapper.init()
    wrapper.set_scale(scale)
    wrapper.set_year(year)
    
    # Prepare the status bar
    status = 0
    progressBar(status, len(jobs.keys()))

    # Iterate through the analysis set
    for key in jobs:
        job = jobs[key]
        wrapper.set_vector(mosquitoes[job[0]])
        wrapper.queue_vector(job[1])
        
        # Note the progress
        status += 1
        progressBar(status, len(jobs.keys()))


def main(args):   
    # Prepare the processor
    import imports.eeWrapper as eeWrapper
    wrapper = eeWrapper.gmsEEWrapper()
    
    # Start queuing the jobs
    if args.missing:
        iterate_missing(wrapper, args.missing, int(args.year), int(args.scale))
    else:
        iterate(wrapper, int(args.year), int(args.scale))    
    print("Queued Jobs: ", wrapper.get_count())


if __name__ == '__main__':
    # Parse the parameters
    parser = argparse.ArgumentParser()
    parser.add_argument('-m', action='store', dest='missing', help='Find the missing results in the given directory')
    parser.add_argument('-s', action='store', dest='scale', default=1000, help='The scale, in meters, to run the sensitivity analysis for default 1000')
    parser.add_argument('-y', action='store', dest='year', required=True, help='The year to run the sensitivity analysis for')
    args = parser.parse_args()
    
    # Verify the parameters
    year = int(args.year)
    if year < 2001 or year > (datetime.date.today().year - 1):
        print('The year must be an integer between 2001 and {} inclusive.'.format((datetime.date.today().year - 1)))
        sys.exit(os.EX_USAGE)
    try:
        if int(args.scale) <= 0:
            print('The scale must be an integer that is greater than zero.')
            sys.exit(os.EX_USAGE)
    except ValueError as ex:
        print('The value provided for the scale, {}, is not a valid integer'.format(args.scale))
        sys.exit(os.EX_USAGE)

    main(args)
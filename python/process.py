#!/usr/bin/python3

# process.py
#
# This script produces summary statistics of the raster files.
import argparse
import imageio
import numpy
import os

from imports.progress import progressBar

HABITAT_INDEX = 2
RISK_INDEX = 3

def main(args):
    # Setup our progress bar
    count = 0
    file_count = sum(len(files) for _, _, files in os.walk(args.path))
    progressBar(count, file_count)

    # Scan all of the files in the directory
    habitat = {}; risk = {}
    for path, subdirs, files in os.walk(args.path):
        for file in files:
            # Update the count first
            count += 1

            # Skip if this is not an image file
            if not file.endswith('.tif'):
                continue

            # Skip files not related to species
            if any(value in file for value in ['landcover', 'temperature', 'rainfall']):
                continue

            # Prepare for analysis
            filename = os.path.join(path, file)
            
            # TODO Process days outside of bounds
            if 'outside_bounds' in file:
                continue

            # Process summary other summary files
            if 'habitat' in file:
                simple_update(habitat, file, filename, HABITAT_INDEX)
            elif 'risk' in file:
                simple_update(risk, file, filename, RISK_INDEX)

            # Update the progress bar
            progressBar(count, file_count)

    # Make sure we show the final progress bar
    progressBar(file_count, file_count)

    save(habitat, 'out/habitat.csv')
    print('Saved habitat.csv!')
    save(risk, 'out/risk.csv')
    print('Saved risk.csv!')
    

# Parse the filename string to get the year, species, and deviation
def parse(filename):
    name = ''
    filename = filename.split('_')
    for ndx in range(1, len(filename)):
        if filename[ndx].replace('.', '').isdigit(): break
        name += filename[ndx] + ' '
    
    # Year, species, deviation
    return int(filename[0]), name.rstrip(), float(filename[ndx])


# Save the data in the dictionary to the filename provided
def save(data, filename):
    header = False

    with open(filename, 'w') as out:
        for species in sorted(data.keys()):
            for deviation in sorted(data[species].keys()):

                # Only write the header once, but make sure we have all of the years
                if not header:
                    out.write('Species,Deviation,{}\n'.format(','.join(str(year) for year in sorted(data[species][deviation].keys()))))
                    header = True

                # Parse the values for the years and write them out
                values = []
                for year in sorted(data[species][deviation].keys()):
                    values.append(str(data[species][deviation][year]))
                out.write('{},{},{}\n'.format(species, deviation, ','.join(values)))


# Update the dictionary supplied with the counts from the given files
def simple_update(dictionary, name, filename, index):
    # Load the relaxant data
    year, species, deviation = parse(name)
    summary = summarize(filename)

    # Save the data to the dictionary
    if species not in dictionary:
        dictionary[species] = {}
    if deviation not in dictionary[species]:
        dictionary[species][deviation] = {}
    dictionary[species][deviation][year] = summary[index]


# Perform a raster summary fo the file provided
def summarize(filename):
    # Load the file and get the summary of unique values
    raster = imageio.imread(filename)
    if len(raster.shape) > 2:
        raise Exception('Image has more than two dimensions, got: {}'.format(len(raster.shape)))
    unique, counts = numpy.unique(raster, return_counts=True)

    # Return the results as a dictionary
    return dict(zip(unique, counts))


if __name__ == '__main__':
    # Parse the arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', action='store', dest='path', required=True, help='The path fo the folder to parse')
    args = parser.parse_args()

    # Make sure out output directory exists
    if not os.path.exists('out'): os.makedirs('out')

    # Defer to main for processing
    main(args)




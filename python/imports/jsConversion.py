# conversions.py
#
# This script is intended to parse some of the files that store lots of data 
# from JavaScript to Python
import geemap
import json
import os
import pathlib


def convert():
    if not os.path.exists('temp'): os.makedirs('temp')
    for file in [ '../assets/features.js', '../assets/gms_wrs2_swaths.js', '../assets/shapefiles.js', '../imports/landsat.js' ]:
        output = file.replace('../assets', 'temp').replace('../imports', 'temp')
        output = output.replace('.js', '.py')
        convert_file(file, output)


def convert_file(input, output):
    TEMP_FILE = '.temp.js'

    # Nested function to strip block comments from the raw JavaScript
    def strip_block_comments(js):
        while js.find('/*') > -1:
            start = js.find('/*')
            end = js[start:].find('*/') + len('*/')
            comment = js[start:start + end]
            js = js.replace(comment, '')
        return js

    # Apply any JavaScript specific changes
    js = pathlib.Path(input).read_text()
    js = strip_block_comments(js)
    with open(TEMP_FILE, 'w') as out:
        out.write(js)

    # Convert to Python and apply any remaining changes
    python = geemap.js_to_python(TEMP_FILE, output, False)
    python = python.replace('exports.', '')
    while python.find('=\n') > -1:
        python = python.replace('=\n', '=')

    # Remove leading whitespaces from assignments
    if 'features.js' in input:
        start = 0
        while python.find('=', start) > -1:
            index = python.find('=', start)
            first = python.rfind(',', start, index)
            if first != -1:
                snippet = python[first:index]
                python = python.replace(snippet, snippet.replace(' ', ''))
            start = index + 1
    
    # Remove the leading function
    if 'landsat.js' in input:
        # NOTE that we are making a lot of assumptions about the layout fo the file here
        start = python.find('def')
        end = python.find('landsat8 =')
        snippet = python[start:end]
        python = python.replace(snippet, '')

    # Save our data and clean-up
    with open(output, 'w') as out:
        out.write(python)
    os.remove(TEMP_FILE)


def load_mosquitoes():
    # Load the basic text and strip any comments from the text that appear at the end of the line
    js = pathlib.Path('../assets/mosquitoes.js').read_text()
    while js.find('//') > -1:
        start = js.find('//')
        end = js[start:].find('\n')
        comment = js[start:start + end]
        js = js.replace(comment, '')

    # Find where the start of the export commands
    js = js[js.find('exports'):]
    js = js.split(';')

    # Parse the export commands as blocks of JSON data, return the dictionary
    mosquitoes = {}
    for block in js:
        if len(block.rstrip()) == 0: continue
        key = block[block.find('.') + 1:block.find(' ')]
        data = block[block.find('{'):block.rfind(',')].replace('\'', '\"') + '}'
        mosquitoes[key] = json.loads(data)    
    return mosquitoes

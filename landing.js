/*
 * training.js
 *
 * This page is intended to be used for training of the landcover classification
 * and testing of the assessment maps.
 */
var exporting = require('users/rzupko/gms-malaria:imports/exporting.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');

// Filter the USGS Landsat 8 Level 2, Collection 2, Tier 1 collection to the 
// selected image for the proof of concept (125, 50, 2020-01-22); an 
// alternative cloud-free image is (125, 51, 2014-01-05)
var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filter(ee.Filter.and(
    ee.Filter.eq('WRS_PATH', 125),
    ee.Filter.eq('WRS_ROW', 50)))
  .filterDate('2020-01-21', '2020-01-23').first();
var results = processing.process(image);

// By adding the Landsat and malaria results to image collections we have a 
// hook for future projects to use additional images additional images can
// be appended to the collection via:
//
// landsat = landsat.merge(ee.ImageCollection.fromImages([image]));
// malaria = malaria.merge(ee.ImageCollection.fromImages([results]));
var landsat = ee.ImageCollection.fromImages([image]);
var malaria = ee.ImageCollection.fromImages([results]);

// Visualize and export the results of the proof of concept
visual.visualizeGms();
visual.visualizeResults(landsat, malaria, true);
exporting.queueExports(results);

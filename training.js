/*
 * training.js
 *
 * This page is intended to be used for training of the landcover classification
 * and testing of the assessment maps.
 */
// var exporting = require('users/rzupko/gms-malaria:imports/exporting.js');
// var visual = require('users/rzupko/gms-malaria:imports/visualization.js');
// var processing = require('users/rzupko/gms-malaria:imports/processing.js');

// Import the assets
var shapefiles = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Import other scripts
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization_wip.js');

// Load the and center the GMS and reference image
var image = ml.getReferenceImage();

Map.centerObject(shapefiles.getGms(), 7);
Map.addLayer(image, visual.viz_gms_rgb, 'Refernece Image (RGB)');
Map.addLayer(image, visual.viz_gms_cir, 'Refernece Image (CIR)');

//var results = processing.process(image);

// By adding the Landsat and malaria results to image collections we have a 
// hook for future projects to use additional images additional images can
// be appended to the collection via:
//
// landsat = landsat.merge(ee.ImageCollection.fromImages([image]));
// malaria = malaria.merge(ee.ImageCollection.fromImages([results]));
// var landsat = ee.ImageCollection.fromImages([image]);
// var malaria = ee.ImageCollection.fromImages([results]);

// Visualize and export the results of the proof of concept
// visual.visualizeGms();
// visual.visualizeResults(landsat, malaria, true);
//exporting.queueExports(results);

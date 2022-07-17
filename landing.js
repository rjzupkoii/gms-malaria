/*
 * landing.js
 *
 * Main entry point for the GMS Malaria project. This Earth Engine App uses
 * Landsat imagery to generate malaria risk rasters based upon land 
 * classification and ecological characteristics.
 */
 
// Import the various assets that we need
var features = require('users/rzupko/gms-malaria:assets/features.js');
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Import the various functional scripts
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var gmsUi = require('users/rzupko/gms-malaria:imports/ui.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Placeholder, will be returned by the UI
var year = '2020';

// Prepare the UI
gmsUi.prepareUI();

// Start by loading the classifier
var classifier = ml.getClassifier(features.getFeatures());
var species = mosquitoes.aDirus;

// Begin loading all of the data 
var gms = shapefile.getGms();
var environmental = processing.getAnnualRainfall(gms, year).rename('rainfall');
environmental = environmental.addBands(processing.getMeanTemperature(gms, year)).rename('temperature');

var bounded = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
var landsat = processing.getImages(gms_wrs2.indices, gms, year);
var classified = landsat.map(function(image) {
  return image.select(ml.classifiedBands).classify(classifier);
});

// Classify the habitat



// Add everything to the UI
visual.visualizeGms();
Map.addLayer(landsat, visual.viz_gms_cir, 'Landsat 8, 2020 (CIR)', false);
Map.addLayer(landsat, visual.viz_gms_rgb, 'Landsat 8, 2020');
Map.addLayer(environmental.select('rainfall'), visual.viz_rainfall, 'CHIRPS/PENTAD', false);
Map.addLayer(temperature, visual.viz_temperature, 'MOD11A1.061', false);
Map.addLayer(bounded, visual.viz_bounds, 'A. dirus / Days Outside Bounds', false);
Map.addLayer(classified, visual.viz_trainingPalette, 'Landcover', false);

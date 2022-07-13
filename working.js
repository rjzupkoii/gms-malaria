// Developmental script for new GMS features / scale-up code.
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Assets that need to be migrated
var features = require('users/rzupko/gms-malaria:imports/features.js');

// Work-in-progress imports
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing_wip.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization_wip.js');

// Placeholder, will be returned by the UI
var year = '2020';

// Placeholders, will be stored in assets per species
var minimum = 11.0;
var maximum = 28.0;

// Start by loading the classifier
var classifier = ml.getClassifier();

// Begin loading all of the data 
var gms = shapefile.getGms();
// var rainfall = processing.getAnnualRainfall(gms, year);
// var bounded = processing.getTemperatureBounds(gms, year, minimum, maximum);
// var temperature = processing.getMeanTemperature(gms, year);
var landsat = processing.getImages(gms_wrs2.indices, gms, year);
var classified = landsat.map(function(image) {
  return image.select(ml.classifiedBands).classify(classifier);
});

// Add everything to the UI
visual.visualizeGms();
// Map.addLayer(rainfall, viz_rainfall, 'CHIRPS/PENTAD');
// Map.addLayer(bounded, viz_bounds, 'A. dirus / Days Outside Bounds');
// Map.addLayer(temperature, viz_temperature, 'MOD11A1.061');
Map.addLayer(landsat, viz_gms_cir, 'Landsat 8, 2020 (CIR)');
Map.addLayer(classified, visual.viz_trainingPalette, 'Landcover');

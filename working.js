// Developmental script for new GMS features / scale-up code.
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

var processing = require('users/rzupko/gms-malaria:imports/processing_wip.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// CIR visualization for the GMS
var viz_gms_cir = {
  'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
  'min' : 7423.785454545455,
  'max' : 22769.123636363634
};

var viz_rainfall = {
  'min' : 24.55,
  'max' : 4497.99,
  'palette' : ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'],
};

// Temperature visualization
var viz_temperature = {
  'min' : 3.94,  
  'max' : 38.0,
  'palette' : [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ] };
  
var viz_bounds = {
  'min' : 0,
  'max' : 366,
  'palette' : ['#2f942e', '#b9191e'],
};

function getClassifier() {
  // Load the training data note that we are loading the training image each
  // time the method runs so this could be improved a bit by just passing the
  // classifier around
  var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 125),
      ee.Filter.eq('WRS_ROW', 50)))
    .filterDate('2020-01-21', '2020-01-23');
  var labeled = landsat.first();
  var polygons = features.getFeatures();
  var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
  
  // Sample the input imagery
  var training = labeled.select(bands).sampleRegions({
    collection: polygons,
    properties: ['class'],
    scale: 30
  });
  
  // Make a SVM classifier and train it
  var classifier = ee.Classifier.libsvm().train({
    features: training,
    classProperty: 'class',
    inputProperties: bands
  });  
}


// Placeholder, will be returned by the UI
var year = '2020';

// Placeholders, will be stored in assets per species
var minimum = 11.0;
var maximum = 28.0;

// Add the Landsat 8 imagery for the GMS to the map
var gms = shapefile.getGms();
// var rainfall = processing.getAnnualRainfall(gms, year);
// var bounded = processing.getTemperatureBounds(gms, year, minimum, maximum);
// var temperature = processing.getMeanTemperature(gms, year);
// var landsat = processing.getImages(gms_wrs2.indices, gms, year);

// Add everything to the UI
visual.visualizeGms();
// Map.addLayer(rainfall, viz_rainfall, 'CHIRPS/PENTAD');
// Map.addLayer(bounded, viz_bounds, 'A. dirus / Days Outside Bounds');
// Map.addLayer(temperature, viz_temperature, 'MOD11A1.061');
// Map.addLayer(landsat, viz_gms_cir, 'Landsat 8, 2020 (CIR)');

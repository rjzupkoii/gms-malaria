/*
 * ml.js
 *
 * This script contains the data and functions related to machine leanring (ML).
 */
var processing = require('users/rzupko/gms-malaria:imports/processing.js');

// Landsat 8 bands that are used for classification
exports.classifiedBands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];

// Get the trained classifer that will be used to determine the landcover class
exports.getClassifier = function(features) {
  // Sample the labeled features
  var image = exports.getReferenceImage();
  var training = image.select(this.classifiedBands).sampleRegions({
    collection: features,
    properties: ['class'],
    scale: 30
  });
  
  // Make a CART classifier, train it, and return the object
  return ee.Classifier.smileCart().train({
    features: training,
    classProperty: 'class',
    inputProperties: this.classifiedBands
  });  
};

// Load the reference image for classification
exports.getReferenceImage = function() {
  // Orginal training data
  var p125_r50 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 125),
      ee.Filter.eq('WRS_ROW', 50)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // Mountainus terrain 
  var p132_r42 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 132),
      ee.Filter.eq('WRS_ROW', 42)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // Kunming, Yunnan province, China
  var p129_r43 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 129),
      ee.Filter.eq('WRS_ROW', 43)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // Tonlé Sap
  var p127_r51 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 127),
      ee.Filter.eq('WRS_ROW', 51)))
    .filterDate('2020-01-01', '2020-12-31');    

  var image = p125_r50.merge(p132_r42).merge(p129_r43).merge(p127_r51);
  return image.map(processing.maskClouds).median();  
};
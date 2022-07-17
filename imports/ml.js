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
  var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 125),
      ee.Filter.eq('WRS_ROW', 50)))
    .filterDate('2020-01-01', '2020-12-31');
  return image.map(processing.maskClouds).median();  
};
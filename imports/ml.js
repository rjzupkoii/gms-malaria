/*
 * ml.js
 *
 * This script contains the data and functions related to machine learning (ML).
 */
var features = require('users/rzupko/gms-malaria:assets/features.js'); 
var landsat = require('users/rzupko/gms-malaria:imports/landsat.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');

// Return the classified landcover for the region provided
exports.classify = function(imagery, year) {
  var satellite = landsat.getSatellite(year);
  var classifier = exports.getClassifier(features.getFeatures(), satellite);  
  var classified = imagery.map(function(image) {
    return image.select(satellite.bands).classify(classifier);
  });  
  return classified.mosaic();
};

// Get the trained classifier that will be used to determine the landcover class
exports.getClassifier = function(features, satellite) {
  // Sample the labeled features
  var image = exports.getReferenceImage(satellite);
  var training = image.select(satellite.bands).sampleRegions({
    collection: features,
    properties: ['class'],
    scale: 30
  });
  
  // Make a CART classifier, train it, and return the object
  return ee.Classifier.smileCart().train({
    features: training,
    classProperty: 'class',
    inputProperties: satellite.bands
  });  
};

// Load the reference image for classification
exports.getReferenceImage = function(satellite) {
  // Original training data
  var p125_r50 = ee.ImageCollection(satellite.collection)
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 125),
      ee.Filter.eq('WRS_ROW', 50)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // Mountainous terrain 
  var p132_r42 = ee.ImageCollection(satellite.collection)
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 132),
      ee.Filter.eq('WRS_ROW', 42)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // Kunming, Yunnan province, China
  var p129_r43 = ee.ImageCollection(satellite.collection)
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 129),
      ee.Filter.eq('WRS_ROW', 43)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // Tonlé Sap
  var p127_r51 = ee.ImageCollection(satellite.collection)
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 127),
      ee.Filter.eq('WRS_ROW', 51)))
    .filterDate('2020-01-01', '2020-12-31');
    
  // 
  var p128_r49 = ee.ImageCollection(satellite.collection)
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 128),
      ee.Filter.eq('WRS_ROW', 49)))
    .filterDate('2020-01-01', '2020-12-31');
  
  var image = p125_r50.merge(p132_r42).merge(p129_r43).merge(p127_r51).merge(p128_r49);
  return image.map(processing.maskClouds).median();  
};
/*
 * ml.js
 *
 * This script contains the data and functions related to machine leanring (ML).
 */

// Landsat 8 bands that are used for classification
exports.classifiedBands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];

// Get the trained classifer that will be used to determine the landcover class
function getClassifier() {
  // TODO Cloud filtering, improve training data
  
  // Load the image for classification
  var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 125),
      ee.Filter.eq('WRS_ROW', 50)))
    .filterDate('2020-01-21', '2020-01-23')
    .mean();

  // Sample the labeled features
  var training = image.select(classifiedBands).sampleRegions({
    collection: features.getFeatures(),
    properties: ['class'],
    scale: 30
  });
  
  // Make a CART classifier, train it, and return the object
  return ee.Classifier.smileCart().train({
    features: training,
    classProperty: 'class',
    inputProperties: classifiedBands
  });  
}
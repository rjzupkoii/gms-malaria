/*
 * landing.js
 *
 * Main entry point for the GMS Malaria project. This Earth Engine App uses
 * Landsat imagery to generate malaria risk rasters based upon land 
 * classification and ecological characteristics.
 */

// Import relevant scripts and data
var exporting = require('users/rzupko/gms-malaria:imports/exporting.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var shapefiles = require('users/rzupko/gms-malaria:imports/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

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
visualizeGms();
visualizeResults(landsat, malaria, false);
queueExports(results);

function visualizeGms() {
  // Load the GMS borders and generate the outlines
  var gms = shapefiles.getGms();
  var empty = ee.Image().byte();
  var outline = empty.paint({
    featureCollection: gms,
    color: 1,
    width: 0.5,
  });
  
  // Update the map
  Map.centerObject(gms, 5);
  Map.addLayer(outline, { palette: '#757575' }, 'Greater Mekong Subregion');
}

function visualizeResults(landsat, image, showInputs) {
  Map.addLayer(landsat, visual.landsatRGB, 'Landsat 8 (RGB, 4-3-2)', false);
  Map.addLayer(image.select('habitat'), visual.habitat, 'Habitat (A. dirus)');
  Map.addLayer(image.select('risk'), visual.habitat, 'Malaria Risk');
  
  if (showInputs) {
    Map.addLayer(image.select('landcover'), visual.trainingPalette, 'Land Use Classification');    
    Map.addLayer(image.select('annual_rainfall'), visual.rainfall, 'Annual Precipitation (mm)');
    Map.addLayer(image.select('mean_temperature'), visual.temperature, 'Mean Land Surface Temperature (C)');
    Map.addLayer(image.select('temperature_bounds'), {min: 0, max: 366}, 'Days Outside of Temperature Bounds');
  }
}
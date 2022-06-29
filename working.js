// Developmental script for new GMS features / scale-up code.

var shapefile = require('users/rzupko/gms-malaria:imports/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Mask the clouds out of the Landsat 8 image
var maskClouds = function(image) {
  // Prepare the masks
  var shadow_mask = (1 << 3);
  var cloud_mask = (1 << 5);
  
  // Select the QA band
  var qa = image.select('pixel_qa');
  
  // Create a mask where the QA masks are set to zero, or clear
  var mask = qa.bitwiseAnd(shadow_mask).eq(0)
         .and(qa.bitwiseAnd(cloud_mask).eq(0));
  
  // Return the masked image
  return image.updateMask(mask);  
};

// Based upon minimum for full coverage of GMS
var CLOUD_COVER = 26;

visual.visualizeGms();

// Get the GMS shapefile
var gms = shapefile.getGms();

// Filter the Landsat 8 imagery to 2020
var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(gms)
  .filterDate('2020-01-01', '2020-12-31')
  .filterMetadata('CLOUD_COVER', 'less_than', CLOUD_COVER);
landsat = landsat.map(maskClouds);

Map.addLayer(landsat)

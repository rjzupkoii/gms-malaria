// Developmental script for new GMS features / scale-up code.

var shapefile = require('users/rzupko/gms-malaria:imports/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Based upon minimum for full cloud-masked coverage of GMS
var CLOUD_COVER = 70;

// Mask for the cloud and cloud shadow bits
var MASK = (1 << 3) | (1 << 4);

// Mask the clouds out of the Landsat 8 image
var maskClouds = function(image) {
  // Create a mask where the QA masks are set to zero, or clear
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(MASK).eq(0);

  // Return the masked image
  return image.updateMask(mask);  
};

function gms_constrained() {
  // Get the GMS shapefile
  var gms = shapefile.getGms();
  Map.centerObject(gms, 5);
  
  // Filter the Landsat 8 imagery to 2020
  var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(gms)
    .filterDate('2020-01-01', '2020-12-31');
  landsat = landsat.map(maskClouds);
  
  var viz_cir = {
    'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
    'min': 6131.18,
    'max': 49339.82
  };
  Map.addLayer(landsat, viz_cir, 'Landsat 8, GMS (CIR)');
}

var gms_wrs2_swaths = ee.FeatureCollection('users/rzupko/gms_wrs2_swaths');
var landsat = gms_wrs2_swaths.map(function(swath) {
  var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', swath.get('PATH')),
      ee.Filter.eq('WRS_ROW', swath.get('ROW'))))
    .filterDate('2020-01-01', '2020-12-31');
  return landsat.mean();
});

  var viz_cir = {
    'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
    'min': 6131.18,
    'max': 49339.82
  };
  Map.addLayer(landsat, viz_cir, 'Landsat 8, GMS (CIR)');


// Developmental script for new GMS features / scale-up code.

var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var shapefile = require('users/rzupko/gms-malaria:imports/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Mask for the cloud and cloud shadow bits
var CLOUD_MASK = (1 << 3);

// Mask the clouds out of the image
var maskClouds = function(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(CLOUD_MASK).eq(0);
  return image.updateMask(mask);  
};

var gms = shapefile.getGms();
var landsat = ee.ImageCollection(gms_wrs2.indicies.map(function(item) {
    item = ee.List(item);
    var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', item.get(0)),
      ee.Filter.eq('WRS_ROW', item.get(1))))
    .filterDate('2020-01-01', '2020-12-31');
  return ee.Image(image.map(maskClouds).mean());
}));
landsat = landsat.map(function(image) {
  return image.clip(gms);
});
Map.centerObject(gms);
Map.addLayer(landsat, [], 'Landsat 8, 2020 (CIR)');
  

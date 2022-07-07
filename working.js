// Developmental script for new GMS features / scale-up code.
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Mask for the cloud and cloud shadow bits
var CLOUD_MASK = (1 << 3);

// Mask the clouds out of the image
var maskClouds = function(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(CLOUD_MASK).eq(0);
  return image.updateMask(mask);  
};

// Get the collection of Landsat images that are constrained to the GMS
function getImages(wrs2, year) {
  var load = function(item) {
    item = ee.List(item);
    var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', item.get(0)),
      ee.Filter.eq('WRS_ROW', item.get(1))))
    .filterDate(year + '-01-01', year + '-12-31');
    return ee.Image(
      image.map(maskClouds).mean().clipToCollection(gms));  
  };
  return ee.ImageCollection(gms_wrs2.indicies.map(load));
}


// CIR visualization for the GMS
var viz_gms_cir = {
  'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
  'min' : 7423.785454545455,
  'max' : 22769.123636363634
};

// Add the Landsat 8 imagery for the GMS to the map
var gms = shapefile.getGms();
var landsat = getImages(gms_wrs2.indicies, '2020');
visual.visualizeGms();
Map.addLayer(landsat, viz_gms_cir, 'Landsat 8, 2020 (CIR)');
  
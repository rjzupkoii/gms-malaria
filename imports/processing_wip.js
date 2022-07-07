/*
 * processing_wip.js
 *
 * Work-in-progress replacement for the processing.js script.
 */

// Get the collection of Landsat images that are constrained to the GMS
exports.getImages = function(indices, aoi, year) {
  var load = function(item) {
    item = ee.List(item);
    var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', item.get(0)),
      ee.Filter.eq('WRS_ROW', item.get(1))))
    .filterDate(year + '-01-01', year + '-12-31');
    return ee.Image(
      image.map(maskClouds).mean().clipToCollection(aoi));  
  };
  return ee.ImageCollection(indices.map(load));
};
 
// Mask for the cloud and cloud shadow bits
var CLOUD_MASK = (1 << 3);

// Mask the clouds out of the image
var maskClouds = function(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(CLOUD_MASK).eq(0);
  return image.updateMask(mask);  
};

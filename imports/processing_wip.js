/*
 * processing_wip.js
 *
 * Work-in-progress replacement for the processing.js script.
 */

// Get the annual rainfall from the CHIPS dataset for the given AOI and year.
exports.getAnnualRainfall = function(aoi, year) {
  var collection = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
    .filterDate(year + '-01-01', year + '-12-31');
  var results = collection.reduce(ee.Reducer.sum());
  return results.clip(aoi);
};

// Get the collection of Landsat images that are constrained to the AOI.
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

// Get the mean temperature from the MOD11A1.006 dataset for the AOI and given year.
exports.getMeanTemperature = function(aoi, year) {
  var temperature = ee.ImageCollection('MODIS/006/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
    
  // Scaled value in K must be converted to C, result = DN * 0.02 - 273.15
  temperature = temperature.map(function(image) {
    var kelvin = image.select('LST_Day_1km');
    var celsius = ee.Image().expression('kelvin * 0.02 - 273.15', {kelvin: kelvin});
    return celsius.rename('LST_Day_1km_celsius');
  });
  
  // Reduce, clip, and return
  return temperature.reduce(ee.Reducer.mean()).clip(aoi);
};

// Get the number of days that the temperature is outside of the bounds, minimum <= temp <= maximum
exports.getTemperatureBounds = function(aoi, year, minimum, maximum) {
  
};
 
// Mask for the cloud and cloud shadow bits
var CLOUD_MASK = (1 << 3);

// Mask the clouds out of the image
var maskClouds = function(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(CLOUD_MASK).eq(0);
  return image.updateMask(mask);  
};

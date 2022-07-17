/*
 * processing.js
 *
 * This script contains the functions related to the processing of the
 * analysis pipeline.
 */

// Get the annual rainfall from the CHIPS dataset for the given AOI and year.
exports.getAnnualRainfall = function(aoi, year) {
  var collection = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
    .filterDate(year + '-01-01', year + '-12-31');
  var results = collection.reduce(ee.Reducer.sum());
  return results.clip(aoi).rename('total_rainfall');
};

// Use raster algebra to score the best habitat
exports.getHabitat = function(variables) {
  
  // var primary = ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (meanTemperature >= speciesTemperature) && (daysOutsideBounds == 0)', variables);
    
  // 
  // var secondary = ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (meanTemperature >= speciesTemperature) && (daysOutsideBounds <= speciesLife)', variables);
    
  // 
  // var tertiary = ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (meanTemperature >= speciesTemperature) && (daysOutsideBounds < aestivationMax)', variables);
  
  // Merge the classifications, highest sum is best habitat
  var habitat = ee.Image(0).expression('primary + secondary + tertiary', {
    // Primary habitat is completely within the environmental envelope
    primary: ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (meanTemperature >= speciesTemperature) && (daysOutsideBounds == 0)', variables), 
    
    // Secondary is within the envelope for the life expectancy
    secondary:  ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (meanTemperature >= speciesTemperature) && (daysOutsideBounds <= speciesLife)', variables), 
    
    // Tertiary is within the envelope for aestivation
    tertiary: ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (meanTemperature >= speciesTemperature) && (daysOutsideBounds < aestivationMax)', variables)
  });
  
  // Rename the band and return
  return habitat.rename('scored_habitat');
}

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
      image.map(exports.maskClouds).median().clipToCollection(aoi));  
  };
  return ee.ImageCollection(indices.map(load));
};

// Get the mean temperature from the MOD11A1.006 dataset for the AOI and given year.
exports.getMeanTemperature = function(aoi, year) {
  var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
    
  // Scaled value in K must be converted to C, result = DN * 0.02 - 273.15
  temperature = temperature.map(function(image) {
    var kelvin = image.select('LST_Day_1km');
    var celsius = ee.Image().expression('kelvin * 0.02 - 273.15', {kelvin: kelvin});
    return celsius.rename('LST_Day_1km_celsius');
  });
  
  // Reduce, clip, and return
  return temperature.reduce(ee.Reducer.mean()).clip(aoi).rename('mean_temperature');
};

// Get the number of days that the temperature is outside of the bounds, minimum <= temp <= maximum
exports.getTemperatureBounds = function(aoi, year, minimum, maximum) {
  // Preform scaled conversion from C to K for the data set
  minimum = (minimum + 273.15) / 0.02;  
  maximum = (maximum + 273.15) / 0.02;  
  
  // Load the data set
  var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
    
  // Map an expression that sets zero if we are within bounds, one if not
  temperature = temperature.map(function(image) {
    return ee.Image(0).expression('(kelvin < minimum) || (maximum < kelvin)',
      { kelvin: image.select('LST_Day_1km'), minimum: minimum, maximum: maximum });
  });
  
  // Clip, sum, and return integers
  temperature = temperature.map(function(image) { return image.clip(aoi); });
  return temperature.reduce(ee.Reducer.sum()).toInt().rename('days_outside_bounds');  
};

// Mask the clouds out of the image
exports.maskClouds = function(image) {
  // Mask for the cloud and cloud shadow bits
  var CLOUD_MASK = (1 << 3);  
  
  // Select the QA pixel, and mask if it is a cloud
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(CLOUD_MASK).eq(0);
  return image.updateMask(mask);  
};

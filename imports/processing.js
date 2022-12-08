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
  // Find the possible habitat and then score it higher if the mean temperature is within bounds
  var habitat = ee.Image(0).expression('(totalRainfall >= speciesRainfall) && (daysOutsideBounds <= 30)', variables);
  habitat = habitat.expression('b(0) + ((b(0) == 1) && (landcover == 11) && ((speciesMeanLower <= meanTemperature) && (meanTemperature <= speciesMeanUpper)))', variables);

  // Rename the band and return
  return habitat.rename('scored_habitat');
};

// Get the collection of Landsat images that are constrained to the AOI.
exports.getImages = function(satellite, indices, aoi, year) {
  var load = function(item) {
    item = ee.List(item);
    var image = ee.ImageCollection(satellite.collection)
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

  temperature = temperature.map(function(image) {
    // Calcluate the daily mean from the daytime and nightime tempatures
    var kelvin = image.expression('(b("LST_Day_1km") + b("LST_Night_1km")) / 2').rename('LST_Mean_1km');
    
    // Scaled value in K must be converted to C, result = DN * 0.02 - 273.15
    var celsius = kelvin.expression('b("LST_Mean_1km") * 0.02 - 273.15');
    return celsius.rename('LST_Mean_1km_celsius');
  });
  
  // Reduce, clip, and return
  return temperature.reduce(ee.Reducer.mean()).clip(aoi).rename('mean_temperature');
};

exports.getRiskAssessment = function(landcover, habitat) {
  // Generate the buffer based upon the land cover type, using cumulative cost  for the
  // buffer isn't exactly the same as a buffer, but results in the same effect
  var buffer = ee.Image(1).cumulativeCost({
    source: landcover.gte(20),                  // Development (20) or Agricultural (21)
    maxDistance: 1500,                          // Obsomer et al. 2007, "very high" density
  }).lt(1500);
  var high = habitat.gt(1).and(landcover.mask(buffer).gte(10));

  buffer = ee.Image(1).cumulativeCost({
    source: landcover.gte(20), 
    maxDistance: 5000,                          // Obsomer et al. 2007, moderate density
  }).lt(5000);
  var moderate = habitat.gt(1).and(landcover.mask(buffer).gte(10));
  
  // Our base risk is when we are within the habitat window and forest/vegitation is present
  var base = habitat.gt(0).and(landcover.eq(11).or(landcover.eq(12)));
  
  // Return the total across the three layers
  return ee.Image(0).expression('base + moderate + high', {
    base: base,
    moderate: moderate.gt(0).unmask(),
    high: high.gt(0).unmask()
  });
};

// Get the number of days that the temperature is outside of the bounds, minimum < temp and temp < maximum
exports.getTemperatureBounds = function(aoi, year, minimum, maximum) {

  // Preform scaled conversion from C to K for the data set
  minimum = (minimum + 273.15) / 0.02;  
  maximum = (maximum + 273.15) / 0.02;  
  
  // Load the data set
  var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
    
  // Map an expression that sets zero if we are within bounds, one if not
  temperature = temperature.map(function(image) {
    return image.expression('(minimum < b("LST_Night_1km")) && (b("LST_Day_1km") < maximum)',
      { 'minimum': minimum, 'maximum': maximum });
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

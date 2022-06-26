/*
 * shapefiles.js
 *
 * This script contains various library functions that return shapefile
 * collections that are used in the App.
 */

// Get the countries and regions that make up the GMS
exports.getGms = function() {
  // Official country and region names
  var admn0_names = ee.List(['Cambodia', 'Lao People\'s Democratic Republic', 'Myanmar', 'Thailand', 'Viet Nam']);
  var admin1_names = ee.List(['Guangxi Zhuangzu Zizhiqu', 'Yunnan Sheng']);  
  
  // Filter on the country names
  var countries = ee.FeatureCollection("FAO/GAUL/2015/level0")
    .filter(ee.Filter.inList('ADM0_NAME', admn0_names));
  
  var regions = ee.FeatureCollection("FAO/GAUL/2015/level1")
    .filter(ee.Filter.inList('ADM1_NAME', admin1_names));  
    
  return countries.merge(regions);
};
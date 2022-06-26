/*
 * shaepfiles.js
 *
 * This script contains various library functions that return shapefile
 * collections that are used in the App.
 */

// Get the countries and regions that make up the GMS
exports.getGms = function() {
  // Offical country names
  var admn0_names = ee.List(['Cambodia', 'Lao People\'s Democratic Republic', 'Myanmar', 'Thailand', 'Viet Nam']);
  
  // Filter on the country names
  var countries = ee.FeatureCollection("FAO/GAUL/2015/level0")
    .filter(ee.Filter.inList('ADM0_NAME', admn0_names));
    
  return countries;
};
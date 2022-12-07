/*
 * landsat.js
 *
 * Wrapper for the Landsat imagery since both Landsat 7 and Landsat 8 are supported.
 */
 
exports.LandsatType = {
  Landsat7 : 'LANDSAT/LE07/C02/T1_L2',
  Landsat8 : 'LANDSAT/LC08/C02/T1_L2',
};
 
exports.getVisualizationRGB = function(type) {
  
}
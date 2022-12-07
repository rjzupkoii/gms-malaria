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
  if (type === exports.LandsatType.Landsat7) {
    return {
      'bands' : ['SR_B3', 'SR_B2', 'SR_B1'],
      'min' : 6100.692307692308,
      'max' : 24248.428571428572
    };
  } else if (type === exports.LandsatType.Landsat8) {
    return {
      'bands' : ['SR_B4', 'SR_B3', 'SR_B2'],
      'min' : 6100.692307692308,
      'max' : 24248.428571428572
    };
  } else {
    throw new Error('Unknown Landsat type');
  }
};
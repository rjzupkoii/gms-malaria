/*
 * landsat.js
 *
 * Wrapper for the Landsat imagery since both Landsat 7 and Landsat 8 are supported.
 */
 
exports.LandsatType = {
  Landsat7 : 'LANDSAT/LE07/C02/T1_L2',
};
 
// Return the classification bands to use for the satellite type indicated.
exports.getBands = function(type) {
  if (type === exports.LandsatType.Landsat7) {
    return ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'];
  } else if (type === exports.LandsatType.Landsat8) {
    return ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
  }
  
  // Shouldn't get here if the enumeration is used
  throw new Error('Unknown Landsat type');  
};
 
// Return the approprate satellite type (i.e., Earth Engine collection) for the year provided.
exports.getSatellite = function(year) {
  if (year > 2013) {
    return {
      'collection' : 'LANDSAT/LC08/C02/T1_L2',
      'bands' : ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
      'name' : 'Landsat 8',
      'viz_cir' : {
        'bands' : ['SR_B4', 'SR_B3', 'SR_B2'],
        'min' : 6100.692307692308,
        'max' : 24248.428571428572
      }, 
      'viz_rgb' : {
        'bands' : ['SR_B4', 'SR_B3', 'SR_B2'],
        'min' : 6100.692307692308,
        'max' : 24248.428571428572
      }
    };
  } else if (year > 2000) {
    return exports.LandsatType.Landsat7;
  }
  
  // Earlier satellites are not supported
  throw new Error('Landsat satellites prior to 2000 are not supported.');
};
 
// Get the CIR visulization for the Landsat satellite provided
exports.getVisualizationCIR = function(type) {
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
  }

  // Shouldn't get here if the enumeration is used
  throw new Error('Unknown Landsat type');
}; 
 
// Get the RGB visulization for the Landsat satellite provided
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
  } 
  
  // Shouldn't get here if the enumeration is used
  throw new Error('Unknown Landsat type');
};

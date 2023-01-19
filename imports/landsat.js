/*
 * landsat.js
 *
 * Wrapper for the Landsat imagery since both Landsat 7 and Landsat 8 are supported.
 */
 
// Return the approprate satellite type (i.e., Earth Engine collection) for the year provided.
exports.getSatellite = function(year) {
  if (year > 2013) {
    return landsat8;
  } else if (year > 2000) {
    return landsat7;
  }
  
  // Earlier satellites are not supported
  throw new Error('Landsat satellites prior to 2000 are not supported.');
};

// Properties for Landsat 8 data
landsat8 = {
  'collection' : 'LANDSAT/LC08/C02/T1_L2',
  'bands' : ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
  'name' : 'Landsat 8',
  'viz_cir' : {
    'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
    'min' : 7423.785454545455,
    'max' : 22769.123636363634
  }, 
  'viz_rgb' : {
    'bands' : ['SR_B4', 'SR_B3', 'SR_B2'],
    'min' : 6100.692307692308,
    'max' : 24248.428571428572
  }
};
   
// Properties for Landsat 8 data
landsat7 = {
  'collection' : 'LANDSAT/LE07/C02/T1_L2',
  'bands' : ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'],
  'name' : 'Landsat 7',
  'viz_cir' : {
    'bands' : ['SR_B4', 'SR_B3', 'SR_B2'],
    'min' : 6100.692307692308,
    'max' : 24248.428571428572
  },
  'viz_rgb' : {
    'bands' : ['SR_B3', 'SR_B2', 'SR_B1'],
    'min' : 6100.692307692308,
    'max' : 24248.428571428572
  }
};
/*
 * visualization.js
 *
 * This script is intended as a library that contains the various visualizations that
 * are being used by the application.
 */

// Days outside bounds visualization for vectors, 31 is used for the upper bound since
// more than a month outside the bounds is going to be unsuitable for the species.
exports.viz_bounds = {
  'min' : 0,
  'max' : 31,
  'palette' : ['#2f942e', '#b9191e'],
};

// RGB vizualization for the GMS
exports.viz_gms_rgb = {
  'bands' : ['SR_B4', 'SR_B3', 'SR_B2'],
  'min' : 6100.692307692308,
  'max' : 24248.428571428572
};

// CIR visualization for the GMS
exports.viz_gms_cir = {
  'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
  'min' : 7423.785454545455,
  'max' : 22769.123636363634
};

// Rainfall visualization for the GMS
exports.viz_rainfall = {
  'min' : 24.55,
  'max' : 4497.99,
  'palette' : ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'],
};

// Temperature visualization for the GMS
exports.viz_temperature = {
  'min' : 3.94,  
  'max' : 38.0,
  'palette' : [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ]
};

// Color palette for habitat visualization
exports.viz_habitatPalette = { 
  min: 0, 
  max: 3, 
  palette: ['#bdbdbd', '#fee8c8', '#fdbb84', '#e34a33'] 
};

// Color palette for risk visulaiation
exports.vis_riskPalette = {
  min: 0,
  max: 3,
  palette: ['#abd9e9', '#ffffbf', '#fdae61', '#d7191c']
};

// Color palette for the training data, note that Deep
// Pink is a sentinel value for invalid classifications
exports.viz_trainingPalette = { 
  min: 1, 
  max: 22, 
  palette: [
    'deeppink',     // 1, Burned [black, Deprecated]
    'aliceblue',    // 2, Snow
    'gray',         // 3, Shadow / occulted
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink',
    'blue',         // 10, Water
    'darkgreen',    // 11, Forest
    'green',        // 12, Vegetation
    'darkseagreen', // 13, Vegetation / Scrub
    'saddlebrown',  // 14, Barren
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink',
    'red',          // 20, Development
    'wheat',        // 21, Agricultural
    'deeppink'      // 22, Agricultural / Fallow [linen, Deprecated]
  ] };

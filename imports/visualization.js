/*
 * visualization.js
 *
 * This script is intended as a library that contains data and functions 
 * related to visualization and raster rendering.
 */
var shapefiles = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Days outside bounds visualization for vectors
exports.viz_bounds = {
  'min' : 0,
  'max' : 366,
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

// Color palette for habitat / risk visualization
exports.viz_habitatPalette = { 
  min: 0, 
  max: 3, 
  palette: ['#bdbdbd', '#fee8c8', '#fdbb84', '#e34a33'] 
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
    'brown',        // 14, Barren
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink',
    'red',          // 20, Development
    'wheat',        // 21, Agricultural
    'deeppink'      // 22, Agricultural / Fallow [linen, Deprecated]
  ] };

// Simplified color palette for the training data
exports.viz_simpleLandcoverPalette = { 
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
    'green',        // 11, Forest
    'green',        // 12, Vegetation
    'green',        // 13, Vegetation / Scrub
    'brown',        // 14, Barren
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink', 
    'deeppink',
    'red',          // 20, Development
    'wheat',        // 21, Agricultural
    'deeppink'      // 22, Agricultural / Fallow [linen, Deprecated]
  ] };

// Adds a layer to the map for each of the training data polygon categories defined.
exports.addTrainingPolygons = function(polygons) {
  layerStyles.forEach(function(item) {
    styleTraining(polygons, item.class, item.type, item.color);  
  });
};

// Add a layer to the map with the GMS outlined
exports.visualizeGms = function() {
  // Load the GMS borders and generate the outlines
  var gms = shapefiles.getGms();
  var empty = ee.Image().byte();
  var outline = empty.paint({
    featureCollection: gms,
    color: 1,
    width: 0.5,
  });
  
  // Update the map
  Map.centerObject(gms, 5);
  Map.addLayer(outline, { palette: '#757575' }, 'Greater Mekong Subregion');
};

// ---------------------------------------------------------------------------
// Internal data and function(s)
// ---------------------------------------------------------------------------

// Training data and land cover classification visualizations
var layerStyles = [
  { 'class' : 1, 'type' : 'Burned / Fire', 'color' : 'black' },
  { 'class' : 10, 'type' : 'Water', 'color' : 'blue' },
  { 'class' : 11, 'type' : 'Forest', 'color' : 'darkgreen' },
  { 'class' : 12, 'type' : 'Vegetation', 'color' : 'green' },
  { 'class' : 13, 'type' : 'Vegetation / Scrub', 'color' : 'darkseagreen' },  
  { 'class' : 14, 'type' : 'Barren', 'color' : 'brown' },
  { 'class' : 20, 'type' : 'Development', 'color' : 'red' },
  { 'class' : 21, 'type' : 'Agricultural', 'color' : 'wheat' },
  { 'class' : 22, 'type' : 'Agricultural - Fallow', 'color' : 'linen' },
];  

function styleTraining(collection, value, label, color) {
  var items = collection.filter(ee.Filter.eq('class', value));
  items = items.style(color);
  Map.addLayer(items, {}, 'Training - ' + label);
}
  
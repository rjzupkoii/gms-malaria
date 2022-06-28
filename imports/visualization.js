/*
 * visualization.js
 *
 * This script is intended as a library that contains data and functions 
 * related to visualization and raster rendering.
 */
var shapefiles = require('users/rzupko/gms-malaria:imports/shapefiles.js');
 
// Landsat 8 visualizations
var landsatRGB = { 
  bands: ['SR_B4', 'SR_B3', 'SR_B2'], 
  min: 6983, 
  max: 13309 
};
var landsatCIR = { 
  bands: ['SR_B5', 'SR_B4', 'SR_B3'], 
  min: 8095, 
  max: 19581 
};

// Habitat / Risk visualization
var habitat = { 
  min: 0, 
  max: 3, 
  palette: ['blue', 'yellow', 'orange', 'red'] 
};

// Rainfall visualization
var rainfall =  { 
  min: 1091, 
  max: 3112, 
  palette: ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'] 
};

// Temperature visualization
var temperature = {
  min: 19.1,  
  max: 36.1,
  palette: [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ] };

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

// Deep Pink is a sentinel value for invalid classifications
var trainingPalette = { 
  min: 1, 
  max: 22, 
  palette: [
    'black',        // 1, Burned
    'deeppink', 
    'deeppink', 
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
    'linen'         // 22, Agricultural / Fallow
  ] };

// Adds a layer to the map for each of the training data polygon categories defined.
exports.addTrainingPolygons = function(polygons) {
  layerStyles.forEach(function(item) {
    styleTraining(polygons, item.class, item.type, item.color);  
  });
};

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
  Map.centerObject(gms, 6);
  Map.addLayer(outline, { palette: '#757575' }, 'Greater Mekong Subregion');
};

exports.visualizeResults = function(landsat, image, showInputs) {
  Map.addLayer(landsat, landsatRGB, 'Landsat 8 (RGB, 4-3-2)', false);
  Map.addLayer(image.select('habitat'), habitat, 'Habitat (A. dirus)');
  Map.addLayer(image.select('risk'), habitat, 'Malaria Risk');
  
  if (showInputs) {
    Map.addLayer(image.select('landcover'), trainingPalette, 'Land Use Classification');    
    Map.addLayer(image.select('annual_rainfall'), rainfall, 'Annual Precipitation (mm)');
    Map.addLayer(image.select('mean_temperature'), temperature, 'Mean Land Surface Temperature (C)');
    Map.addLayer(image.select('temperature_bounds'), {min: 0, max: 366}, 'Days Outside of Temperature Bounds');
  }
};

function styleTraining(collection, value, label, color) {
  var items = collection.filter(ee.Filter.eq('class', value));
  items = items.style(color);
  Map.addLayer(items, {}, 'Training - ' + label);
}

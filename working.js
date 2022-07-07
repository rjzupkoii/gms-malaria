// Developmental script for new GMS features / scale-up code.
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

var processing = require('users/rzupko/gms-malaria:imports/processing_wip.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// CIR visualization for the GMS
var viz_gms_cir = {
  'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
  'min' : 7423.785454545455,
  'max' : 22769.123636363634
};

var viz_rainfall = {
  'min' : 24.55,
  'max' : 4497.99,
  'palette' : ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'],
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

// Add the Landsat 8 imagery for the GMS to the map
var gms = shapefile.getGms();
var rainfall = processing.getAnnualRainfall(gms, '2020');
var temperature = processing.getMeanTemperature(gms, '2020');

visual.visualizeGms();
Map.addLayer(rainfall, viz_rainfall, 'CHIRPS/PENTAD');
Map.addLayer(temperature, temperature, 'MOD11A1.006');

//var landsat = processing.getImages(gms_wrs2.indices, gms, '2020');

// visual.visualizeGms();
// Map.addLayer(landsat, viz_gms_cir, 'Landsat 8, 2020 (CIR)');

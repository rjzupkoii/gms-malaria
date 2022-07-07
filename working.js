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

// Add the Landsat 8 imagery for the GMS to the map
var gms = shapefile.getGms();
var landsat = processing.getImages(gms_wrs2.indices, gms, '2020');
visual.visualizeGms();
Map.addLayer(landsat, viz_gms_cir, 'Landsat 8, 2020 (CIR)');

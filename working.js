// Developmental script for new GMS features / scale-up code.

var shapefile = require('users/rzupko/gms-malaria:imports/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

var gms = shapefile.getGms();

visual.visualizeGms();

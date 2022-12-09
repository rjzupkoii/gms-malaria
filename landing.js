/*
 * landing.js
 *
 * Main entry point for the GMS Malaria project. This Earth Engine App uses
 * Landsat imagery to generate malaria risk rasters based upon land 
 * classification and ecological characteristics.
 */
var gmsUi = require('users/rzupko/gms-malaria:imports/ui.js');

// gmsUi.prepareUI();
// gmsUi.renderMaps();

var widgets = require('users/rzupko/gms-malaria:imports/widgets.js');
var visual = require('users/rzupko/gms-malaria:assets/visualization.js');

var panel = widgets.createColorBar('Days Outside Bounds', visual.viz_bounds);
Map.add(panel);
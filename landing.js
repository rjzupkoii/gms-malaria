/*
 * landing.js
 *
 * Main entry point for the GMS Malaria project. This Earth Engine App uses
 * Landsat imagery to generate malaria risk rasters based upon land 
 * classification and ecological characteristics.
 */
var gmsUi = require('users/rzupko/gms-malaria:imports/ui.js');

gmsUi.prepareUI();
gmsUi.renderMaps();

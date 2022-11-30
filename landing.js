/*
 * landing.js
 *
 * Main entry point for the GMS Malaria project. This Earth Engine App uses
 * Landsat imagery to generate malaria risk rasters based upon land 
 * classification and ecological characteristics.
 */
var gmsUi = require('users/rzupko/gms-malaria:imports/ui.js');

var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js'); 

gmsUi.prepareUI();
gmsUi.renderMaps();
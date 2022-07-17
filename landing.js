/*
 * landing.js
 *
 * Main entry point for the GMS Malaria project. This Earth Engine App uses
 * Landsat imagery to generate malaria risk rasters based upon land 
 * classification and ecological characteristics.
 */
 
// Import the various assets that we need
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Import the various functional scripts
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var gmsUi = require('users/rzupko/gms-malaria:imports/ui.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Placeholders, these will (eventually) be managed by the UI itself
var year = '2020';
var species = mosquitoes.aDirus;

// Prepare the UI
gmsUi.prepareUI();

// Start by drawing the GMS
var gms = shapefile.getGms();
visual.visualizeGms();

// Next add the base Landsat layers
var landsat = processing.getImages(gms_wrs2.indices, gms, year);
Map.addLayer(landsat, visual.viz_gms_cir, 'Landsat 8, 2020 (CIR)', false);
Map.addLayer(landsat, visual.viz_gms_rgb, 'Landsat 8, 2020');

// Prepare the environmental and intermediate data needed
var environmental = processing.getAnnualRainfall(gms, year);
environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
// var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax).rename('bounds');
// var landcover = ml.classify(landsat);

// Add everything to the UI
Map.addLayer(environmental.select('total_rainfall'), visual.viz_rainfall, 'Total Annual Rainfal, CHIRPS/PENTAD', false);
Map.addLayer(environmental.select('mean_temperature'), visual.viz_temperature, 'Mean Temperature, MOD11A1.061', false);
// Map.addLayer(intermediate, visual.viz_bounds, 'A. dirus / Days Outside Bounds', false);
// Map.addLayer(landcover, visual.viz_trainingPalette, 'Landcover', false);

// // Classify the habitat based upon the inputs
//   var variables = {
//     rainfall: inputs.rainfall, 
//     minRainfall: inputs.annualRainfall, 
//     temperature: inputs.temperature, 
//     minTemp: inputs.minimumMeanTemperature,
//     bounds: inputs.bounds};
  
//   // Primary habitat is completely within the environmental envelope
//   var primary = ee.Image(0).expression('(rainfall > minRainfall) && (temperature >= minTemp) && (bounds == 0)', variables);
    
//   // Secondary is within the envelope for the life expectancy of an active female (43 days)
//   var secondary = ee.Image(0).expression('(rainfall > minRainfall) && (temperature >= minTemp) && (bounds < 43)', variables);
    
//   // Tertiary is within the envelope for the dormant life expectancy of a female (180 days)
//   var tertiary = ee.Image(0).expression('(rainfall > minRainfall) && (temperature >= minTemp) && (bounds < 180)', variables);
  
//   // Merge the classifications and return
//   var habitat = ee.Image(0).expression('primary + secondary + tertiary', {primary: primary, secondary: secondary, tertiary: tertiary});

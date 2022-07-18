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
var visual = require('users/rzupko/gms-malaria:assets/visualization.js');

// Import the various functional scripts
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var gmsUi = require('users/rzupko/gms-malaria:imports/ui.js');

// Prepare the UI
gmsUi.prepareUI();

var select = ui.Select({
  items: ['A. baimaii', 'A. crascens', 'A. dirus'],
  value: 'A. dirus',
  style: {
    position: 'top-right',
  },
  onChange: function(value) {
    var year = '2020';
    
    switch(value) {
      case 'A. baimaii': refresh(year, mosquitoes.aBaimaii); break;
      case 'A. crascens': refresh(year, mosquitoes.aCrascens); break;
      case 'A. dirus': refresh(year, mosquitoes.aDirus); break;
    } 
  }
});

Map.add(select);

function refresh(year, species) {
  // Next add the base Landsat layers
  var landsat = processing.getImages(gms_wrs2.indices, gms, year);
  Map.addLayer(landsat, visual.viz_gms_cir, 'Landsat 8, 2020 (CIR)', false);
  Map.addLayer(landsat, visual.viz_gms_rgb, 'Landsat 8, 2020');
  
  // Process the data that only changes based on the year
  var environmental = processing.getAnnualRainfall(gms, year);
  environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
  var landcover = ml.classify(landsat);
  
  // Process the data that changes based upon the species selected
  var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
  
  // Classify the habitat based upon the inputs
  var habitat = processing.getHabitat({
      // Raster data
      'totalRainfall'      : environmental.select('total_rainfall'),
      'meanTemperature'    : environmental.select('mean_temperature'),
      'daysOutsideBounds'  : intermediate.select('days_outside_bounds'),
      
      // Species data
      'speciesRainfall'    : species.rainfall,
      'speciesTemperature' : species.tempMin,
      'speciesLife'        : species.lifeExpectancy,
      'aestivationMax'     : species.aestivationMax
  });
  
  // Prepare the risk assessment based upon the landcover and habitat
  var risk = processing.getRiskAssessment(landcover, habitat);
  
  // Base data that only needs to be done once for the year selected
  Map.addLayer(environmental.select('total_rainfall'), visual.viz_rainfall, 'Total Annual Rainfal, CHIRPS/PENTAD', false);
  Map.addLayer(environmental.select('mean_temperature'), visual.viz_temperature, 'Mean Temperature, MOD11A1.061', false);
  Map.addLayer(landcover, visual.viz_trainingPalette, 'Classified Landcover', false);
  
  // Intermediate data for the Anopheles genus selected
  Map.addLayer(intermediate.select('days_outside_bounds'), visual.viz_bounds, species.species + ' / Days Outside Bounds', false);
  
  // Anopheles genus specific data
  Map.addLayer(habitat, visual.viz_habitatPalette, species.species + ' / Probable Habitat');
  Map.addLayer(risk, visual.vis_riskPalette, species.species + ' / Malaria Risk');  
}

// Start by drawing the GMS
var gms = shapefile.getGms();
gmsUi.visualizeGms();

refresh('2020', mosquitoes.aDirus);



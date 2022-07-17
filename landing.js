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

// Placeholders, these will (eventually) be managed by the UI itself
var year = '2020';
var species = mosquitoes.aDirus;

// Prepare the UI
gmsUi.prepareUI();

// Start by drawing the GMS
var gms = shapefile.getGms();
gmsUi.visualizeGms();

// Next add the base Landsat layers
var landsat = processing.getImages(gms_wrs2.indices, gms, year);
Map.addLayer(landsat, visual.viz_gms_cir, 'Landsat 8, 2020 (CIR)', false);
Map.addLayer(landsat, visual.viz_gms_rgb, 'Landsat 8, 2020');

// Prepare the environmental and intermediate data needed
var environmental = processing.getAnnualRainfall(gms, year);
environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
var landcover = ml.classify(landsat);

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

function riskAssessment(landcover, habitat) {
  // Generate the buffer based upon the land cover type, using cumulative cost  for the
  // buffer isn't exactly the same as a buffer, but results in the same effect
  var buffer = ee.Image(1).cumulativeCost({
    source: landcover.gte(20),                  // Development (20) or Agricultural (21)
    maxDistance: 1500,                          // Obsomer et al. 2007, "very high" density
  }).lt(1500);
  var high = habitat.gt(0).and(landcover.mask(buffer).gte(20));

  buffer = ee.Image(1).cumulativeCost({
    source: landcover.gte(20), 
    maxDistance: 5000,                        // Obsomer et al. 2007, moderate density
  }).lt(5000);
  var moderate = habitat.gt(0).and(landcover.mask(buffer).gte(20));
  
  // Our base risk is when we are within the habitat window and forest/vegitation is present
  var base = habitat.gt(0).and(landcover.eq(11).or(landcover.eq(12)));
  
  // Return the total across the three layers
  return ee.Image(0).expression('base + moderate + high', {
    base: base,
    high: high.gt(0).unmask(),
    moderate: moderate.gt(0).unmask()
  });
}

var risk = riskAssessment(landcover, habitat);

// Add the enviornmental and intermediate data to the UI, note it is off by default
Map.addLayer(environmental.select('total_rainfall'), visual.viz_rainfall, 'Total Annual Rainfal, CHIRPS/PENTAD', false);
Map.addLayer(environmental.select('mean_temperature'), visual.viz_temperature, 'Mean Temperature, MOD11A1.061', false);
Map.addLayer(intermediate.select('days_outside_bounds'), visual.viz_bounds, 'A. dirus / Days Outside Bounds', false);
Map.addLayer(landcover, visual.viz_trainingPalette, 'Landcover', false);

// Add the species and malaria risk layers
Map.addLayer(habitat, visual.viz_habitatPalette, 'A. dirus / Probable Habitat', false);
Map.addLayer(risk, visual.vis_riskPalette, 'A. dirus / Malaria Risk');

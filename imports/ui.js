/*
 * ui.js
 *
 * This script contains various functions realted to setting up and working 
 * with UI elements. Some of the functions (ex., addSpecies, addYear) are 
 * debatably processing related, but bulk of the work is UI driven.
 */
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Global environmental and landcover variables
var environmental = null, gms = null, landcover = null;

// Placeholder for the year, should be pulled from the UI slider
var year = '2020';

// Calculate and add the species specific data to the map
function addSpecies(year, species) {
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
  
  // Intermediate data for the Anopheles genus selected
  Map.addLayer(intermediate.select('days_outside_bounds'), visual.viz_bounds, species.species + ' / Days Outside Bounds, ' + year, false);
  
  // Anopheles genus specific data
  Map.addLayer(habitat, visual.viz_habitatPalette, species.species + ' / Probable Habitat, ' + year);
  Map.addLayer(risk, visual.vis_riskPalette, species.species + ' / Malaria Risk, ' + year);  
}

// Calculate and ddd the year specific data to the map
 function addYear(year) {
  // Next add the base Landsat layers
  var landsat = processing.getImages(gms_wrs2.indices, gms, year);
  Map.addLayer(landsat, visual.viz_gms_cir, 'Landsat 8, ' + year + ' (CIR)', false);
  Map.addLayer(landsat, visual.viz_gms_rgb, 'Landsat 8, ' + year);
  
  // Process the data that only changes based on the year
  environmental = processing.getAnnualRainfall(gms, year);
  environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
  landcover = ml.classify(landsat);
  
  // Base data that only needs to be done once for the year selected
  Map.addLayer(environmental.select('total_rainfall'), visual.viz_rainfall, 'Total Annual Rainfal, ' + year + ' (CHIRPS/PENTAD)', false);
  Map.addLayer(environmental.select('mean_temperature'), visual.viz_temperature, 'Mean Temperature, ' + year + ' (MOD11A1.061)', false);
  Map.addLayer(landcover, visual.viz_trainingPalette, 'Classified Landcover, ' + year, false);
}

// Prepare the initial UI state
exports.prepareUI = function() {
  Map.add(getSpeciesSelect());
  Map.add(getEnvironmentalCheckbox());  
  Map.add(getIntermediateCheckbox());
};

exports.renderMaps = function() {
  // Next render the GMS, hold on to the shapefile
  gms = shapefile.getGms();
  exports.visualizeGms();
  
  // Add the default year and species to the map
  addYear(year);
  addSpecies(year, mosquitoes.aDirus);  
};

// Add a layer to the map with the GMS outlined
exports.visualizeGms = function() {
  // Load the GMS borders and generate the outlines
  var gms = shapefile.getGms();
  var empty = ee.Image().byte();
  var outline = empty.paint({
    featureCollection: gms,
    color: 1,
    width: 0.5,
  });
  
  // Update the map
  Map.centerObject(gms, 5);
  Map.addLayer(outline, { palette: '#757575' }, 'Greater Mekong Subregion');
};

// Return a checkbox that toggles environmental maps
function getEnvironmentalCheckbox(){
  return ui.Checkbox({
    label: 'Show Environmental Maps',
    onChange: function(checked) {
      Map.layers().get(3).setShown(checked);  // Total rainfall, CHIRPS/PENTAD
      Map.layers().get(4).setShown(checked);  // Mean temperature, MOD11A1.061
    },
    style: {
      position: 'top-right'
    }
  });
}

// Return a checkbox that toggles intermediate maps
function getIntermediateCheckbox() {
  return ui.Checkbox({
    label: 'Show Intermediate Maps',
    onChange: function(checked) {
      Map.layers().get(5).setShown(checked);  // A. dirus / Days Outside Bounds
      Map.layers().get(6).setShown(checked);  // Landcover
    },
    style: {
      position: 'top-right'
    }
  });
}

// Return a select dropdown box that allows the species to be selected
// TODO Generate the list of species in a more dynamic matter
function getSpeciesSelect() {
  return ui.Select({
    items: ['A. baimaii', 'A. crascens', 'A. dirus'],
    value: 'A. dirus',
    style: {
      position: 'top-right',
    },
    onChange: function(value) {
      // TODO Get the year from the slider
      var year = '2020';
      
      removeLayers(6, 8);
      switch(value) {
        case 'A. baimaii': addSpecies(year, mosquitoes.aBaimaii); break;
        case 'A. crascens': addSpecies(year, mosquitoes.aCrascens); break;
        case 'A. dirus': addSpecies(year, mosquitoes.aDirus); break;
      } 
    }
  });
}

// Remove the indicated layers from the map, by index
function removeLayers(first, last) {
  var layers = Map.layers();
  for (var ndx = 8; ndx >= 6; ndx--) {
    var layer = layers.get(ndx);
    Map.remove(layer);
  }
}

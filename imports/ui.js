/*
 * ui.js
 *
 * This script contains various functions realted to setting up and working 
 * with UI elements. Some of the functions (ex., addSpecies, addYear) are 
 * debatably processing related, but bulk of the work is UI driven.
 */
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js'); 
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:assets/visualization.js');

var landsat = require('users/rzupko/gms-malaria:imports/landsat.js');
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var widgets = require('users/rzupko/gms-malaria:imports/widgets.js');

// Global environmental and landcover variables
var environmental = null, gms = null, landcover = null;

// Global year and species variables, default values
var year = 2020, species = mosquitoes.aDirus;

// Global legend panel element, default state
var legend = null;

// Prepare the initial UI state
exports.prepareUI = function() {
  // Disable drawing
  Map.drawingTools().setShown(false);
  
  // Add the tool panel with the controls
  var toolPanel = ui.Panel([
      ui.Label('Greater Mekong Subregion: Malaria Vector Risk Assessment',
        { fontSize: '1.5em', fontWeight: 'bold'}),
      ui.Label('Risk assessment is based upon environmental envelope for the Anopheles species selected and proximity to human development in the given year.'),
      getSpeciesSelect(),
      getYearSlider(),
      ui.Label(' '),
      ui.Label(' '),
      ui.Label('Intermediate Maps include the days outside the species envelope, and landcover for the selected year.'),
      getIntermediateCheckbox(),
      ui.Label(' '),
      ui.Label('Environmental Maps are used to assess the environmental suitability for the selected species.'),
      getEnvironmentSelect(),
    ], 
    'flow', { 'width' : '250px' });
  ui.root.widgets().add(toolPanel);
  
  // Register the hook to detect the change in layer
  Map.drawingTools().onLayerSelect(function(selected, widget) {
    print('selected');
  });

  // Add the default legend
  legend = widgets.createColorBar('Days Outside Bounds', visual.viz_bounds);
  Map.add(legend);  
};

// Render the default selections (i.e., 2020, A. dirus) to the map
exports.renderMaps = function() {
  // Next render the GMS, hold on to the shapefile
  gms = shapefile.getGms();
  visualizeGms();
  
  // Add the default year and species to the map
  addYear(year);
  addSpecies(year, species);  
};

// ---------------------------------------------------------------------------
// Strictly UI related functions
// ---------------------------------------------------------------------------

// Return a checkbox that toggles environmental maps
function getEnvironmentalCheckbox(){
  return ui.Checkbox({
    label: 'Show Environmental Maps',
    onChange: function(checked) {
      Map.layers().get(3).setShown(checked);  // Total rainfall, CHIRPS/PENTAD
      Map.layers().get(4).setShown(checked);  // Mean temperature, MOD11A1.061
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
    }
  });
}

function getEnvironmentSelect() {
  return ui.Select({
    style: {
      width: '225px',
    },
    onChange: function(value) {
      selectCallback(value, this);
    }
  });
}

function selectCallback(value, caller) {
  print(value);
  print(caller);
}

// Return a select dropdown box that allows the species to be selected
function getSpeciesSelect() {
  // Load the species names
  var speciesList = [];
  for (var key in mosquitoes) {
    speciesList.push(mosquitoes[key].species);
  }
  
  return ui.Select({
    items: speciesList,
    value: mosquitoes.aDirus.species,
    style: {
      width: '225px',
    },
    onChange: function(value) {
      removeLayers(6, 8);
      for (var key in mosquitoes) {
        if (mosquitoes[key].species.localeCompare(value) === 0) {
          addSpecies(year, mosquitoes[key]);
          return;
        }
      }
      
      // Since this is called from a UI element, this shouldn't happen
      throw new Error('Unexpected error occured while processing UI event, received: '.concat(value));
    }
  });
}

// Return a select dropdown box that allows the year to be selected, note that we are constained by
// the MODIS/061/MOD11A1 data set which runs from Feburary 2000 to present.
function getYearSlider() {
  return ui.Slider({
    min: 2001, max: new Date().getFullYear() - 1, 
    step: 1,
    value: year,
    style: {
      width: '225px',
      fontWeight: 'bold'
    },
    onChange: function(value) {
      year = value;
      removeLayers(1, 8);
      addYear(year);
      addSpecies(year, species);  
    }
  });
}

// Remove the indicated layers from the map, by index
function removeLayers(first, last) {
  var layers = Map.layers();
  for (var ndx = last; ndx >= first; ndx--) {
    var layer = layers.get(ndx);
    Map.remove(layer);
  }
}

// ---------------------------------------------------------------------------
// Processing and UX related UI functions
// ---------------------------------------------------------------------------

// Calculate and add the species specific data to the map
function addSpecies(year, species) {
  // Process the data that changes based upon the species selected
  var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
  
  // TODO Update this to be a proper slider, for now just use the lower bound
  var sd = species.tempMeanSD[0];
  
  // Classify the habitat based upon the inputs
  var habitat = processing.getHabitat({
      // Raster data
      'totalRainfall'     : environmental.select('total_rainfall'),
      'meanTemperature'   : environmental.select('mean_temperature'),
      'daysOutsideBounds' : intermediate.select('days_outside_bounds'),
      'landcover'         : landcover,
      
      // Species data
      'speciesRainfall'   : species.rainfall,
      'speciesMeanLower'  : species.tempMean[0] - sd,
      'speciesMeanUpper'  : species.tempMean[1] + sd,
      'speciesLife'       : species.lifeExpectancy
  });
  
  // Prepare the risk assessment based upon the landcover and habitat
  var risk = processing.getRiskAssessment(landcover, habitat);
  
  // Intermediate data for the Anopheles genus selected
  Map.addLayer(intermediate.select('days_outside_bounds'), visual.viz_bounds, species.species + ' / Days Outside Bounds, ' + year, false);
  
  // Anopheles genus specific data
  Map.addLayer(habitat, visual.viz_habitatPalette, species.species + ' / Probable Habitat, ' + year);
  Map.addLayer(risk, visual.vis_riskPalette, species.species + ' / Malaria Risk, ' + year, false);  
}

// Calculate and ddd the year specific data to the map
 function addYear(year) {
  // Next add the base Landsat layers
  var satellite = landsat.getSatellite(year);
  var imagery = processing.getImages(satellite, gms_wrs2.indices, gms, year);
  
  Map.addLayer(imagery, satellite.viz_cir, satellite.name + ', ' + year + ' (CIR)', false);
  Map.addLayer(imagery, satellite.viz_rgb, satellite.name + ', ' + year);
  
  // Process the data that only changes based on the year
  environmental = processing.getAnnualRainfall(gms, year);
  environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
  landcover = ml.classify(imagery, year);

  // Base data that only needs to be done once for the year selected
  addLayer(environmental.select('total_rainfall'), visual.viz_rainfall, 'Total Annual Rainfal, ' + year + ' (CHIRPS/PENTAD)');
  addLayer(environmental.select('mean_temperature'), visual.viz_temperature, 'Mean Temperature, ' + year + ' (MOD11A1.061)');
  addLayer(landcover, visual.viz_trainingPalette, 'Classified Landcover, ' + year);
}

function addLayer(data, visualization, label) {
  var layer = ui.Map.Layer(data, visualization, label);  
  
  print(ui.root.widgets()[1])
}

// Add a layer to the map with the GMS outlined
function visualizeGms() {
  // Load the GMS borders and generate the outlines
  var gms = shapefile.getGms();
  var empty = ee.Image().byte();
  var outline = empty.paint({
    featureCollection: gms,
    color: 1,
    width: 0.5,
  });
  
  // Update the map
  Map.centerObject(gms, 6);
  Map.addLayer(outline, { palette: '#757575' }, 'Greater Mekong Subregion');
}

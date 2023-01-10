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
var uiux = require('users/rzupko/gms-malaria:assets/uiux.js');
var visual = require('users/rzupko/gms-malaria:assets/visualization.js');

var landsat = require('users/rzupko/gms-malaria:imports/landsat.js');
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var storage = require('users/rzupko/gms-malaria:imports/exporting.js');
var widgets = require('users/rzupko/gms-malaria:imports/widgets.js');

// UI control index constants
var SPECIES_INDEX = 8;    // Species layers selection index
var ENV_INDEX = 12;       // Environmental layers selection index

// Global list of all of the layers that are created for the UI
var g_layerList = null;

// Global environmental and landcover rasters
var g_environmental = null, g_landcover = null;

// Global year and species variables, default values
var g_year = new Date().getFullYear() - 1;
var g_species = mosquitoes.aDirus;

// Global element that we need access to after creation
var ui_legend = null;

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
      ui.Label('Species Habitat Maps', {fontWeight: 'bold'}),
      ui.Label('Species habitat maps descibe the likely habitat for the species, and possible risk for malaria tranmission.'),
      getLayerSelect(),
      ui.Label(' '),
      ui.Label('Environmental Maps', {fontWeight: 'bold'}),
      ui.Label('Environmental condition maps are used to assess the environmental suitability for the selected species.'),
      getLayerSelect(),
    ], 
    'flow', { 'width' : '275px' });
  ui.root.widgets().add(toolPanel);
  
  // Register the hook to detect the change in layer
  Map.drawingTools().onLayerSelect(function(selected, widget) {
    print('selected');
  });
};

// Render the map with the UI selections (or defualts)
exports.renderMaps = function() {
  reset();
  setEnvironment(g_year);
  setSpecies(g_year, g_species);  
};

// ---------------------------------------------------------------------------
// Strictly UI widget related functions
// ---------------------------------------------------------------------------

// Return an empty layer select
function getLayerSelect() {
  return ui.Select({
    placeholder: 'Select a layer...',
    style: {
      width: '225px',
    },
    onChange: changeLayer
  });
}

// Get the correct legend to display given the selected map label
function getLegend(value) {
  // Is this a discrete legend?
  for (var key in uiux.ui_discrete) {
    if (value.indexOf(key) > -1) {
      return widgets.createDiscreteLegend(value, uiux.ui_discrete[key]);
    }
  }

  // All others are color bars
  return widgets.createColorBar(value, g_layerList.get(value).getVisParams());
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
      width: '250px',
    },
    onChange: function(value) {
      for (var key in mosquitoes) {
        if (mosquitoes[key].species.localeCompare(value) === 0) {
          g_species = mosquitoes[key];
          exports.renderMaps();
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
    min: 2001, max: g_year, 
    step: 1,
    value: g_year,
    style: {
      width: '250px',
      fontWeight: 'bold'
    },
    onChange: function(value) {
      g_year = value;
      exports.renderMaps();
    }
  });
}

// Reset any dynamic aspects of the UI
function reset() {
  // Clear any layers that are present
  for (var ndx = Map.layers().length() - 1; ndx >= 0; ndx--) {
    var layer = Map.layers().get(ndx);
    Map.remove(layer);
  }

  // Clear the dictionary of layers
  g_layerList = new ui.data.ActiveDictionary();
  
  // Clear the select boxes
  var panel = ui.root.widgets().get(1);
  panel.widgets().get(SPECIES_INDEX).items().reset();
  panel.widgets().get(ENV_INDEX).items().reset();
}

// Set the layer to display, will trigger the change event
function selectLayer(index, value) {
  var panel = ui.root.widgets().get(1);
  var select = panel.widgets().get(index);   
  select.setValue(value);
}

// ---------------------------------------------------------------------------
// Processing and UX related UI functions
// ---------------------------------------------------------------------------

// Add a layer to the dictionary of possible layers and update the UI select
function addLayer(index, data, visualization, label) {
  // Get the select object for the environmental layers
  var panel = ui.root.widgets().get(1);
  var select = panel.widgets().get(index);   
  select.items().add(label);
  
  // Add the layer to the list of known layers
  g_layerList.set(label, ui.Map.Layer(data, visualization, label));
}

// Change the top-most layer that is displayed on that map
function changeLayer(value) {
  // Start by removing the top-most layer
  if (Map.layers().length() > 2) {
    var index = Map.layers().length() - 1;
    var layer = Map.layers().get(index);
    Map.remove(layer);
  }

  // Add the new layer to the map
  Map.layers().add(g_layerList.get(value));
  if (ui_legend !== null) {
    Map.remove(ui_legend);
  }
  ui_legend = getLegend(value);
  Map.add(ui_legend);
  
  // Clear any selected item that isn't the value we were passed
  function clear(index, value) {
    var panel = ui.root.widgets().get(1);
    var select = panel.widgets().get(index);
    if (select.getValue() !== value) {
      select.setValue(null, false);
    }
  }
  clear(SPECIES_INDEX, value);
  clear(ENV_INDEX, value);
}

// Calculate and add the species specific data to the map
function setSpecies(year, species) {
  // Process the data that changes based upon the species selected
  var gms = shapefile.getGms();
  var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
  
  // TODO Update this to be a proper slider, for now just use the lower bound
  var sd = species.tempMeanSD[0];
  
  // Classify the habitat based upon the inputs
  var habitat = processing.getHabitat({
      // Raster data
      'totalRainfall'     : g_environmental.select('total_rainfall'),
      'meanTemperature'   : g_environmental.select('mean_temperature'),
      'daysOutsideBounds' : intermediate.select('days_outside_bounds'),
      'landcover'         : g_landcover,
      
      // Species data
      'speciesRainfall'   : species.rainfall,
      'speciesMeanLower'  : species.tempMean[0] - sd,
      'speciesMeanUpper'  : species.tempMean[1] + sd,
      'speciesLife'       : species.lifeExpectancy
  });
  
  // Prepare the risk assessment based upon the landcover and habitat
  var risk = processing.getRiskAssessment(g_landcover, habitat);
  
  // Anopheles genus specific data
  var selected = species.species + ' / Probable Habitat, ' + year;
  addLayer(SPECIES_INDEX, habitat, visual.viz_habitatPalette, selected);
  addLayer(SPECIES_INDEX, risk, visual.vis_riskPalette, species.species + ' / Malaria Risk, ' + year);
  
  // Intermediate data for the Anopheles genus selected
  addLayer(SPECIES_INDEX, intermediate.select('days_outside_bounds'), visual.viz_bounds, species.species + ' / Days Outside Bounds, ' + year);

  // Select the default layer
  selectLayer(SPECIES_INDEX, selected);
  
  // Create the export tasks
  storage.exportRaster(intermediate.select('days_outside_bounds'), g_year + '_' + species.species.replace(' ', '_') + '_days_outside_bounds');
  storage.exportRaster(habitat, g_year + '_' + species.species + '_habitat');
  storage.exportRaster(risk, g_year + '_' + species.species + '_risk');
}

// Calculate and add the year specific environment data to the map
 function setEnvironment(year) {
  // Add the base Landsat layers
  var gms = shapefile.getGms();
  var satellite = landsat.getSatellite(year);
  var imagery = processing.getImages(satellite, gms_wrs2.indices, gms, year);
  Map.addLayer(imagery, satellite.viz_rgb, satellite.name + ', ' + year);
  
  // Add the GMS outlines on top of it
  visualizeGms();
  
  // Process the data that only changes based on the year
  g_environmental = processing.getAnnualRainfall(gms, year);
  g_environmental = g_environmental.addBands(processing.getMeanTemperature(gms, year));
  g_landcover = ml.classify(imagery, year);

  // Base data that only needs to be done once for the year selected
  addLayer(ENV_INDEX, g_landcover, visual.viz_trainingPalette, 'Classified Landcover, ' + year);
  addLayer(ENV_INDEX, g_environmental.select('mean_temperature'), visual.viz_temperature, 'Mean Temperature, ' + year + ' (MOD11A1.061)');
  addLayer(ENV_INDEX, g_environmental.select('total_rainfall'), visual.viz_rainfall, 'Total Annual Rainfal, ' + year + ' (CHIRPS/PENTAD)');
  
  // Create the export tasks
  storage.exportEnvironmental(g_environmental, g_year);
  storage.exportRaster(g_landcover, g_year + '_landcover_');
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

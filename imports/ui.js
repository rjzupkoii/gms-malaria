/*
 * ui.js
 *
 * This script contains various functions realted to setting up and working 
 * with UI elements.
 */
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Prepare the initial UI state
exports.prepareUI = function() {
  Map.add(getEnvironmentalCheckbox());  
  Map.add(getIntermediateCheckbox());
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
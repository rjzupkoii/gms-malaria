/*
 * ui.js
 *
 * This script contains various functions realted to setting up and working 
 * with UI elements.
 */

// Prepare the initial UI state
exports.prepareUI = function() {
  Map.add(getEnvironmentalCheckbox());  
  Map.add(getIntermediateCheckbox());
};

// Return a checkbox that toggles environmental maps
function getEnvironmentalCheckbox(){
  return ui.Checkbox({
    label: 'Show Environmental Maps',
    onChange: function(checked) {
      Map.layers().get(3).setShown(checked);  // Mean rainfall, CHIRPS/PENTAD
      Map.layers().get(4).setShown(checked);  // Total rainfall, CHIRPS/PENTAD
      Map.layers().get(5).setShown(checked);  // Mean temperature, MOD11A1.061
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
      Map.layers().get(6).setShown(checked);  // A. dirus / Days Outside Bounds
      Map.layers().get(7).setShown(checked);  // Landcover
    },
    style: {
      position: 'top-right'
    }
  });
}
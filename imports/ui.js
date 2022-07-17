/*
 * ui.js
 *
 * This script contains various functions realted to setting up and working 
 * with UI elements.
 */

// Prepare the initial UI state
exports.prepareUI = function() {
  Map.add(gmsUi.getIntermediateCheckbox());
  Map.add(gmsUi.getEnvironmentalCheckbox());  
};

// Return a checkbox that toggles environmental maps
function getEnvironmentalCheckbox(){
  return ui.Checkbox({
    label: 'Show Environmental Maps',
    onChange: function(checked) {
      Map.layers().get(3).setShown(checked);  // CHIRPS/PENTAD
      Map.layers().get(4).setShown(checked);  // MOD11A1.061
    },
    style: {
      position: 'top-right'
    }
  });
}

// Return a checkbox that toggles intermediate maps
exports.getIntermediateCheckbox = function() {
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
};


// Return a checkbox that toggles environmental maps
exports.getEnvironmentalCheckbox = function() {
  return ui.Checkbox({
    label: 'Show Environmental Maps',
    onChange: function(checked) {
      Map.layers().get(2).setShown(checked);  // CHIRPS/PENTAD
      Map.layers().get(3).setShown(checked);  // MOD11A1.061
    },
    style: {
      position: 'top-right'
    }
  });
};

// Return a checkbox that toggles intermediate maps
exports.getIntermediateCheckbox = function() {
  return ui.Checkbox({
    label: 'Show Intermediate Maps',
    onChange: function(checked) {
      Map.layers().get(4).setShown(checked);  // A. dirus / Days Outside Bounds
      Map.layers().get(5).setShown(checked);  // Landcover
    },
    style: {
      position: 'top-right'
    }
  });
};


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
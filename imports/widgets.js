/*
 * widgets.js
 *
 * Generalized UI widgets.
 */

exports.createColorBar = function(titleText, visualization) {
  print(visualization)
  
  // Prepare the title
  var title = ui.Label({
    value: titleText, 
    style: {fontWeight: 'bold', textAlign: 'center', stretch: 'horizontal'}});

  // Prepare the color bar
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: makeColorBarParams(visualization.palette),
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
  });
  
  // Prepare the legend labels
  var labels = ui.Panel({
    widgets: [
      ui.Label(visualization.min, {margin: '4px 8px'}),
      ui.Label(
          (visualization.max / 2),
          {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(max, {margin: '4px 8px'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
    
  // Prepare the panel to be returned
  return ui.Panel({
    widgets: [title, colorBar, labels],
    style: {position: 'bottom-center', padding: '8px 15px'},
  });    
};

function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: 1,
    palette: palette,
  };
}
/*
 * widgets.js
 *
 * Generalized UI widgets.
 */

// Create and return a color bar legend control
exports.createColorBar = function(titleText, visualization) {
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
      ui.Label(visualization.max, {margin: '4px 8px'})
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

// Create and return a discrete legend control
// 
// titleText - The title of the legend
// categories - An ee.Dictionary object that contains the label (key) and color code (value)
exports.createDiscreteLegend = function(titleText, categories) {
  // Create the panel and add the legend
  var panel = ui.Panel({
    style: {
      position: 'middle-left',
      padding: '8px 15px'
    }});
  panel.add(ui.Label({
    value: titleText,
    style: {
      fontWeight: 'bold',
      fontSize: '16px',
      margin: '0px 0 4px 0px'
    }}));
  
  // Add the categories and return
  for (var key in categories) {
    print(key)
    panel.add(makeRow(categories[key], key));
  }
  return panel;
};

function makeRow(color, name) {
  print('makeRow')
  print(color)
  print(name)
  var colorBox = ui.Label({
    style: {color: '#ffffff',
      backgroundColor: color,
      padding: '10px',
      margin: '0 0 4px 0',
    }
  });
  var description = ui.Label({
    value: name,
    style: {
      margin: '0px 0 4px 6px',
    }
  }); 
  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')}
  );
}
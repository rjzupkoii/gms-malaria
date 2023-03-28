

var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Setup our variables
var gms = shapefile.getGms();
var year = 2020;

// Load the data set
var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
  .filterDate(year + '-01-01', year + '-12-31');
temperature = temperature.map(function(image) { return image.clip(aoi); });

Map.centerObject(gms, 7);  
var min = temperature.select('LST_Night_1km').min();
Map.addLayer(min)


var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Preform scaled conversion from C to K for the data set
minimum = (12.5 + 273.15) / 0.02;  
maximum = (26.0 + 273.15) / 0.02;  

// Setup our variables
var gms = shapefile.getGms();
var year = 2020;

// Load the data set
var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
  .filterDate(year + '-01-01', year + '-12-31');
temperature = temperature.map(function(image) { return image.clip(gms); });

Map.centerObject(gms, 5);  
var min = temperature.select('LST_Night_1km').min();
Map.addLayer(min)
/*
 * working.js
 *
 * Basic landing script for working on the code base.
 */
 
// Import the assets
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js'); 
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:assets/visualization.js');

// Import other scripts
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');

// Set our location
var gms = shapefile.getGms();
Map.centerObject(gms, 6);

// Render the temperature bounds
 var year = 2020;
// var species = mosquitoes.aDirus;
// var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
// Map.addLayer(intermediate.select('days_outside_bounds'), visual.viz_bounds, species.species + ' / Days Outside Bounds, ' + year);


  var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
    
  // Scaled value in K must be converted to C, result = DN * 0.02 - 273.15
  temperature = temperature.map(function(image) {
    var kelvin = image.select('LST_Day_1km');
    var celsius = ee.Image().expression('kelvin * 0.02 - 273.15', {kelvin: kelvin});
    return celsius.rename('LST_Day_1km_celsius');
  });
  
  // Reduce, clip, and return
  var intermediate = temperature.reduce(ee.Reducer.mean()).clip(gms).rename('mean_temperature_day');
  
  Map.addLayer(intermediate.select('mean_temperature_day'), visual.viz_temperature, 'Mean ' + year);
  

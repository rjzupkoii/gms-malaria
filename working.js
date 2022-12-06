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
var species = mosquitoes.aDirus;
var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
Map.addLayer(intermediate.select('days_outside_bounds'), visual.viz_bounds, species.species + ' / Days Outside Bounds, ' + year);


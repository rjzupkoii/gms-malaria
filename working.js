// Developmental script for new GMS features / scale-up code.

var shapefile = require('users/rzupko/gms-malaria:imports/shapefiles.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// Based upon minimum for full coverage of GMS
var CLOUD_COVER = 26;

// Get the GMS shapefile
var gms = shapefile.getGms();

// Filter the Landsat 8 imagery to 2020
var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(gms)
  .filterDate('2020-01-01', '2020-12-31')
  .filterMetadata('CLOUD_COVER', 'less_than', CLOUD_COVER);
print(landsat);

visual.visualizeGms();
Map.addLayer(landsat)

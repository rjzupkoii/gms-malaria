/*
 * exportGms.js
 *
 * This script is intended to export the shapefiles used to define the GMS region. Since the geometry is a bit complicated
 * this takes a bit of extra effort.
 */
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');
 
// Get the geometry of the countries
var gms = shapefile.getGms();

// Label the type of geometry so we can filter on it
gms = gms.map(function(item) {
  return ee.Feature(item).set('geometry_type', ee.Feature(item).geometry().type()); 
});

// Label and filter out the polygons
var polygons = gms.map(function (item) { 
    return ee.Feature(item).set('geometry_type', ee.Feature(item).geometry().type()); 
  }).filter(ee.Filter.or(
      ee.Filter.equals('geometry_type', 'Polygon'),
      ee.Filter.equals('geometry_type', 'MultiPolygon')));
polygons = ee.FeatureCollection(polygons);

// Give the GeometryCollection special processing
var gc = gms.filter(ee.Filter.equals('geometry_type', 'GeometryCollection'));
gc = gc.first().geometry().geometries();
var features = gc.map(function(item) {
   return ee.Feature(ee.Geometry(item));
});
var gc = ee.FeatureCollection(features);
gc = gc.map(function(item) { 
    return ee.Feature(item).set('geometry_type', ee.Feature(item).geometry().type()); 
  }).filter(ee.Filter.equals('geometry_type', 'Polygon'));
polygons = polygons.merge(gc);

// Load the GMS borders and generate the outlines
var empty = ee.Image().byte();
var outline = empty.paint({
  featureCollection: polygons,
  color: 1,
  width: 0.5,
});

// Update the map as a visual check
Map.centerObject(polygons, 6);
Map.addLayer(outline, { palette: '#1e00ff' }, 'Greater Mekong Subregion');

// Queue the task for the export
Export.table.toDrive({
  collection: polygons,
  folder: 'ee-gms',
  description: 'greater_mekong_subregion',
  fileFormat: 'SHP'
});
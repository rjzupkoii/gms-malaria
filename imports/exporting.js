/*
 * exporting.js
 *
 * This script contains various library functions that are indned to be used
 * for exporting large data sets to Google Drive. However, for more complex
 * operations the intent is for Python to be used for automation and these 
 * exports to be used for validation of the underlying funtions.
 */
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

// Create the export tasks for the environmental files.
exports.exportEnvironmental = function(environmental, year) {
  var gms = shapefile.getGms();
  
  Export.image.toDrive({
    image: environmental.select('mean_temperature'), 
    region: gms,
    description: year + '_mean_temperature',
    folder: 'ee-gms',
    fileNamePrefix: year + '_mean_temperature_',
    maxPixels: 1e10
  });  
  
  Export.image.toDrive({
    image: environmental.select('total_rainfall'), 
    region: gms,
    description: year + '_total_rainfall',
    folder: 'ee-gms',
    fileNamePrefix: year + '_total_rainfall_',
    maxPixels: 1e10
  });
};

// Create the export task for the raster using the given description.
exports.exportRaster = function(raster, description) {
  print(description)
  
  Export.image.toDrive({
    image: raster,
    region: shapefile.getGms(),
    description: description, 
    folder: 'ee-gms',
    fileNamePrefix: description.replace(' ', '_'),
    maxPixels: 1e10
  });      
};

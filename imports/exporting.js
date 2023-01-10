/*
 * exporting.js
 *
 * This script contains various library functions that are intended to be used
 * for exporting large data sets to Google Drive. Note that some of the code
 * here is very redundent, but the assumption is that over time there will be a 
 * fair degree of difference between indivdiual export tasks.
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

// Create the export task for the landcover.
exports.exportLandcover = function(landcover, year) {
  Export.image.toDrive({
    image: landcover,
    region: shapefile.getGms(),
    description: year + '_landcover', 
    folder: 'ee-gms',
    fileNamePrefix: year + '_landcover_',
    maxPixels: 1e10
  });    
};

/*
 * exporting.js
 *
 * This script contains various library functions that are indned to be used
 * for exporting large data sets to Google Drive. 
 */


// Create the export tasks for the environmental files. These may vary based
// upon the year and species
exports.exportEnvironmental = function(environmental) {
  
  // Days outside of temperature bounds
  Export.image.toDrive({
    image: environmental.select('days_outside_bounds'), 
    region: gms,
    description: 'GMS_test', 
    folder: 'ee-gms',
    fileNamePrefix: 'days_outside_',
    maxPixels: 1e10
  });
  
  // Landcover classifications, th
};


exports.queueExports = function(results) {
  // Land cover classification, this must be it's own image since it's 
  // classified data
  Export.image.toDrive({
    image: results.select('landcover'),
    description: 'EE_Classified_LS8_Export',
    folder: 'Earth Engine',
    scale: 30,
    region: results.geometry()
  });  

  // Inputs for the habitat classification, this could  be a single image but
  // for processing in ArcGIS it is a bit easier to have each band as an image  
  Export.image.toDrive({
    image: results.select('annual_rainfall'),
    description: 'EE_AnnualRainfall_CHIRPS_Export',
    folder: 'Earth Engine',
    scale: 5566,
    region: results.geometry()
  });
  Export.image.toDrive({
    image: results.select('mean_temperature'),
    description: 'EE_MeanTemperature_MODIS_Export',
    folder: 'Earth Engine',
    scale: 1000,
    region: results.geometry()
  });
  Export.image.toDrive({
    image: results.select('temperature_bounds'),
    description: 'EE_TemperatureBounds_Export',
    folder: 'Earth Engine',
    scale: 1000,
    region: results.geometry()
  });  
  
  // Final malaria risk products
  Export.image.toDrive({
    image: results.select('habitat'),
    description: 'EE_Habitat_Export',
    folder: 'Earth Engine',
    scale: 30,
    region: results.geometry()
  }); 
  Export.image.toDrive({
    image: results.select('risk'),
    description: 'EE_Risk_Export',
    folder: 'Earth Engine',
    scale: 30,
    region: results.geometry()
  });   
}
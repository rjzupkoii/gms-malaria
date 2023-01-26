/*
 * sensitivity.js
 *
 * Script to queue the processing tasks for sensivity analysis.
 */
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js'); 
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

var landsat = require('users/rzupko/gms-malaria:imports/landsat.js');
var ml = require('users/rzupko/gms-malaria:imports/ml.js');
var processing = require('users/rzupko/gms-malaria:imports/processing.js');
var storage = require('users/rzupko/gms-malaria:imports/exporting.js');

generateJobs();


// Main entry point for the script, generates the full list of jobs to be 
// run on Earth Engine to conduct the sensitivity analysis.
function generateJobs() {
  // Generate the list of years and itterte on it
  var years = generateList(2001, 2022, 1);
  for (var ndx in years) {
    queueEnvironmentalJob(years[ndx]);
    
    // Iterate on all of the mosquitoes
    for (var key in mosquitoes) {
      
      // Generate the list of deviations to test for sensitivity
      var mosquito = mosquitoes[key];
      var deviations = generateList(mosquito.tempMeanSD[0], mosquito.tempMeanSD[1], 0.25);
      if (deviations[0] !== 0) {
        deviations.push(0.0);
      }
      for (var ndy in deviations) {
        queueVectorJob(years[ndx], mosquitoes[key], deviations[ndy]);
      }
    }
  }
}

// Generate a list from the start value to the end value, inclusive by the step
function generateList(first, last, step) {
  var result = [first];
  while (first < last) {
    first += step;
    result.push(first);
  }
  return result;
}

// Queue the batch processing jobs that are specific to the environment.
//
// NOTE this isn't the most efficent way of generating the jobs, but it does keep
// all of the server-side functinality in the same place.
function queueEnvironmentalJob(year) {
  // Prepare the initial rasters used to assess the vector
  var gms = shapefile.getGms();
  var satellite = landsat.getSatellite(year);
  var imagery = processing.getImages(satellite, gms_wrs2.indices, gms, year);
  var environmental = processing.getAnnualRainfall(gms, year);
  environmental = g_environmental.addBands(processing.getMeanTemperature(gms, year));
  var landcover = ml.classify(imagery, year);

  // Create the export tasks
  storage.exportEnvironmental(g_environmental, g_year);
  storage.exportRaster(g_landcover, g_year + '_landcover');  
}

// Queue the batch processing jobs that are specific to the vector.
//
// NOTE ditto comment for queueEnvironmentalJob.
function queueVectorJob(year, species, deviation) {
  // Prepare the initial rasters used to assess the vector
  var gms = shapefile.getGms();
  var satellite = landsat.getSatellite(year);
  var imagery = processing.getImages(satellite, gms_wrs2.indices, gms, year);
  var environmental = processing.getAnnualRainfall(gms, year);
  environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
  var landcover = ml.classify(imagery, year);

  // Prepare the rasters that are affected by the standard deviation
  var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
  
  // Classify the habitat based upon the inputs
  var habitat = processing.getHabitat({
      // Raster data
      'totalRainfall'     : environmental.select('total_rainfall'),
      'meanTemperature'   : environmental.select('mean_temperature'),
      'daysOutsideBounds' : intermediate.select('days_outside_bounds'),
      'landcover'         : landcover,
      
      // Species data
      'speciesRainfall'   : species.rainfall,
      'speciesLife'       : species.lifeExpectancy,
  
      // Use the lower bound of the SD for the UI, the sensitivity script will interoage the full range
      'speciesMeanLower'  : species.tempMean[0] - deviation,
      'speciesMeanUpper'  : species.tempMean[1] + deviation,
  });
  
  // Prepare the risk assessment based upon the landcover and habitat
  var risk = processing.getRiskAssessment(g_landcover, habitat);
  
  // Create the export tasks
  var name = species.species.replace(/ /g, '_');
  name = name.replace(/\./g, '');
  storage.exportRaster(intermediate.select('days_outside_bounds'), g_year + '_' + name + '_days_outside_bounds');
  storage.exportRaster(habitat, g_year + '_' + name + '_habitat');
  storage.exportRaster(risk, g_year + '_' + name + '_risk');  
}
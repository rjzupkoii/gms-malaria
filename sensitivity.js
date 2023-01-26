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

var year = 2001;
queueEnvironmentalJob(year);
generateJobs(year);


// Main entry point for the script, generates the full list of jobs to be 
// run on Earth Engine to conduct the sensitivity analysis.
function generateJobs(year) {
  var count = 0;
  
  // Iterate on all of the mosquitoes
  for (var key in mosquitoes) {

    // Generate the list of deviations to test for sensitivity
    var mosquito = mosquitoes[key];
    var deviations = generateList(mosquito.tempMeanSD[0], mosquito.tempMeanSD[1], 0.25);
    if (deviations[0] !== 0) {
      deviations.push(0.0);
    }
    
    // Iterate on the list of deviations
    for (var ndy in deviations) {
      queueVectorJob(year, mosquitoes[key], deviations[ndy]);
      count++;
    }
  }
  print('Tasks Created:' + count);
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
  environmental = environmental.addBands(processing.getMeanTemperature(gms, year));
  var landcover = ml.classify(imagery, year);

  // Create the export tasks
  storage.exportEnvironmental(environmental, year);
  storage.exportRaster(landcover, year + '_landcover');  
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

  // Prepare the rasters that are specific to the vector
  var intermediate = processing.getTemperatureBounds(gms, year, species.tempMin, species.tempMax);
  var habitat = processing.getHabitat({
      // Raster data
      'totalRainfall'     : environmental.select('total_rainfall'),
      'meanTemperature'   : environmental.select('mean_temperature'),
      'daysOutsideBounds' : intermediate.select('days_outside_bounds'),
      'landcover'         : landcover,
      
      // Species data
      'speciesRainfall'   : species.rainfall,
      'speciesLife'       : species.lifeExpectancy,
  
      // Apply the devation value supplied
      'speciesMeanLower'  : species.tempMean[0] - deviation,
      'speciesMeanUpper'  : species.tempMean[1] + deviation,
  });
  var risk = processing.getRiskAssessment(landcover, habitat);
  
  // Update the strings to comply with the export filename constraints
  var name = species.species.replace(/ /g, '_');
  name = name.replace(/\./g, '');
  var sd = deviation.toString().replace('.', '-');
  
  // Create the export tasks
  storage.exportRaster(intermediate.select('days_outside_bounds'), year + '_' + name + '_' + sd + '_days_outside_bounds');
  storage.exportRaster(habitat, year + '_' + name + '_' + sd + '_habitat');
  storage.exportRaster(risk, year + '_' + name + '_' + sd + '_risk');  
}
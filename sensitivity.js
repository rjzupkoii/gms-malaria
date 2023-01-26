3/*
 * sensitivity.js
 *
 * Script to queue the processing tasks for sensivity analysis.
 */
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js');

generateJobs();


// Main entry point for the script, generates the full list of jobs to be 
// run on Earth Engine to conduct the sensitivity analysis.
function generateJobs() {
  // Generate the list of years and itterte on it
  var years = generateList(2001, 2022, 1);
  for (var ndx in years) {
    
    // Iterate on all of the mosquitoes
    for (var key in mosquitoes) {
      
      // Generate the list of deviations to test for sensitivity
      var mosquito = mosquitoes[key];
      var deviations = generateList(mosquito.tempMeanSD[0], mosquito.tempMeanSD[1], 0.25);
      if (deviations[0] !== 0) {
        deviations.push(0.0);
      }
      for (var ndy in deviations) {
        queueJob(years[ndx], mosquitoes[key], deviations[ndy]);
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

// Queue the processing job.
//
// NOTE this isn't the most efficent way of generating the jobs, but it does keep
// all of the server-side functinality in the same place.
function queueJob(year, mosquito, deviation) {
  print(year, mosquito.species, deviation);
}
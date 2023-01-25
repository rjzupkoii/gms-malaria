/*
 * sensitivity.js
 *
 * Script to queue the processing tasks for sensivity analysis.
 */
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js');

var years = generateList(2001, 2022, 1);
for (var ndx in years) {
  for (var key in mosquitoes) {
    print(years[ndx], mosquitoes[key].species);
  }
}

// Generate a list from the start value to the end value, inclusive by the given step
function generateList(first, last, step) {
  var result = [first];
  while (first < last) {
    first += step;
    result.push(first);
  }
  return result;
}
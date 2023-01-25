/*
 * sensitivity.js
 *
 * Script to queue the processing tasks for sensivity analysis.
 */
var mosquitoes = require('users/rzupko/gms-malaria:assets/mosquitoes.js');

var years = ee.List.sequence(2001, 2022);

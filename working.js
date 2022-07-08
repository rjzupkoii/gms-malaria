// Developmental script for new GMS features / scale-up code.
var gms_wrs2 = require('users/rzupko/gms-malaria:assets/gms_wrs2_swaths.js');
var shapefile = require('users/rzupko/gms-malaria:assets/shapefiles.js');

var processing = require('users/rzupko/gms-malaria:imports/processing_wip.js');
var visual = require('users/rzupko/gms-malaria:imports/visualization.js');

// CIR visualization for the GMS
var viz_gms_cir = {
  'bands' : ['SR_B5', 'SR_B4', 'SR_B3'],
  'min' : 7423.785454545455,
  'max' : 22769.123636363634
};

var viz_rainfall = {
  'min' : 24.55,
  'max' : 4497.99,
  'palette' : ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'],
};

// Temperature visualization
var viz_temperature = {
  'min' : 3.94,  
  'max' : 38.0,
  'palette' : [
    '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
    '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
    '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
    'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
    'ff0000', 'de0101', 'c21301', 'a71001', '911003'
  ] };

// Placeholder, will be returned by the UI
var year = '2020';

// Add the Landsat 8 imagery for the GMS to the map
var gms = shapefile.getGms();
// var rainfall = processing.getAnnualRainfall(gms, year);
// var temperature = processing.getMeanTemperature(gms, year);
// var landsat = processing.getImages(gms_wrs2.indices, gms, year);

// Add everything to the UI
visual.visualizeGms();
// Map.addLayer(rainfall, viz_rainfall, 'CHIRPS/PENTAD');
// Map.addLayer(temperature, viz_temperature, 'MOD11A1.006');
// Map.addLayer(landsat, viz_gms_cir, 'Landsat 8, 2020 (CIR)');

var aoi = gms;


var minimum = 11.0;
var maximum = 28.0;
var year = '2020';

// Preform scaled conversion from C to K for the data set
minimum = (minimum + 273.15) / 0.02;
print(minimum)
maximum = (maximum + 273.15) / 0.02;
print(maximum)



  var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
  temperature = temperature.map(function(image) {
    var kelvin = ;
    var count = ee.Image(0).expression('(kelvin < minimum) || (maximum < kelvin)',
      { kelvin: image.select('LST_Day_1km'), minimum: minimum, maximum: maximum });
    return count.rename('days_outside_bounds');
  });



// // Add a band with a count of the days outside of the bounds, minimum <= temp <= maximum
// collection = collection.map(function(image) {
//   var kelvin = image.select('LST_Day_1km');
//   var celsius = ee.Image(0).expression('kelvin * 0.02 - 273.15', {kelvin: kelvin});
//   var count = ee.Image(0).expression('(celsius < minimum) || (celsius > maximum)', 
//     {celsius: celsius, minimum: minimum, maximum: maximum});
//   return image.addBands(count.rename('Outside_Bounds'));
// });
// collection = collection.select('Outside_Bounds');

// // Reduce and return  
// collection = collection.reduce(ee.Reducer.sum()).toInt();  
Map.addLayer(temperature, [], 'Count')





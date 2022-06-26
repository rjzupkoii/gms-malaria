/*
 * processing.js
 *
 * This script is intended as a library that contains the functions needed to
 * perform the actual processing for the imagery. Since only the process method
 * is exported there is some information hiding taking place even though we 
 * aren't really doing OOP. Also, since this is a proof of concept, there is 
 * still a bit of hard coding in place, ideally the parameterization for the 
 * species would be passed to process() along with the relevant date ranges.
 */
var features = require('users/rzupko/gms-malaria:imports/features.js');

exports.process = function(image) {
  // Note the aoi
  var aoi = image.geometry();
  
  // Load the data needed for classification
  var results = annualRainfall(aoi).rename('annual_rainfall');
  results = results.addBands(meanTemperature(aoi).rename('mean_temperature'));
  results = results.addBands(temperatureBounds(aoi, 11, 28).rename('temperature_bounds')); // Bounds: 11 C <= temperature <= 28 C
  results = results.addBands(classifyLandCover(image).rename('landcover'));
  
  // Perform the habitat classification
  var habitat = habitatClassification({
    aoi: aoi,
    rainfall: results.select('annual_rainfall'),
    temperature: results.select('mean_temperature'),
    bounds: results.select('temperature_bounds'),
    annualRainfall: 1500,
    minimumMeanTemperature: 20
  });
  results = results.addBands(habitat.rename('habitat'));
  
  // Perform the final risk assessment
  var risk = riskAssessment(results.select('landcover'), habitat);
  results = results.addBands(risk.rename('risk'));  
  
  // Perform a final clip on everything to make sure it's bound to the AOI
  return results.clip(aoi);
};

// Get the mean monthly rainfall from the CHIPS dataset for 2019
function annualRainfall(aoi) {
  var collection = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
    .filterDate('2019-01-01', '2019-12-31');
  var results = collection.reduce(ee.Reducer.sum());
  return results.clip(aoi);
}

// Classify the land cover for the image provided
function classifyLandCover(image) {
  // Load the training data note that we are loading the training image each
  // time the method runs so this could be improved a bit by just passing the
  // classifier around
  var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filter(ee.Filter.and(
      ee.Filter.eq('WRS_PATH', 125),
      ee.Filter.eq('WRS_ROW', 50)))
    .filterDate('2020-01-21', '2020-01-23');
  var labeled = landsat.first();
  var polygons = features.getFeatures();
  var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
  
  // Sample the input imagery
  var training = labeled.select(bands).sampleRegions({
    collection: polygons,
    properties: ['class'],
    scale: 30
  });
  
  // Make a SVM classifier and train it
  var classifier = ee.Classifier.libsvm().train({
    features: training,
    classProperty: 'class',
    inputProperties: bands
  });
  
  // Classify and return the results
  return image.select(bands).classify(classifier);
}

function habitatClassification(inputs) {
  // Setup the variables for the envelopes
  var variables = {
    rainfall: inputs.rainfall, 
    minRainfall: inputs.annualRainfall, 
    temperature: inputs.temperature, 
    minTemp: inputs.minimumMeanTemperature,
    bounds: inputs.bounds};
  
  // Primary habitat is completely within the environmental envelope
  var primary = ee.Image(0).expression('(rainfall > minRainfall) && (temperature >= minTemp) && (bounds == 0)', variables);
    
  // Secondary is within the envelope for the life expectancy of an active female (43 days)
  var secondary = ee.Image(0).expression('(rainfall > minRainfall) && (temperature >= minTemp) && (bounds < 43)', variables);
    
  // Tertiary is within the envelope for the dormant life expectancy of a female (180 days)
  var tertiary = ee.Image(0).expression('(rainfall > minRainfall) && (temperature >= minTemp) && (bounds < 180)', variables);
  
  // Merge the classifications and return
  var habitat = ee.Image(0).expression('primary + secondary + tertiary', {primary: primary, secondary: secondary, tertiary: tertiary});
  return habitat.rename('Habitat_Classification');
}

// Get the mean temperature from the MOD11A1.006 dataset for 2019
function meanTemperature(aoi) {
  var collection = ee.ImageCollection('MODIS/006/MOD11A1')
    .filterDate('2019-01-01', '2019-12-31');

  // Scaled value in K must be converted to C, result = DN * 0.02 - 273.15
  collection = collection.map(function(image){
    var kelvin = image.select('LST_Day_1km');
    var celsius = ee.Image().expression('kelvin * 0.02 - 273.15', {kelvin: kelvin});
    celsius = celsius.clip(aoi);
    return image.addBands(celsius.rename('LST_Day_1km_celsius'));
  });
  collection = collection.select('LST_Day_1km_celsius');
  
  // Reduce and return
  return collection.reduce(ee.Reducer.mean());
}

function riskAssessment(landcover, habitat) {
  // Generate the 1 km buffer based upon the land cover type, using cumulative 
  // cost for the buffer isn't exactly the same as a buffer, but results in
  // the same effect
  var buffer = ee.Image(0).expression('landcover >= 20', {landcover: landcover});
  buffer = ee.Image(1).cumulativeCost({
    source: buffer, 
    maxDistance: 1000,
  }).lt(1000);
  var masked = habitat.updateMask(buffer);
  
  // High risk are areas where humans likely live along side mosquitos
//  var high = ee.Image(0).expression('(landcover >= 20) && (habitat > 1)', {landcover: landcover, habitat: habitat});
  var high = ee.Image(0).expression('masked > 1 ? 1 : 0', {masked: masked});      
  
  // Generate the 5 km buffer based upon the land cover type
  buffer = ee.Image(0).expression('landcover >= 20', {landcover: landcover});
  buffer = ee.Image(1).cumulativeCost({
    source: buffer, 
    maxDistance: 5000,
  }).lt(5000);
  masked = habitat.updateMask(buffer);
  
  // Moderate risk is mosquito habitat with 5km of humans, 
  // note ternary operator to force a value with the mask 
  var moderate = ee.Image(0).expression('masked > 1 ? 1 : 0', {masked: masked});      
  
  // Low risk is mosquito habitat
  var low = ee.Image(0).expression('habitat > 1', {habitat: habitat});
  
  // Return categorized risk
  return ee.Image(0).expression('high + moderate + low', {high: high, moderate: moderate, low: low});  
}

// Count the number of days that the temperature is outside the provided bounds for the AOI
function temperatureBounds(aoi, minimum, maximum) {
  var collection = ee.ImageCollection('MODIS/006/MOD11A1')
    .filterDate('2019-01-01', '2019-12-31');

  // Add a band with a count of the days outside of the bounds, minimum <= temp <= maximum
  collection = collection.map(function(image) {
    var kelvin = image.select('LST_Day_1km');
    var celsius = ee.Image(0).expression('kelvin * 0.02 - 273.15', {kelvin: kelvin});
    var count = ee.Image(0).expression('(celsius < minimum) || (celsius > maximum)', 
      {celsius: celsius, minimum: minimum, maximum: maximum});
    count = count.clip(aoi);
    return image.addBands(count.rename('Outside_Bounds'));
  });
  collection = collection.select('Outside_Bounds');
  
  // Reduce and return  
  return collection.reduce(ee.Reducer.sum()).toInt();  
}
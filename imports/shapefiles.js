

exports.getGms = function() {
  // Offical country names
  var admn0_names = ee.List(['Cambodia', 'Lao People\'s Democratic Republic', 'Myanmar', 'Thailand', 'Viet Nam']);
  
  // Filter on the country names
  var countries = ee.FeatureCollection("FAO/GAUL/2015/level0")
    .filter(ee.Filter.inList('ADM0_NAME', admn0_names));
    
  return countries;
};
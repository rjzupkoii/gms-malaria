

  // Load the data set
  var temperature = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(year + '-01-01', year + '-12-31');
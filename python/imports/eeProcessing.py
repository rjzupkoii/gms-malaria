import ee


def classify(classifier, imagery, satellite):
    def process(image):
        return image.select(satellite['bands']).classify(classifier)
    classified = imagery.map(process)
    return classified.mosaic()


def export(raster, region, description):
    task = ee.batch.Export.image.toDrive(
        raster,
        region = region.geometry(),
        description = description,
        fileNamePrefix = description.replace(' ', '_'),
        maxPixels = 1e10
    )
    task.start()


def get_classifier(satellite):
    # Load the features
    import temp.features as features

    # Sample the labeled features
    image = get_reference_images(satellite);
    training = image.select(satellite['bands']).sampleRegions(
            collection = features.getFeatures(),
            properties = ['class'],
            scale = 30
        )

    # Make a CART classifier, train it, and return the object
    return ee.Classifier.smileCart().train(
            features = training,
            classProperty = 'class',
            inputProperties = satellite['bands']
        )


# NOTE Combination of getAnnualRainfall and getMeanTemperature
def get_environmental(aoi, year):
    def get_rainfall():
        collection = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD').filterDate(str(year) + '-01-01', str(year) + '-12-31')
        results = collection.reduce(ee.Reducer.sum())
        return results.clip(aoi).rename('total_rainfall')

    def get_temperature():
        temperature = ee.ImageCollection('MODIS/061/MOD11A1').filterDate(str(year) + '-01-01', str(year) + '-12-31')
        temperature = temperature.map(convert)
        return temperature.reduce(ee.Reducer.mean()).clip(aoi).rename('mean_temperature')

    def convert(image):
        # Calculate the daily mean from the daytime and nighttime temperatures
        kelvin = image.expression('(b("LST_Day_1km") + b("LST_Night_1km")) / 2').rename('LST_Mean_1km')

        # Scaled value in K must be converted to C, result = DN * 0.02 - 273.15
        celsius = kelvin.expression('b("LST_Mean_1km") * 0.02 - 273.15')
        return celsius.rename('LST_Mean_1km_celsius')

    return get_rainfall().addBands(get_temperature())


def get_habitat(variables):
    # Find the terrain that is within the basic bounds for the species
    habitat = ee.Image(0).expression(
        '(totalRainfall >= speciesRainfall) && (daysOutsideBounds <= 30)', variables)

    # Improve the score if terrain has the approprate landcover (forest or heavy vegetation)
    # and is within the mean annual temperature bounds
    habitat = habitat.expression(
        'b(0) + \
        ((b(0) == 1) && \
        (landcover == 11 || landcover == 12) && \
        ((speciesMeanLower <= meanTemperature) && (meanTemperature <= speciesMeanUpper)))', variables)

    # Rename the band and return
    return habitat.rename('scored_habitat');    


def get_imagery(satellite, indices, aoi, year):
    def load(item):
        item = ee.List(item)
        image = ee.ImageCollection(satellite['collection']).filter(
            ee.Filter.And(
                ee.Filter.eq('WRS_PATH', item.get(0)),
                ee.Filter.eq('WRS_ROW', item.get(1)))
            ).filterDate(str(year) + '-01-01', str(year) + '-12-31');
        return ee.Image(image.map(mask_clouds).median().clipToCollection(aoi))
    return ee.ImageCollection(indices.map(load));    


def get_reference_images(satellite):
    # Original training data
    p125_r50 = ee.ImageCollection(satellite['collection']).filter(
        ee.Filter.And(
            ee.Filter.eq('WRS_PATH', 125),
            ee.Filter.eq('WRS_ROW', 50))
        ).filterDate('2020-01-01', '2020-12-31');

    # Mountainous terrain 
    p132_r42 = ee.ImageCollection(satellite['collection']).filter(
        ee.Filter.And(
            ee.Filter.eq('WRS_PATH', 132),
            ee.Filter.eq('WRS_ROW', 42))
        ).filterDate('2020-01-01', '2020-12-31');

    # Kunming, Yunnan province, China
    p129_r43 = ee.ImageCollection(satellite['collection']).filter(
        ee.Filter.And(
            ee.Filter.eq('WRS_PATH', 129),
            ee.Filter.eq('WRS_ROW', 43))
        ).filterDate('2020-01-01', '2020-12-31');

    # Tonlé Sap
    p127_r51 = ee.ImageCollection(satellite['collection']).filter(
        ee.Filter.And(
            ee.Filter.eq('WRS_PATH', 127),
            ee.Filter.eq('WRS_ROW', 51))
        ).filterDate('2020-01-01', '2020-12-31');    

    image = p125_r50.merge(p132_r42).merge(p129_r43).merge(p127_r51)
    return image.map(mask_clouds).median();  


def get_temperature_bounds(aoi, year, minimum, maximum):
    def zero(image):
        return image.expression(
            '(minimum < b("LST_Night_1km")) && (b("LST_Day_1km") < maximum)',
            { 'minimum': minimum, 'maximum': maximum })
    
    def clip(image): return image.clip(aoi)

    # Preform scaled conversion from C to K for the data set
    minimum = (minimum + 273.15) / 0.02;  
    maximum = (maximum + 273.15) / 0.02;  

    # Load the data set
    temperature = ee.ImageCollection('MODIS/061/MOD11A1').filterDate(str(year) + '-01-01', str(year) + '-12-31')

    # Map an expression that sets zero if we are within bounds, one if not
    temperature = temperature.map(zero)

    # Clip, sum, and return integers
    temperature = temperature.map(clip)
    return temperature.reduce(ee.Reducer.sum()).toInt().rename('days_outside_bounds')


def mask_clouds(image):
    # Mask for the cloud and cloud shadow bits
    CLOUD_MASK = (1 << 3)

    # Select the QA pixel, and mask if it is a cloud
    qa = image.select('QA_PIXEL')
    mask = qa.bitwiseAnd(CLOUD_MASK).eq(0)
    return image.updateMask(mask);  
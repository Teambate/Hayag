import SensorReading from "../model/reading.model.js";

export const getReadings = async (req, res) => {
  try {
    const sensorReadings = await SensorReading.find();
    res.status(200).json({ success: true, data: sensorReadings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFilteredReadings = async (req, res) => {
  try {
    const { startDateTime, endDateTime, panelIds, sensorTypes, deviceId } = req.query;
    
    // Convert parameters to arrays if they're strings
    const panelIdsArray = panelIds ? 
      (Array.isArray(panelIds) ? panelIds : panelIds.split(',')) : 
      null;
    
    const sensorTypesArray = sensorTypes ? 
      (Array.isArray(sensorTypes) ? sensorTypes : sensorTypes.split(',')) : 
      null;
    
    const deviceIdArray = deviceId ?
      (Array.isArray(deviceId) ? deviceId : deviceId.split(',')) :
      null;
    
    // Start building the aggregation pipeline
    const pipeline = [];
    
    // Stage 1: Match documents based on time range and deviceId
    const matchStage = {};
    if (startDateTime || endDateTime) {
      matchStage.createdAt = {};
      if (startDateTime) matchStage.createdAt.$gte = new Date(startDateTime);
      if (endDateTime) matchStage.createdAt.$lte = new Date(endDateTime);
    }
    
    // Add deviceId to match stage if provided
    if (deviceIdArray && deviceIdArray.length > 0) {
      matchStage.deviceId = { $in: deviceIdArray };
    }
    
    // Add sensor types to match stage if provided
    if (sensorTypesArray && sensorTypesArray.length > 0) {
      const sensorTypeConditions = sensorTypesArray.map(type => {
        const condition = {};
        condition[`readings.${type}`] = { $exists: true, $ne: [] };
        return condition;
      });
      
      if (sensorTypeConditions.length > 0) {
        matchStage.$or = sensorTypeConditions;
      }
    }
    
    // Add match stage to pipeline if not empty
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    
    // Stage 2: Project only the fields we need
    const projectStage = {
      deviceId: 1,
      metadata: 1,
      createdAt: 1
    };
    
    // Add requested sensor types to projection
    if (sensorTypesArray && sensorTypesArray.length > 0) {
      sensorTypesArray.forEach(type => {
        projectStage[`readings.${type}`] = 1;
      });
    } else {
      projectStage.readings = 1;
    }
    
    pipeline.push({ $project: projectStage });
    
    // If panel IDs are specified, add stages to filter by panel ID
    if (panelIdsArray && panelIdsArray.length > 0) {
      // For each sensor type, we need to filter its array
      if (sensorTypesArray && sensorTypesArray.length > 0) {
        // Create a new readings object with filtered arrays
        const newReadingsObj = {};
        
        sensorTypesArray.forEach(type => {
          // Filter the array to only include sensors with matching panel IDs
          newReadingsObj[type] = {
            $filter: {
              input: `$readings.${type}`,
              as: "sensor",
              cond: { $in: ["$$sensor.panelId", panelIdsArray] }
            }
          };
        });
        
        // Add a project stage to replace the readings with the filtered version
        pipeline.push({
          $project: {
            deviceId: 1,
            metadata: 1,
            createdAt: 1,
            readings: newReadingsObj
          }
        });
        
        // Filter out documents where all sensor arrays are now empty
        const orConditions = sensorTypesArray.map(type => ({
          [`readings.${type}.0`]: { $exists: true }
        }));
        
        pipeline.push({
          $match: {
            $or: orConditions
          }
        });
      } else {
        // If no specific sensor types, we need to handle all sensor types
        // Define an array of all possible sensor types
        const allSensorTypes = ["rain", "uv", "light", "dht22", "panel_temp", "ina226", "solar", "battery"];
        
        // Create a new readings object with filtered arrays for all sensor types
        const newReadingsObj = {};
        
        allSensorTypes.forEach(type => {
          // Filter the array to only include sensors with matching panel IDs
          // Use $ifNull to handle cases where a sensor type doesn't exist in a document
          newReadingsObj[type] = {
            $filter: {
              input: { $ifNull: [`$readings.${type}`, []] },
              as: "sensor",
              cond: { $in: ["$$sensor.panelId", panelIdsArray] }
            }
          };
        });
        
        // Add a project stage to replace the readings with the filtered version
        pipeline.push({
          $project: {
            deviceId: 1,
            metadata: 1,
            createdAt: 1,
            readings: newReadingsObj
          }
        });
        
        // Filter out documents where all sensor arrays are now empty after filtering
        const orConditions = allSensorTypes.map(type => ({
          [`readings.${type}.0`]: { $exists: true }
        }));
        
        pipeline.push({
          $match: {
            $or: orConditions
          }
        });
      }
    }
    
    // Execute the aggregation pipeline
    const sensorReadings = await SensorReading.aggregate(pipeline);
    
    res.status(200).json({ 
      success: true, 
      count: sensorReadings.length,
      data: sensorReadings 
    });
  } catch (error) {
    console.error("Error fetching filtered sensor readings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch filtered sensor readings",
      error: error.message 
    });
  }
};

export const createReading = async (req, res) => {
  const sensorReadings = req.body;

  try {
    const newSensorReading = new SensorReading(sensorReadings);
    await newSensorReading.save();
    res.status(201).json({ success: true, data: newSensorReading });
  } catch (error) {
    console.error("Error saving sensor readings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save sensor readings",
      error: error.message,
    });
  }
};

export const getCurrentSensorValues = async (req, res) => {
  try {
    const { deviceId, panelIds } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: "deviceId is required" 
      });
    }
    
    // Convert panelIds to array if provided
    const panelIdsArray = panelIds ? 
      (Array.isArray(panelIds) ? panelIds : panelIds.split(',')) : 
      null;
    
    // Find the most recent reading for the specified device
    const latestReading = await SensorReading.findOne(
      { deviceId: deviceId },
      {},
      { sort: { createdAt: -1 } }
    );
    
    if (!latestReading) {
      return res.status(404).json({
        success: false,
        message: `No readings found for device ${deviceId}`
      });
    }
    
    // Initialize result object with all sensor types
    const result = {
      deviceId: latestReading.deviceId,
      timestamp: latestReading.createdAt,
      sensors: {}
    };
    
    // Process each sensor type
    const sensorTypes = [
      { key: 'solar', path: 'solar' },
      { key: 'rain', path: 'rain' },
      { key: 'uv', path: 'uv' },
      { key: 'light', path: 'light' },
      { key: 'humidity', path: 'dht22', valueField: 'humidity' },
      { key: 'temperature', path: 'dht22', valueField: 'temperature' },
      { key: 'current', path: 'ina226', valueField: 'current' },
      { key: 'voltage', path: 'ina226', valueField: 'voltage' },
      { key: 'battery', path: 'battery' },
      { key: 'panel_temp', path: 'panel_temp' }
    ];
    
    for (const sensorType of sensorTypes) {
      const { key, path, valueField } = sensorType;
      
      // Skip if this sensor type doesn't exist in the reading
      if (!latestReading.readings[path] || !latestReading.readings[path].length) {
        result.sensors[key] = null;
        continue;
      }
      
      let relevantSensors;
      
      // Filter by panelIds if provided
      if (panelIdsArray && panelIdsArray.length > 0) {
        relevantSensors = latestReading.readings[path].filter(sensor => 
          panelIdsArray.includes(sensor.panelId)
        );
        
        // Skip if no matching panels for this sensor type
        if (relevantSensors.length === 0) {
          result.sensors[key] = null;
          continue;
        }
      } else {
        // Use all sensors of this type if no panel filter
        relevantSensors = latestReading.readings[path];
      }
      
      // For nested values (humidity, temperature, current, voltage)
      if (valueField) {
        const values = relevantSensors.map(sensor => sensor[valueField].average);
        const sum = values.reduce((acc, val) => acc + val, 0);
        const average = sum / values.length;
        const unit = relevantSensors[0][valueField].unit;
        
        result.sensors[key] = {
          value: average,
          unit: unit,
          panelCount: relevantSensors.length
        };
      } 
      // For direct values (solar, rain, uv, light, battery, panel_temp)
      else {
        const values = relevantSensors.map(sensor => sensor.average);
        const sum = values.reduce((acc, val) => acc + val, 0);
        const average = sum / values.length;
        const unit = relevantSensors[0].unit;
        
        result.sensors[key] = {
          value: average,
          unit: unit,
          panelCount: relevantSensors.length
        };
      }
    }
    
    // Add battery capacity if available
    if (latestReading.readings.battery_capacity) {
      result.sensors.battery_capacity = {
        value: latestReading.readings.battery_capacity,
        unit: latestReading.readings.battery_capacity.unit || "W"
      };
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error("Error fetching current sensor values:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current sensor values",
      error: error.message
    });
  }
};

export const getChartData = async (req, res) => {
  try {
    const { 
      deviceId, 
      panelIds, 
      startDateTime, 
      endDateTime, 
      timeInterval,
      chartType 
    } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: "deviceId is required" 
      });
    }
    
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: "startDateTime and endDateTime are required"
      });
    }
    
    if (!chartType) {
      return res.status(400).json({
        success: false,
        message: "chartType is required (energy, battery, panel_temp, or irradiance)"
      });
    }
    
    // Convert panelIds to array if provided
    const panelIdsArray = panelIds ? 
      (Array.isArray(panelIds) ? panelIds : panelIds.split(',')) : 
      null;
    
    // Determine which sensor types to query based on chart type
    let sensorTypes = [];
    switch (chartType) {
      case 'energy':
        sensorTypes = ['ina226']; // For current and voltage
        break;
      case 'battery':
        sensorTypes = ['battery'];
        break;
      case 'panel_temp':
        sensorTypes = ['panel_temp'];
        break;
      case 'irradiance':
        sensorTypes = ['solar'];
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid chartType. Must be one of: energy, battery, panel_temp, irradiance"
        });
    }
    
    // Build the aggregation pipeline
    const pipeline = [];
    
    // Match stage - filter by deviceId and time range
    pipeline.push({
      $match: {
        deviceId: deviceId,
        createdAt: {
          $gte: new Date(startDateTime),
          $lte: new Date(endDateTime)
        }
      }
    });
    
    // Project stage - only include the fields we need
    const projectStage = {
      deviceId: 1,
      createdAt: 1
    };
    
    // Add the required sensor types to the projection
    sensorTypes.forEach(type => {
      projectStage[`readings.${type}`] = 1;
    });
    
    pipeline.push({ $project: projectStage });
    
    // If panel IDs are specified, filter by panel ID
    if (panelIdsArray && panelIdsArray.length > 0) {
      const newReadingsObj = {};
      
      sensorTypes.forEach(type => {
        newReadingsObj[type] = {
          $filter: {
            input: `$readings.${type}`,
            as: "sensor",
            cond: { $in: ["$$sensor.panelId", panelIdsArray] }
          }
        };
      });
      
      pipeline.push({
        $project: {
          deviceId: 1,
          createdAt: 1,
          readings: newReadingsObj
        }
      });
      
      // Filter out documents where all sensor arrays are now empty
      const orConditions = sensorTypes.map(type => ({
        [`readings.${type}.0`]: { $exists: true }
      }));
      
      pipeline.push({
        $match: {
          $or: orConditions
        }
      });
    }
    
    // Sort by timestamp
    pipeline.push({ $sort: { createdAt: 1 } });
    
    // Execute the aggregation pipeline
    const readings = await SensorReading.aggregate(pipeline);
    
    // Process the data based on the time interval
    const timeIntervalMs = getTimeIntervalInMs(timeInterval || '15min');
    const aggregatedData = aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray);
    
    res.status(200).json({
      success: true,
      chartType: chartType,
      timeInterval: timeInterval || '15min',
      data: aggregatedData
    });
    
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message
    });
  }
};

// Helper function to convert time interval string to milliseconds
function getTimeIntervalInMs(intervalString) {
  switch (intervalString) {
    case '5min':
      return 5 * 60 * 1000;
    case '10min':
      return 10 * 60 * 1000;
    case '15min':
      return 15 * 60 * 1000;
    case '30min':
      return 30 * 60 * 1000;
    case 'hourly':
      return 60 * 60 * 1000;
    case 'daily':
      return 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // Default to 15 minutes
  }
}

// Helper function to aggregate data by time interval
function aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray) {
  if (readings.length === 0) return [];
  
  const result = [];
  const startTime = new Date(readings[0].createdAt).getTime();
  let currentBucket = {
    timestamp: new Date(startTime),
    values: []
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  for (const reading of readings) {
    const readingTime = new Date(reading.createdAt).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket by calculating averages
      if (currentBucket.values.length > 0) {
        finalizeDataBucket(currentBucket, chartType);
        result.push(currentBucket);
      }
      
      // Create a new bucket aligned to the time interval
      const bucketStartTime = new Date(
        Math.floor(readingTime / timeIntervalMs) * timeIntervalMs
      );
      
      currentBucket = {
        timestamp: bucketStartTime,
        values: []
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process the reading based on chart type
    processReadingForChart(reading, currentBucket, chartType, panelIdsArray);
  }
  
  // Finalize the last bucket
  if (currentBucket.values.length > 0) {
    finalizeDataBucket(currentBucket, chartType);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to process a reading for a specific chart type
function processReadingForChart(reading, bucket, chartType, panelIdsArray) {
  switch (chartType) {
    case 'energy':
      if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
        for (const sensor of reading.readings.ina226) {
          bucket.values.push({
            panelId: sensor.panelId,
            voltage: sensor.voltage.average,
            current: sensor.current.average,
            power: sensor.voltage.average * sensor.current.average
          });
        }
      }
      break;
      
    case 'battery':
      if (reading.readings.battery && reading.readings.battery.length > 0) {
        for (const sensor of reading.readings.battery) {
          bucket.values.push({
            panelId: sensor.panelId,
            value: sensor.average,
            unit: sensor.unit
          });
        }
      }
      break;
      
    case 'panel_temp':
      if (reading.readings.panel_temp && reading.readings.panel_temp.length > 0) {
        for (const sensor of reading.readings.panel_temp) {
          bucket.values.push({
            panelId: sensor.panelId,
            value: sensor.average,
            unit: sensor.unit
          });
        }
      }
      break;
      
    case 'irradiance':
      if (reading.readings.solar && reading.readings.solar.length > 0) {
        for (const sensor of reading.readings.solar) {
          bucket.values.push({
            panelId: sensor.panelId,
            value: sensor.average,
            unit: sensor.unit
          });
        }
      }
      break;
  }
}

// Helper function to finalize a data bucket by calculating averages
function finalizeDataBucket(bucket, chartType) {
  if (bucket.values.length === 0) return;
  
  // Group values by panelId
  const panelGroups = {};
  
  for (const value of bucket.values) {
    if (!panelGroups[value.panelId]) {
      panelGroups[value.panelId] = [];
    }
    panelGroups[value.panelId].push(value);
  }
  
  // Calculate averages for each panel
  const panelAverages = [];
  
  for (const [panelId, values] of Object.entries(panelGroups)) {
    switch (chartType) {
      case 'energy':
        const totalPower = values.reduce((sum, v) => sum + v.power, 0);
        const avgPower = totalPower / values.length;
        panelAverages.push({
          panelId,
          power: avgPower,
          unit: 'W'
        });
        break;
        
      case 'battery':
      case 'panel_temp':
      case 'irradiance':
        const totalValue = values.reduce((sum, v) => sum + v.value, 0);
        const avgValue = totalValue / values.length;
        panelAverages.push({
          panelId,
          value: avgValue,
          unit: values[0].unit
        });
        break;
    }
  }
  
  // Calculate overall average across all panels
  let overallAverage;
  
  switch (chartType) {
    case 'energy':
      const totalPower = panelAverages.reduce((sum, panel) => sum + panel.power, 0);
      overallAverage = {
        value: totalPower / panelAverages.length,
        unit: 'W'
      };
      break;
      
    case 'battery':
    case 'panel_temp':
    case 'irradiance':
      const totalValue = panelAverages.reduce((sum, panel) => sum + panel.value, 0);
      overallAverage = {
        value: totalValue / panelAverages.length,
        unit: panelAverages[0].unit
      };
      break;
  }
  
  // Replace the values array with the processed data
  bucket.panels = panelAverages;
  bucket.average = overallAverage;
  delete bucket.values;
}

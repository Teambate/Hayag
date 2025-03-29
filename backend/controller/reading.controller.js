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
    
    // Get the Socket.io instance
    const io = req.app.get('io');
    
    if (io) {
      // Send the current sensor values to subscribed clients
      const currentValues = await processReadingForCurrentValues(newSensorReading);
      
      // Add these debug logs here
      console.log(`Emitting to room: device:${newSensorReading.deviceId}`);
      console.log(`Current values:`, JSON.stringify(currentValues));
      
      // Emit to the specific device room
      io.to(`device:${newSensorReading.deviceId}`).emit('sensorUpdate', currentValues);
      
      // Emit to all chart subscribers for this device with the new chart data point
      const chartData = processReadingForCharts(newSensorReading);
      
      // You can also add additional logs here
      console.log(`Chart data types:`, Object.keys(chartData));
      
      Object.keys(chartData).forEach(chartType => {
        io.to(`device:${newSensorReading.deviceId}:${chartType}`).emit('chartUpdate', {
          chartType,
          dataPoint: chartData[chartType]
        });
      });
    } else {
      // Add a debug log to check if io is undefined
      console.log("Socket.io instance not available");
    }
    
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
        unit: "W"
      };
    }
    
    // Calculate power for each panel and total power
    if (latestReading.readings.ina226 && latestReading.readings.ina226.length > 0) {
      const panelPowers = [];
      let totalPower = 0;
      
      // Filter panels if needed
      const relevantPanels = panelIdsArray && panelIdsArray.length > 0 
        ? latestReading.readings.ina226.filter(sensor => panelIdsArray.includes(sensor.panelId))
        : latestReading.readings.ina226;
      
      for (const sensor of relevantPanels) {
        const voltage = sensor.voltage.average;
        const current = sensor.current.average / 1000; // Convert mA to A
        const power = voltage * current; // Power in Watts
        
        panelPowers.push({
          panelId: sensor.panelId,
          power: power,
          unit: 'W'
        });
        
        totalPower += power;
      }
      
      result.sensors.panel_power = {
        panels: panelPowers,
        total: totalPower,
        average: totalPower / relevantPanels.length,
        unit: 'W'
      };
      
      // Calculate power accumulation for today (from midnight to current time)
      // Get start of today in device's timezone (or UTC if not available)
      const today = new Date(latestReading.createdAt);
      today.setHours(0, 0, 0, 0); // Set to beginning of the day
      
      const previousReadings = await SensorReading.find({
        deviceId: deviceId,
        createdAt: { $gte: today, $lt: latestReading.createdAt }
      }).sort({ createdAt: 1 });
      
      // Include the latest reading
      const allReadings = [...previousReadings, latestReading];
      
      // Only proceed if we have at least 2 readings
      if (allReadings.length >= 2) {
        // Calculate power accumulation for each panel
        const panelAccumulations = {};
        let totalAccumulation = 0;
        
        // Process each reading pair to calculate energy between them
        for (let i = 1; i < allReadings.length; i++) {
          const prevReading = allReadings[i-1];
          const currReading = allReadings[i];
          
          // Time difference in hours
          const hoursDiff = (currReading.createdAt - prevReading.createdAt) / (1000 * 60 * 60);
          
          // Process each panel in the current reading
          for (const sensor of currReading.readings.ina226 || []) {
            // Skip if panelIds filter is applied and this panel is not included
            if (panelIdsArray && !panelIdsArray.includes(sensor.panelId)) continue;
            
            // Find the same panel in the previous reading
            const prevSensor = prevReading.readings.ina226?.find(s => s.panelId === sensor.panelId);
            
            if (prevSensor) {
              // Calculate average power between the two readings
              const currPower = sensor.voltage.average * (sensor.current.average / 1000); // W
              const prevPower = prevSensor.voltage.average * (prevSensor.current.average / 1000); // W
              const avgPower = (currPower + prevPower) / 2; // W
              
              // Calculate energy (kWh) = power (W) * time (h) / 1000
              const energyKWh = avgPower * hoursDiff / 1000;
              
              // Add to panel accumulation
              if (!panelAccumulations[sensor.panelId]) {
                panelAccumulations[sensor.panelId] = 0;
              }
              panelAccumulations[sensor.panelId] += energyKWh;
              totalAccumulation += energyKWh;
            }
          }
        }
        
        // Format the result
        const panelAccumulationArray = Object.entries(panelAccumulations).map(([panelId, energy]) => ({
          panelId,
          energy,
          unit: 'kWh'
        }));
        
        result.power_accumulation = {
          panels: panelAccumulationArray,
          total: totalAccumulation,
          average: totalAccumulation / Object.keys(panelAccumulations).length,
          period: "today",
          unit: 'kWh'
        };
      } else {
        result.power_accumulation = {
          message: "Insufficient data for power accumulation calculation",
          period: "today"
        };
      }
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

export const getDashboardChartData = async (req, res) => {
  try {
    const { 
      deviceId, 
      panelIds, 
      timeInterval = '10min',
      chartTypes 
    } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: "deviceId is required" 
      });
    }
    
    // Validate time interval
    if (!['5min', '10min', '15min', '30min', 'hourly', 'daily'].includes(timeInterval)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timeInterval. Must be one of: 5min, 10min, 15min, 30min, hourly, daily"
      });
    }
    
    // Convert chart types to array if provided
    const chartTypesArray = chartTypes ? 
      (Array.isArray(chartTypes) ? chartTypes : chartTypes.split(',')) : 
      ['energy', 'battery', 'panel_temp', 'irradiance'];
      
    // Validate chart types
    const validChartTypes = ['energy', 'battery', 'panel_temp', 'irradiance'];
    for (const chartType of chartTypesArray) {
      if (!validChartTypes.includes(chartType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid chartType: ${chartType}. Must be one of: energy, battery, panel_temp, irradiance`
        });
      }
    }
    
    // Convert panelIds to array if provided
    const panelIdsArray = panelIds ? 
      (Array.isArray(panelIds) ? panelIds : panelIds.split(',')) : 
      null;
    
    // Determine which sensor types to query based on chart types
    const sensorTypesMap = {
      'energy': ['ina226'],
      'battery': ['battery'],
      'panel_temp': ['panel_temp'],
      'irradiance': ['solar']
    };
    
    // Create a Set to store unique sensor types
    const sensorTypesSet = new Set();
    
    // Add sensor types based on requested chart types
    chartTypesArray.forEach(chartType => {
      sensorTypesMap[chartType].forEach(sensorType => {
        sensorTypesSet.add(sensorType);
      });
    });
    
    // Convert Set back to array
    const sensorTypes = Array.from(sensorTypesSet);
    
    // First, find the latest reading to determine which day to show
    const latestReading = await SensorReading.findOne(
      { deviceId: deviceId },
      { createdAt: 1 },
      { sort: { createdAt: -1 } }
    );
    
    if (!latestReading) {
      return res.status(404).json({
        success: false,
        message: `No readings found for device ${deviceId}`
      });
    }
    
    // Get the start of the day for the latest reading (in UTC)
    const latestDate = new Date(latestReading.createdAt);
    const startOfDay = new Date(latestDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(latestDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    // Build the aggregation pipeline
    const pipeline = [];
    
    // Match stage - filter by deviceId and date of latest reading
    pipeline.push({
      $match: {
        deviceId: deviceId,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
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
    const timeIntervalMs = getTimeIntervalInMs(timeInterval);
    
    // Create a result object for each chart type
    const result = {};
    
    for (const chartType of chartTypesArray) {
      result[chartType] = aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray);
    }
    
    res.status(200).json({
      success: true,
      timeInterval: timeInterval,
      date: startOfDay.toISOString().split('T')[0],
      data: result
    });
    
  } catch (error) {
    console.error("Error fetching dashboard chart data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard chart data",
      error: error.message
    });
  }
};

export const getPanelIdsForDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: "deviceId is required" 
      });
    }
    
    // Define all sensor types that might have panel IDs
    const sensorTypes = ["rain", "uv", "light", "dht22", "panel_temp", "ina226", "solar", "battery"];
    
    // Create a simpler pipeline to extract unique panel IDs
    // First find all readings for this device
    const readings = await SensorReading.find({ deviceId: deviceId });
    
    // Collect all panel IDs
    const panelIdSet = new Set();
    
    // Process each reading
    readings.forEach(reading => {
      // Check each sensor type
      sensorTypes.forEach(type => {
        // If this sensor type exists in the reading
        if (reading.readings[type] && Array.isArray(reading.readings[type])) {
          // Add all panel IDs to the set
          reading.readings[type].forEach(sensor => {
            if (sensor.panelId) {
              panelIdSet.add(sensor.panelId);
            }
          });
        }
      });
    });
    
    // Convert Set to Array and sort
    const uniquePanelIds = Array.from(panelIdSet).sort();
    
    res.status(200).json({ 
      success: true, 
      count: uniquePanelIds.length,
      data: uniquePanelIds
    });
  } catch (error) {
    console.error("Error fetching unique panel IDs:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch unique panel IDs",
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

// Helper function to process a reading for current sensor values
function processReadingForCurrentValues(reading) {
  const result = {
    deviceId: reading.deviceId,
    timestamp: reading.createdAt,
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
    result.sensors[key] = [];
    
    if (reading.readings[path] && reading.readings[path].length > 0) {
      reading.readings[path].forEach(sensor => {
        let value;
        if (valueField) {
          // For nested values like dht22.humidity
          value = sensor[valueField].average;
        } else {
          // For direct values like solar, rain, etc.
          value = sensor.average;
        }
        
        result.sensors[key].push({
          panelId: sensor.panelId,
          value: value,
          unit: valueField ? sensor[valueField].unit : sensor.unit
        });
      });
    }
  }
  
  return result;
}

// Helper function to process a reading for chart updates
function processReadingForCharts(reading) {
  const chartData = {
    energy: [],
    battery: [],
    panel_temp: [],
    irradiance: []
  };
  
  const timestamp = reading.createdAt.getTime();
  
  // Energy production (using current and voltage)
  if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
    reading.readings.ina226.forEach(sensor => {
      const voltage = sensor.voltage.average;
      const current = sensor.current.average;
      const power = voltage * current / 1000; // Convert to watts
      
      chartData.energy.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: power,
        unit: 'W'
      });
    });
  }
  
  // Battery charge
  if (reading.readings.battery && reading.readings.battery.length > 0) {
    reading.readings.battery.forEach(sensor => {
      chartData.battery.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: sensor.average,
        unit: sensor.unit
      });
    });
  }
  
  // Panel temperature
  if (reading.readings.panel_temp && reading.readings.panel_temp.length > 0) {
    reading.readings.panel_temp.forEach(sensor => {
      chartData.panel_temp.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: sensor.average,
        unit: sensor.unit
      });
    });
  }
  
  // Irradiance (using solar)
  if (reading.readings.solar && reading.readings.solar.length > 0) {
    reading.readings.solar.forEach(sensor => {
      chartData.irradiance.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: sensor.average,
        unit: sensor.unit
      });
    });
  }
  
  return chartData;
}

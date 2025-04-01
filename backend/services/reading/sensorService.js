import SensorReading from "../../model/reading.model.js";
import { processReadingForCurrentValues } from "../../utils/sensorUtils.js";

export const getCurrentSensorValuesService = async (params) => {
  const { deviceId } = params;
  
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // Find the most recent reading for the specified device
  const latestReading = await SensorReading.findOne(
    { deviceId: deviceId },
    {},
    { sort: { endTime: -1 } }
  );
  
  if (!latestReading) {
    throw new Error(`No readings found for device ${deviceId}`);
  }
  
  // Initialize result object with all sensor types
  const result = {
    deviceId: latestReading.deviceId,
    timestamp: latestReading.endTime || latestReading.createdAt,
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
    
    // Use all sensors of this type
    const relevantSensors = latestReading.readings[path];
    
    // For nested values (humidity, temperature, current, voltage)
    if (valueField) {
      const values = relevantSensors.map(sensor => sensor[valueField].average);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = sum / values.length;
      const unit = relevantSensors[0][valueField].unit;
      
      // Include individual panel values
      const panels = relevantSensors.map(sensor => ({
        panelId: sensor.panelId,
        value: sensor[valueField].average,
        unit: sensor[valueField].unit
      }));
      
      result.sensors[key] = {
        value: average,
        unit: unit,
        panelCount: relevantSensors.length,
        panels: panels
      };
    } 
    // For direct values (solar, rain, uv, light, battery, panel_temp)
    else {
      const values = relevantSensors.map(sensor => sensor.average);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = sum / values.length;
      const unit = relevantSensors[0].unit;
      
      // Include individual panel values
      const panels = relevantSensors.map(sensor => ({
        panelId: sensor.panelId,
        value: sensor.average,
        unit: sensor.unit
      }));
      
      result.sensors[key] = {
        value: average,
        unit: unit,
        panelCount: relevantSensors.length,
        panels: panels
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
    
    const relevantPanels = latestReading.readings.ina226;
    
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
    await calculatePowerAccumulation(result, deviceId, latestReading);
  }
  
  return result;
};

export const getPanelIdsForDeviceService = async (deviceId) => {
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // Use the optimized MongoDB aggregation pipeline to get all unique panel IDs across all sensor types
  const result = await SensorReading.aggregate([
    { $match: { deviceId } },
    {
      '$project': {
        'panelIds': {
          '$setUnion': [
            '$readings.rain.panelId', 
            '$readings.uv.panelId', 
            '$readings.light.panelId', 
            '$readings.dht22.panelId', 
            '$readings.panel_temp.panelId', 
            '$readings.ina226.panelId', 
            '$readings.solar.panelId', 
            '$readings.battery.panelId'
          ]
        }
      }
    }, 
    {
      '$unwind': '$panelIds'
    }, 
    {
      '$group': {
        '_id': null, 
        'uniquePanelIds': {
          '$addToSet': '$panelIds'
        }
      }
    }, 
    {
      '$project': {
        '_id': 0, 
        'uniquePanelIds': 1
      }
    }
  ]);
  
  // Extract the unique panel IDs from the result or return empty array if no results
  const uniquePanelIds = result.length > 0 ? result[0].uniquePanelIds : [];
  
  // Sort the panel IDs
  uniquePanelIds.sort();
  
  return {
    count: uniquePanelIds.length,
    data: uniquePanelIds
  };
};

export const createReadingService = async (sensorReadings, io) => {
  const newSensorReading = new SensorReading(sensorReadings);
  await newSensorReading.save();
  
  // Send the current sensor values to subscribed clients if socket.io is available
  if (io) {
    // Process the reading and also calculate power accumulation
    const currentValues = await processReadingForCurrentValues(newSensorReading);
    
    // Calculate power for the reading and update currentValues
    if (newSensorReading.readings.ina226 && newSensorReading.readings.ina226.length > 0) {
      await calculatePowerAccumulation(currentValues, newSensorReading.deviceId, newSensorReading);
    }
    
    // Enhanced debug logs
    console.log(`Socket.io is available. Device ID: ${newSensorReading.deviceId}`);
    console.log(`Room name: device:${newSensorReading.deviceId}`);
    console.log(`Connected clients: ${io.sockets.adapter.rooms.get(`device:${newSensorReading.deviceId}`)?.size || 0}`);
    console.log(`Current values:`, JSON.stringify(currentValues));
    
    // Emit the complete data including power accumulation
    io.to(`device:${newSensorReading.deviceId}`).emit('sensorUpdate', currentValues);
    
    // Emit to all chart subscribers for this device with the new chart data point
    const chartData = processReadingForCharts(newSensorReading);
    
    // Enhanced chart data logs
    console.log(`Chart data types:`, Object.keys(chartData));
    Object.keys(chartData).forEach(chartType => {
      const roomName = `device:${newSensorReading.deviceId}:${chartType}`;
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      console.log(`Emitting chart data for ${chartType} to ${roomSize} clients in room ${roomName}`);
      
      io.to(roomName).emit('chartUpdate', {
        chartType,
        dataPoint: chartData[chartType]
      });
    });
  } else {
    console.error("Socket.io instance not available - check server.js io initialization");
  }
  
  return newSensorReading;
};

/**
 * Bulk insert readings from JSON data
 * @param {Array} readingsData - Array of sensor readings objects
 * @param {Object} options - Options for the bulk insert
 * @param {number} options.batchSize - Number of documents to insert in each batch (default: 100)
 * @param {boolean} options.emitEvents - Whether to emit socket events for each reading (default: false)
 * @param {Object} io - Socket.io instance (required only if emitEvents is true)
 * @returns {Object} - Result of the bulk insertion
 */
export const bulkInsertReadingsService = async (readingsData, options = {}, io = null) => {
  // Set default options
  const batchSize = options.batchSize || 100;
  const emitEvents = options.emitEvents || false;
  
  if (emitEvents && !io) {
    throw new Error("Socket.io instance (io) is required when emitEvents is true");
  }
  
  if (!Array.isArray(readingsData)) {
    throw new Error("readingsData must be an array");
  }
  
  const result = {
    totalDocuments: readingsData.length,
    insertedCount: 0,
    failedCount: 0,
    errors: [],
    batches: []
  };
  
  // Process in batches
  for (let i = 0; i < readingsData.length; i += batchSize) {
    const batch = readingsData.slice(i, i + batchSize);
    const batchResult = {
      batchNumber: Math.floor(i / batchSize) + 1,
      startIndex: i,
      endIndex: Math.min(i + batchSize - 1, readingsData.length - 1),
      insertedCount: 0,
      failedIndices: []
    };
    
    try {
      // Create batch operations
      const operations = batch.map(reading => ({
        insertOne: {
          document: reading
        }
      }));
      
      // Perform bulk write operation
      const bulkWriteResult = await SensorReading.bulkWrite(operations, { ordered: false });
      batchResult.insertedCount = bulkWriteResult.insertedCount;
      result.insertedCount += bulkWriteResult.insertedCount;
      
      // Emit events if needed
      if (emitEvents && io) {
        for (const reading of batch) {
          try {
            const newReading = new SensorReading(reading);
            const currentValues = await processReadingForCurrentValues(newReading);
            io.to(`device:${reading.deviceId}`).emit('sensorUpdate', currentValues);
            
            const chartData = processReadingForCharts(newReading);
            Object.keys(chartData).forEach(chartType => {
              io.to(`device:${reading.deviceId}:${chartType}`).emit('chartUpdate', {
                chartType,
                dataPoint: chartData[chartType]
              });
            });
          } catch (emitError) {
            console.error(`Error emitting events for reading at index ${i}:`, emitError);
          }
        }
      }
    } catch (batchError) {
      // Handle bulk write errors - some documents might have been inserted
      console.error(`Error in batch ${batchResult.batchNumber}:`, batchError);
      
      if (batchError.writeErrors) {
        // Collect indices of failed documents
        batchError.writeErrors.forEach(writeError => {
          const failedIndex = i + writeError.index;
          batchResult.failedIndices.push(failedIndex);
          result.errors.push({
            index: failedIndex,
            error: writeError.errmsg || writeError.message
          });
        });
        
        // Update counts based on the error information
        batchResult.insertedCount = batch.length - batchResult.failedIndices.length;
        result.insertedCount += batchResult.insertedCount;
        result.failedCount += batchResult.failedIndices.length;
      } else {
        // If the entire batch failed
        batchResult.insertedCount = 0;
        batchResult.failedIndices = Array.from({ length: batch.length }, (_, idx) => i + idx);
        result.failedCount += batch.length;
        result.errors.push({
          batchNumber: batchResult.batchNumber,
          error: batchError.message
        });
      }
    }
    
    result.batches.push(batchResult);
  }
  
  return result;
};

async function calculatePowerAccumulation(result, deviceId, latestReading) {
  // Get start of today in device's timezone (or UTC if not available)
  const today = new Date(latestReading.endTime);
  today.setHours(0, 0, 0, 0); // Set to beginning of the day
  
  // Use enhanced aggregation pipeline with more specific filters
  const pipeline = [
    {
      $match: {
        deviceId: deviceId,
        endTime: { 
          $gte: today, 
          $lte: latestReading.endTime 
        }
      }
    },
    { $sort: { endTime: 1 } },
    {
      $project: {
        endTime: 1,
        deviceId: 1,
        "readings.ina226": 1
      }
    }
  ];
  
  // Get readings
  const readings = await SensorReading.aggregate(pipeline);
  
  // Include latest reading in the right position if not already included
  let allReadings = [...readings];
  
  // Initialize with consistent structure
  result.power_accumulation = {
    panels: [],
    total: 0,
    average: 0,
    period: "today",
    unit: 'kWh'
  };
  
  // Only proceed with calculation if we have at least 2 readings
  if (allReadings.length >= 2) {
    // Calculate power accumulation for each panel
    const panelAccumulations = {};
    let totalAccumulation = 0;
    
    // Process each reading pair to calculate energy between them
    for (let i = 1; i < allReadings.length; i++) {
      const prevReading = allReadings[i-1];
      const currReading = allReadings[i];
      
      // Time difference in hours - now using endTime instead of createdAt
      const hoursDiff = (currReading.endTime - prevReading.endTime) / (1000 * 60 * 60);
      
      // Process each panel in the current reading
      for (const sensor of currReading.readings.ina226 || []) {
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
    
    // Update the pre-initialized structure
    result.power_accumulation.panels = panelAccumulationArray;
    result.power_accumulation.total = totalAccumulation;
    result.power_accumulation.average = Object.keys(panelAccumulations).length > 0 
      ? totalAccumulation / Object.keys(panelAccumulations).length 
      : 0;
  } else {
    // Add message field for debugging but keep the structure consistent
    result.power_accumulation.message = "Insufficient data for power accumulation calculation";
    
    // Add empty panel entries for panels found in the latest reading
    if (latestReading.readings.ina226) {
      result.power_accumulation.panels = latestReading.readings.ina226.map(sensor => ({
        panelId: sensor.panelId,
        energy: 0,
        unit: 'kWh'
      }));
    }
  }
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
import SensorReading from "../../model/reading.model.js";
import { processReadingForCurrentValues } from "../../utils/sensorUtils.js";
import { getStartOfDay } from "../../utils/timeUtils.js";
import { formatDecimal } from '../../utils/numberUtils.js';

export const getCurrentSensorValuesService = async (params) => {
  const { deviceId, timezone } = params;
  
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
    timestamp: latestReading.endTime,
    sensors: {},
    health: 0,
    sensor_health: {}
  };
  
  // Get health data for the entire day, passing timezone and latest reading timestamp
  const healthData = await getSensorHealthForDay(deviceId, timezone, latestReading.endTime);
  result.health = healthData.health;
  result.sensor_health = healthData.sensor_health;
  
  // Process each sensor type
  const sensorTypes = [
    { key: 'solar', path: 'solar', includeInHealth: true },
    { key: 'rain', path: 'rain', includeInHealth: true },
    { key: 'uv', path: 'uv', includeInHealth: true },
    { key: 'light', path: 'light', includeInHealth: true },
    { key: 'humidity', path: 'dht22', valueField: 'humidity', includeInHealth: true },
    { key: 'temperature', path: 'dht22', valueField: 'temperature', includeInHealth: true },
    { key: 'current', path: 'ina226', valueField: 'current', includeInHealth: true },
    { key: 'voltage', path: 'ina226', valueField: 'voltage', includeInHealth: true },
    { key: 'battery', path: 'battery', includeInHealth: true },
    { key: 'panel_temp', path: 'panel_temp', includeInHealth: true },
    { key: 'actual_avg_power', path: 'actual_avg_power', includeInHealth: false },
    { key: 'predicted_avg_power', path: 'predicted_avg_power', includeInHealth: false },
    { key: 'actual_total_energy', path: 'actual_total_energy', isEnergyField: true, includeInHealth: false },
    { key: 'predicted_total_energy', path: 'predicted_total_energy', isEnergyField: true, includeInHealth: false }
  ];
  
  // Keep track of total health for calculating average
  let totalHealth = 0;
  let healthCount = 0;
  
  for (const sensorType of sensorTypes) {
    const { key, path, valueField, isEnergyField, includeInHealth } = sensorType;
    
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
      
      // Calculate average health for this sensor type
      const healthValues = relevantSensors.map(sensor => sensor[valueField].health);
      const healthSum = healthValues.reduce((acc, val) => acc + val, 0);
      const healthAvg = healthSum / healthValues.length;
      
      // Add to total health calculation
      totalHealth += healthAvg;
      healthCount++;
      
      // Store sensor health in result
      if (includeInHealth) {
        result.sensor_health[key] = Math.round(healthAvg);
      }
      
      // Include individual panel values
      const panels = relevantSensors.map(sensor => ({
        panelId: sensor.panelId,
        value: sensor[valueField].average,
        unit: sensor[valueField].unit,
        health: sensor[valueField].health
      }));
      
      result.sensors[key] = {
        value: average,
        unit: unit,
        panelCount: relevantSensors.length,
        panels: panels,
        health: Math.round(healthAvg)
      };
    } 
    // For direct values (solar, rain, uv, light, battery, panel_temp)
    else if (isEnergyField) {
      const values = relevantSensors.map(sensor => sensor.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = sum / values.length;
      const unit = relevantSensors[0].unit;
      
      // Calculate average health for this sensor type
      const healthValues = relevantSensors.map(sensor => sensor.health);
      const healthSum = healthValues.reduce((acc, val) => acc + val, 0);
      const healthAvg = healthSum / healthValues.length;
      
      // Add to total health calculation
      totalHealth += healthAvg;
      healthCount++;
      
      // Store sensor health in result
      if (includeInHealth) {
        result.sensor_health[key] = Math.round(healthAvg);
      }
      
      // Include individual panel values
      const panels = relevantSensors.map(sensor => ({
        panelId: sensor.panelId,
        value: sensor.value,
        unit: sensor.unit,
        health: sensor.health
      }));
      
      result.sensors[key] = {
        value: average,
        unit: unit,
        panelCount: relevantSensors.length,
        panels: panels,
        health: Math.round(healthAvg)
      };
    }
    else {
      const values = relevantSensors.map(sensor => sensor.average);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = sum / values.length;
      const unit = relevantSensors[0].unit;
      
      // Calculate average health for this sensor type
      const healthValues = relevantSensors.map(sensor => sensor.health);
      const healthSum = healthValues.reduce((acc, val) => acc + val, 0);
      const healthAvg = healthSum / healthValues.length;
      
      // Add to total health calculation
      totalHealth += healthAvg;
      healthCount++;
      
      // Store sensor health in result
      if (includeInHealth) {
        result.sensor_health[key] = Math.round(healthAvg);
      }
      
      // Include individual panel values
      const panels = relevantSensors.map(sensor => ({
        panelId: sensor.panelId,
        value: sensor.average,
        unit: sensor.unit,
        health: sensor.health
      }));
      
      result.sensors[key] = {
        value: average,
        unit: unit,
        panelCount: relevantSensors.length,
        panels: panels,
        health: Math.round(healthAvg)
      };
    }
  }
  
  // Calculate overall health average
  if (healthCount > 0) {
    result.health = Math.round(totalHealth / healthCount);
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
    
    // Add health data calculation
    const healthData = await getSensorHealthForDay(newSensorReading.deviceId, currentValues.timezone, currentValues.timestamp);
    currentValues.health = healthData.health;
    currentValues.sensor_health = healthData.sensor_health;
    
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
  const timezone = result.timezone || null;
  const today = getStartOfDay(latestReading.endTime, timezone);
  
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
        "readings.actual_total_energy": 1,
        "readings.predicted_total_energy": 1
      }
    }
  ];
  
  // Get readings
  const readings = await SensorReading.aggregate(pipeline);
  
  // Initialize power accumulation structure with the format specified
  result.power_accumulation = {
    panels: [],
    actual_energy: 0,
    predicted_energy: 0,
    period: "today",
    unit: "kWh"
  };
  
  // If no readings for today, use empty values
  if (!readings || readings.length === 0) {
    // Add empty panel entries based on panels found in the latest reading
    if (latestReading.readings.actual_total_energy) {
      result.power_accumulation.panels = latestReading.readings.actual_total_energy.map(panel => ({
        panelId: panel.panelId,
        actual_energy: 0,
        predicted_energy: 0,
        unit: "kWh"
      }));
    }
    return;
  }
  
  // Create a map to track panel energy values
  const panelEnergyMap = {};
  let totalActualEnergy = 0;
  let totalPredictedEnergy = 0;
  
  // Process each reading to get the energy values
  for (const reading of readings) {
    // Process actual total energy if available
    if (reading.readings.actual_total_energy && reading.readings.actual_total_energy.length > 0) {
      for (const panel of reading.readings.actual_total_energy) {
        if (!panelEnergyMap[panel.panelId]) {
          panelEnergyMap[panel.panelId] = {
            actual_energy: 0,
            predicted_energy: 0
          };
        }
        
        // Add panel's actual energy value
        panelEnergyMap[panel.panelId].actual_energy += panel.value;
        totalActualEnergy += panel.value;
      }
    }
    
    // Process predicted total energy if available
    if (reading.readings.predicted_total_energy && reading.readings.predicted_total_energy.length > 0) {
      for (const panel of reading.readings.predicted_total_energy) {
        if (!panelEnergyMap[panel.panelId]) {
          panelEnergyMap[panel.panelId] = {
            actual_energy: 0,
            predicted_energy: 0
          };
        }
        
        // Add panel's predicted energy value
        panelEnergyMap[panel.panelId].predicted_energy += panel.value;
        totalPredictedEnergy += panel.value;
      }
    }
  }
  
  // Format the result
  result.power_accumulation.panels = Object.entries(panelEnergyMap).map(([panelId, energyData]) => ({
    panelId,
    actual_energy: energyData.actual_energy,
    predicted_energy: energyData.predicted_energy,
    unit: "kWh"
  }));
  
  // Update totals
  result.power_accumulation.actual_energy = totalActualEnergy;
  result.power_accumulation.predicted_energy = totalPredictedEnergy;
}

// Track previous readings for energy accumulation calculations in real-time updates
const previousReadingsCache = {};

function processReadingForCharts(reading) {
  const chartData = {
    energy: [],
    battery: [],
    panel_temp: [],
    irradiance: []
  };
  
  const timestamp = reading.endTime.getTime();
  
  // Energy production using actual and predicted values from the new fields
  
  // Process actual_avg_power if available
  if (reading.readings.actual_avg_power && reading.readings.actual_avg_power.length > 0) {
    reading.readings.actual_avg_power.forEach(sensor => {
      chartData.energy.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        power: sensor.average,  // Use average from the actual power
        unit: sensor.unit
      });
    });
  }
  
  // Process actual_total_energy if available
  if (reading.readings.actual_total_energy && reading.readings.actual_total_energy.length > 0) {
    reading.readings.actual_total_energy.forEach(sensor => {
      // Find if we already added this panel
      const existingPanelIndex = chartData.energy.findIndex(item => item.panelId === sensor.panelId);
      
      if (existingPanelIndex >= 0) {
        // Update existing entry
        chartData.energy[existingPanelIndex].energy = sensor.value;
        chartData.energy[existingPanelIndex].energyUnit = sensor.unit;
      } else {
        // Add new entry
        chartData.energy.push({
          panelId: sensor.panelId,
          timestamp: timestamp,
          energy: sensor.value,
          energyUnit: sensor.unit
        });
      }
    });
  }
  
  // Process predicted_total_energy if available
  if (reading.readings.predicted_total_energy && reading.readings.predicted_total_energy.length > 0) {
    reading.readings.predicted_total_energy.forEach(sensor => {
      // Find if we already added this panel
      const existingPanelIndex = chartData.energy.findIndex(item => item.panelId === sensor.panelId);
      
      if (existingPanelIndex >= 0) {
        // Update existing entry
        chartData.energy[existingPanelIndex].predicted = sensor.value;
      } else {
        // Add new entry (missing actual energy data)
        chartData.energy.push({
          panelId: sensor.panelId,
          timestamp: timestamp,
          energy: 0, // Default value
          predicted: sensor.value,
          energyUnit: sensor.unit
        });
      }
    });
  }
  
  // Fallback to calculating energy from ina226 if new fields are not available
  if (chartData.energy.length === 0 && reading.readings.ina226 && reading.readings.ina226.length > 0) {
    reading.readings.ina226.forEach(sensor => {
      const voltage = sensor.voltage.average;
      const current = sensor.current.average;
      const currentPower = voltage * current / 1000; // Convert to watts
      
      // Get previous reading for this panel to calculate energy accumulation
      const panelCacheKey = `${reading.deviceId}:${sensor.panelId}`;
      const prevReading = previousReadingsCache[panelCacheKey];
      let energyKWh = 0;
      
      if (prevReading) {
        // Calculate energy accumulation (kWh) between readings
        const hoursDiff = (new Date(reading.endTime) - new Date(prevReading.timestamp)) / (1000 * 60 * 60);
        const avgPower = (currentPower + prevReading.power) / 2; // W
        energyKWh = avgPower * hoursDiff / 1000; // kWh
        
        // Avoid negative values
        energyKWh = energyKWh > 0 ? energyKWh : 0;
      }
      
      // Update previous reading cache for next calculation
      previousReadingsCache[panelCacheKey] = {
        timestamp: reading.endTime,
        power: currentPower
      };
      
      chartData.energy.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        power: currentPower,
        energy: energyKWh,
        unit: 'W',
        energyUnit: 'kWh'
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
  
  // Log data being sent to ensure proper structure
  Object.keys(chartData).forEach(chartType => {
    if (chartData[chartType].length > 0) {
      console.log(`Emitting ${chartType} chart data`, JSON.stringify(chartData[chartType]));
    }
  });
  
  return chartData;
}

// Updated function to get only health data for a day
export const getSensorHealthForDay = async (deviceId, timezone, timestamp = null) => {
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // Use provided timestamp or current time
  const referenceTime = timestamp ? new Date(timestamp) : new Date();
  
  // Get start of day in client's timezone
  const startOfDay = getStartOfDay(referenceTime, timezone);
  
  // Find all readings for the day
  const dailyReadings = await SensorReading.find(
    { 
      deviceId: deviceId,
      endTime: { $gte: startOfDay } 
    },
    {
      // Select only the health fields to optimize the query
      "readings.rain.health": 1,
      "readings.uv.health": 1,
      "readings.light.health": 1,
      "readings.dht22.temperature.health": 1,
      "readings.dht22.humidity.health": 1,
      "readings.panel_temp.health": 1,
      "readings.ina226.voltage.health": 1,
      "readings.ina226.current.health": 1,
      "readings.battery.health": 1,
      "readings.solar.health": 1
    },
    { sort: { endTime: 1 } }
  );
  
  if (!dailyReadings || dailyReadings.length === 0) {
    // Fall back to the latest reading if no readings found for today
    const latestReading = await SensorReading.findOne(
      { deviceId: deviceId },
      {
        // Select only the health fields
        "readings.rain.health": 1,
        "readings.uv.health": 1,
        "readings.light.health": 1,
        "readings.dht22.temperature.health": 1,
        "readings.dht22.humidity.health": 1,
        "readings.panel_temp.health": 1,
        "readings.ina226.voltage.health": 1,
        "readings.ina226.current.health": 1,
        "readings.battery.health": 1,
        "readings.solar.health": 1
      },
      { sort: { endTime: -1 } }
    );
    
    if (!latestReading) {
      throw new Error(`No readings found for device ${deviceId}`);
    }
    
    dailyReadings.push(latestReading);
  }
  
  // Initialize health tracking
  const sensorHealthSums = {};
  const sensorHealthCounts = {};
  let totalHealthSum = 0;
  let totalHealthCount = 0;
  
  // Define sensor types to track
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
  
  // Process each reading
  for (const reading of dailyReadings) {
    for (const sensorType of sensorTypes) {
      const { key, path, valueField } = sensorType;
      
      // Skip if this sensor type doesn't exist in the reading
      if (!reading.readings[path] || !reading.readings[path].length) {
        continue;
      }
      
      // Get all sensors of this type
      const relevantSensors = reading.readings[path];
      
      // For nested values (humidity, temperature, current, voltage)
      if (valueField) {
        // Extract health values
        const healthValues = relevantSensors.map(sensor => 
          sensor[valueField] && sensor[valueField].health ? sensor[valueField].health : 0
        );
        
        if (healthValues.length > 0) {
          // Calculate average health for this sensor type in this reading
          const healthSum = healthValues.reduce((acc, val) => acc + val, 0);
          const healthAvg = healthSum / healthValues.length;
          
          // Add to sensor type sum
          sensorHealthSums[key] = (sensorHealthSums[key] || 0) + healthAvg;
          sensorHealthCounts[key] = (sensorHealthCounts[key] || 0) + 1;
          
          // Add to total health
          totalHealthSum += healthAvg;
          totalHealthCount++;
        }
      } 
      // For direct values (solar, rain, uv, light, battery, panel_temp)
      else {
        // Extract health values
        const healthValues = relevantSensors.map(sensor => 
          sensor.health || 0
        );
        
        if (healthValues.length > 0) {
          // Calculate average health for this sensor type in this reading
          const healthSum = healthValues.reduce((acc, val) => acc + val, 0);
          const healthAvg = healthSum / healthValues.length;
          
          // Add to sensor type sum
          sensorHealthSums[key] = (sensorHealthSums[key] || 0) + healthAvg;
          sensorHealthCounts[key] = (sensorHealthCounts[key] || 0) + 1;
          
          // Add to total health
          totalHealthSum += healthAvg;
          totalHealthCount++;
        }
      }
    }
  }
  
  // Calculate daily average health for each sensor type
  const sensor_health = {};
  Object.keys(sensorHealthSums).forEach(key => {
    if (sensorHealthCounts[key] > 0) {
      sensor_health[key] = Math.round(sensorHealthSums[key] / sensorHealthCounts[key]);
    }
  });
  
  // Calculate overall health average
  const health = totalHealthCount > 0 ? Math.round(totalHealthSum / totalHealthCount) : 0;
  
  return { health, sensor_health };
}; 
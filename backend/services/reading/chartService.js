import SensorReading from "../../model/reading.model.js";
import { getTimeIntervalInMs, aggregateDataByTimeInterval } from "../../utils/chartUtils.js";

export const getChartDataService = async (params) => {
  const { 
    deviceId, 
    panelIds, 
    startDateTime, 
    endDateTime, 
    timeInterval,
    chartType 
  } = params;
  
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  if (!startDateTime || !endDateTime) {
    throw new Error("startDateTime and endDateTime are required");
  }
  
  if (!chartType) {
    throw new Error("chartType is required (energy, battery, panel_temp, or irradiance)");
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
      throw new Error("Invalid chartType. Must be one of: energy, battery, panel_temp, irradiance");
  }
  
  // Build the aggregation pipeline
  const pipeline = [];
  
  // Match stage - filter by deviceId and time range
  pipeline.push({
    $match: {
      deviceId: deviceId,
      endTime: {
        $gte: new Date(startDateTime),
        $lte: new Date(endDateTime)
      }
    }
  });
  
  // Project stage - only include the fields we need
  const projectStage = {
    deviceId: 1,
    endTime: 1
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
        endTime: 1,
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
  pipeline.push({ $sort: { endTime: 1 } });
  
  // Execute the aggregation pipeline
  const readings = await SensorReading.aggregate(pipeline);
  
  // Process the data based on the time interval
  const timeIntervalMs = getTimeIntervalInMs(timeInterval || '15min');
  const aggregatedData = aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray);
  
  return {
    chartType: chartType,
    timeInterval: timeInterval || '15min',
    data: aggregatedData
  };
};

export const getDashboardChartDataService = async (params) => {
  const { 
    deviceId, 
    panelIds, 
    timeInterval = '10min',
    chartTypes 
  } = params;
  
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // Validate time interval
  if (!['5min', '10min', '15min', '30min', 'hourly', 'daily', 'weekly', 'monthly'].includes(timeInterval)) {
    throw new Error("Invalid timeInterval. Must be one of: 5min, 10min, 15min, 30min, hourly, daily, weekly, monthly");
  }
  
  // Convert chart types to array if provided
  const chartTypesArray = chartTypes ? 
    (Array.isArray(chartTypes) ? chartTypes : chartTypes.split(',')) : 
    ['energy', 'battery', 'panel_temp', 'irradiance'];
    
  // Validate chart types
  const validChartTypes = ['energy', 'battery', 'panel_temp', 'irradiance'];
  for (const chartType of chartTypesArray) {
    if (!validChartTypes.includes(chartType)) {
      throw new Error(`Invalid chartType: ${chartType}. Must be one of: energy, battery, panel_temp, irradiance`);
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
  
  // Find the latest reading to determine the reference date
  const latestReading = await SensorReading.findOne(
    { deviceId: deviceId },
    { endTime: 1 },
    { sort: { endTime: -1 } }
  );
  
  if (!latestReading) {
    throw new Error(`No readings found for device ${deviceId}`);
  }
  
  // Get the reference date based on the latest reading (in UTC)
  const latestDate = new Date(latestReading.endTime);
  
  // Determine the date range based on the time interval
  let startDate, endDate;
  
  switch (timeInterval) {
    case 'daily':
      // For daily interval, return current month data
      startDate = new Date(latestDate);
      startDate.setUTCDate(1); // First day of the month
      startDate.setUTCHours(0, 0, 0, 0);
      
      endDate = new Date(latestDate);
      endDate.setUTCHours(23, 59, 59, 999);
      break;
      
    case 'weekly':
    case 'monthly':
      // For weekly and monthly intervals, return whole year data
      startDate = new Date(latestDate);
      startDate.setUTCMonth(0, 1); // January 1st
      startDate.setUTCHours(0, 0, 0, 0);
      
      endDate = new Date(latestDate);
      endDate.setUTCHours(23, 59, 59, 999);
      break;
      
    default:
      // Default behavior for 5min, 10min, 15min, 30min, hourly
      // Return current day data
      startDate = new Date(latestDate);
      startDate.setUTCHours(0, 0, 0, 0);
      
      endDate = new Date(latestDate);
      endDate.setUTCHours(23, 59, 59, 999);
      break;
  }
  
  // Build the aggregation pipeline
  const pipeline = [];
  
  // Match stage - filter by deviceId and date range
  pipeline.push({
    $match: {
      deviceId: deviceId,
      endTime: {
        $gte: startDate,
        $lte: endDate
      }
    }
  });
  
  // Project stage - only include the fields we need
  const projectStage = {
    deviceId: 1,
    endTime: 1
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
        endTime: 1,
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
  pipeline.push({ $sort: { endTime: 1 } });
  
  // Execute the aggregation pipeline
  const readings = await SensorReading.aggregate(pipeline);
  
  // Process the data based on the time interval
  const timeIntervalMs = getTimeIntervalInMs(timeInterval);
  
  // Create a result object for each chart type
  const result = {};
  
  for (const chartType of chartTypesArray) {
    result[chartType] = aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray);
  }
  
  return {
    timeInterval: timeInterval,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    data: result
  };
};

export const getAnalyticsDataService = async (params) => {
  const { 
    deviceId, 
    panelIds, 
    startDateTime, 
    endDateTime
  } = params;
  
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  if (!startDateTime || !endDateTime) {
    throw new Error("startDateTime and endDateTime are required");
  }
  
  // Convert panelIds to array if provided
  const panelIdsArray = panelIds ? 
    (Array.isArray(panelIds) ? panelIds : panelIds.split(',')) : 
    null;
  
  // Determine appropriate time interval based on date range
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  let timeInterval;
  if (daysDiff <= 1) {
    timeInterval = 'hourly';
  } else if (daysDiff <= 7) {
    timeInterval = 'daily';
  } else if (daysDiff <= 31) {
    timeInterval = 'daily';
  } else if (daysDiff <= 90) {
    timeInterval = 'weekly';
  } else {
    timeInterval = 'monthly';
  }
  
  // Define all sensor types we need for all charts
  const sensorTypes = ['ina226', 'battery', 'panel_temp', 'solar', 'dht22'];
  
  // Build the aggregation pipeline
  const pipeline = [];
  
  // Match stage - filter by deviceId and time range
  pipeline.push({
    $match: {
      deviceId: deviceId,
      endTime: {
        $gte: startDate,
        $lte: endDate
      }
    }
  });
  
  // Project stage - only include the fields we need
  const projectStage = {
    deviceId: 1,
    endTime: 1
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
        endTime: 1,
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
  pipeline.push({ $sort: { endTime: 1 } });
  
  // Execute the aggregation pipeline
  const readings = await SensorReading.aggregate(pipeline);
  
  // Process data for each chart type
  const timeIntervalMs = getTimeIntervalInMs(timeInterval);
  
  // Create result object for all analytics charts
  const result = {
    panelPerformance: aggregateDataByTimeInterval(readings, timeIntervalMs, 'energy', panelIdsArray),
    batteryCharge: aggregateDataByTimeInterval(readings, timeIntervalMs, 'battery', panelIdsArray),
    panelTemperature: aggregateDataByTimeInterval(readings, timeIntervalMs, 'panel_temp', panelIdsArray),
    irradiance: aggregateDataByTimeInterval(readings, timeIntervalMs, 'irradiance', panelIdsArray)
  };
  
  // Process data for hourly energy production (peak solar hours - 4am to 7pm)
  const peakSolarHoursData = await getPeakSolarHoursData(deviceId, startDate, endDate, panelIdsArray);
  result.peakSolarHours = peakSolarHoursData;
  
  // Process data for efficiency vs environment (energy vs humidity and temperature)
  result.efficiencyEnvironment = await getEfficiencyEnvironmentData(readings, timeIntervalMs);
  
  // Process data for irradiance vs power output correlation
  result.irradiancePower = await getIrradiancePowerCorrelation(readings, timeIntervalMs);
  
  // Calculate summary values
  const summaryValues = calculateSummaryValues(readings, result);
  
  return {
    timeInterval: timeInterval,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summaryValues: summaryValues,
    data: result
  };
};

// Helper function to get peak solar hours data (average kWh per hour from 4am-7pm)
async function getPeakSolarHoursData(deviceId, startDate, endDate, panelIdsArray) {
  // Create an aggregation pipeline specifically for hourly energy data
  const pipeline = [
    {
      $match: {
        deviceId: deviceId,
        endTime: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $project: {
        deviceId: 1,
        endTime: 1,
        hour: { $hour: "$endTime" },
        "readings.ina226": 1
      }
    },
    {
      $match: {
        hour: { $gte: 4, $lte: 19 } // 4am to 7pm
      }
    }
  ];
  
  // If panel IDs are specified, filter by panel ID
  if (panelIdsArray && panelIdsArray.length > 0) {
    pipeline.push({
      $project: {
        deviceId: 1,
        endTime: 1,
        hour: 1,
        "readings.ina226": {
          $filter: {
            input: "$readings.ina226",
            as: "sensor",
            cond: { $in: ["$$sensor.panelId", panelIdsArray] }
          }
        }
      }
    });
  }
  
  // Sort by timestamp
  pipeline.push({ $sort: { endTime: 1 } });
  
  // Execute the pipeline
  const readings = await SensorReading.aggregate(pipeline);
  
  // Process hourly data
  const hourlyData = [];
  const hourlyAggregation = {};
  
  // Initialize hourly buckets (4am to 7pm)
  for (let hour = 4; hour <= 19; hour++) {
    hourlyAggregation[hour] = {
      hour,
      samples: 0,
      totalEnergy: 0,
      panels: {}
    };
  }
  
  // Process readings to calculate energy per hour
  let previousReadings = {};
  
  for (const reading of readings) {
    const hour = reading.hour;
    const readingTime = new Date(reading.endTime);
    
    if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        const panelId = sensor.panelId;
        const currentPower = sensor.voltage.average * sensor.current.average / 1000; // W
        
        // Get previous reading for this panel to calculate energy
        const prevReading = previousReadings[panelId];
        
        if (prevReading) {
          // Calculate energy accumulation (kWh) between readings
          const hoursDiff = (readingTime - new Date(prevReading.timestamp)) / (1000 * 60 * 60);
          const avgPower = (currentPower + prevReading.power) / 2; // W
          const energyKWh = avgPower * hoursDiff / 1000; // kWh
          
          // Add to hourly aggregation
          if (!hourlyAggregation[hour].panels[panelId]) {
            hourlyAggregation[hour].panels[panelId] = 0;
          }
          
          hourlyAggregation[hour].panels[panelId] += energyKWh > 0 ? energyKWh : 0;
          hourlyAggregation[hour].totalEnergy += energyKWh > 0 ? energyKWh : 0;
          hourlyAggregation[hour].samples++;
        }
        
        // Update previous reading
        previousReadings[panelId] = {
          timestamp: reading.endTime,
          power: currentPower
        };
      }
    }
  }
  
  // Format the result
  for (let hour = 4; hour <= 19; hour++) {
    const hourData = hourlyAggregation[hour];
    const panelData = Object.entries(hourData.panels).map(([panelId, energy]) => ({
      panelId,
      energy,
      unit: 'kWh'
    }));
    
    hourlyData.push({
      hour,
      timestamp: new Date(startDate).setHours(hour, 0, 0, 0),
      panels: panelData,
      average: {
        value: hourData.samples > 0 ? hourData.totalEnergy / Object.keys(hourData.panels).length : 0,
        unit: 'kWh'
      }
    });
  }
  
  return hourlyData;
}

// Helper function to get efficiency vs environment data
async function getEfficiencyEnvironmentData(readings, timeIntervalMs) {
  const result = [];
  const startTime = readings.length > 0 ? new Date(readings[0].endTime).getTime() : null;
  
  if (!startTime) return [];
  
  let currentBucket = {
    timestamp: new Date(startTime),
    values: {
      energy: [],
      humidity: [],
      temperature: []
    }
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  // Track previous readings for energy calculation
  let previousReadings = {};
  
  for (const reading of readings) {
    const readingTime = new Date(reading.endTime).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket
      if (currentBucket.values.energy.length > 0 || 
          currentBucket.values.humidity.length > 0 || 
          currentBucket.values.temperature.length > 0) {
        
        finalizeEfficiencyEnvironmentBucket(currentBucket);
        result.push(currentBucket);
      }
      
      // Create a new bucket aligned to the time interval
      const bucketStartTime = new Date(
        Math.floor(readingTime / timeIntervalMs) * timeIntervalMs
      );
      
      currentBucket = {
        timestamp: bucketStartTime,
        values: {
          energy: [],
          humidity: [],
          temperature: []
        }
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process energy data (from ina226)
    if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        const currentPower = sensor.voltage.average * sensor.current.average / 1000; // W
        const prevReading = previousReadings[sensor.panelId];
        
        if (prevReading) {
          // Calculate energy accumulation (kWh) between readings
          const hoursDiff = (new Date(reading.endTime) - new Date(prevReading.timestamp)) / (1000 * 60 * 60);
          const avgPower = (currentPower + prevReading.power) / 2; // W
          const energyKWh = avgPower * hoursDiff / 1000; // kWh
          
          currentBucket.values.energy.push({
            panelId: sensor.panelId,
            energy: energyKWh > 0 ? energyKWh : 0
          });
        }
        
        // Update previous reading
        previousReadings[sensor.panelId] = {
          timestamp: reading.endTime,
          power: currentPower
        };
      }
    }
    
    // Process environment data (from dht22)
    if (reading.readings.dht22 && reading.readings.dht22.length > 0) {
      for (const sensor of reading.readings.dht22) {
        if (sensor.humidity) {
          currentBucket.values.humidity.push({
            panelId: sensor.panelId,
            value: sensor.humidity.average,
            unit: sensor.humidity.unit
          });
        }
        
        if (sensor.temperature) {
          currentBucket.values.temperature.push({
            panelId: sensor.panelId,
            value: sensor.temperature.average,
            unit: sensor.temperature.unit
          });
        }
      }
    }
  }
  
  // Finalize the last bucket
  if (currentBucket.values.energy.length > 0 || 
      currentBucket.values.humidity.length > 0 || 
      currentBucket.values.temperature.length > 0) {
    
    finalizeEfficiencyEnvironmentBucket(currentBucket);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to finalize efficiency environment bucket
function finalizeEfficiencyEnvironmentBucket(bucket) {
  // Calculate energy average
  if (bucket.values.energy.length > 0) {
    const totalEnergy = bucket.values.energy.reduce((sum, item) => sum + item.energy, 0);
    const avgEnergy = totalEnergy / bucket.values.energy.length;
    bucket.energy = {
      value: avgEnergy,
      unit: 'kWh'
    };
  } else {
    bucket.energy = { value: 0, unit: 'kWh' };
  }
  
  // Calculate humidity average
  if (bucket.values.humidity.length > 0) {
    const totalHumidity = bucket.values.humidity.reduce((sum, item) => sum + item.value, 0);
    const avgHumidity = totalHumidity / bucket.values.humidity.length;
    bucket.humidity = {
      value: avgHumidity,
      unit: bucket.values.humidity[0].unit
    };
  } else {
    bucket.humidity = { value: 0, unit: '%' };
  }
  
  // Calculate temperature average
  if (bucket.values.temperature.length > 0) {
    const totalTemp = bucket.values.temperature.reduce((sum, item) => sum + item.value, 0);
    const avgTemp = totalTemp / bucket.values.temperature.length;
    bucket.temperature = {
      value: avgTemp,
      unit: bucket.values.temperature[0].unit
    };
  } else {
    bucket.temperature = { value: 0, unit: '°C' };
  }
  
  // Remove the values array
  delete bucket.values;
}

// Helper function to correlate irradiance with power output
async function getIrradiancePowerCorrelation(readings, timeIntervalMs) {
  const result = [];
  const startTime = readings.length > 0 ? new Date(readings[0].endTime).getTime() : null;
  
  if (!startTime) return [];
  
  let currentBucket = {
    timestamp: new Date(startTime),
    values: {
      energy: [],
      irradiance: []
    }
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  // Track previous readings for energy calculation
  let previousReadings = {};
  
  for (const reading of readings) {
    const readingTime = new Date(reading.endTime).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket
      if (currentBucket.values.energy.length > 0 || currentBucket.values.irradiance.length > 0) {
        finalizeIrradiancePowerBucket(currentBucket);
        result.push(currentBucket);
      }
      
      // Create a new bucket aligned to the time interval
      const bucketStartTime = new Date(
        Math.floor(readingTime / timeIntervalMs) * timeIntervalMs
      );
      
      currentBucket = {
        timestamp: bucketStartTime,
        values: {
          energy: [],
          irradiance: []
        }
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process energy data (from ina226)
    if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        const currentPower = sensor.voltage.average * sensor.current.average / 1000; // W
        const prevReading = previousReadings[sensor.panelId];
        
        if (prevReading) {
          // Calculate energy accumulation (kWh) between readings
          const hoursDiff = (new Date(reading.endTime) - new Date(prevReading.timestamp)) / (1000 * 60 * 60);
          const avgPower = (currentPower + prevReading.power) / 2; // W
          const energyKWh = avgPower * hoursDiff / 1000; // kWh
          
          currentBucket.values.energy.push({
            panelId: sensor.panelId,
            energy: energyKWh > 0 ? energyKWh : 0,
            power: currentPower
          });
        } else {
          // For first reading, we still want to capture power
          currentBucket.values.energy.push({
            panelId: sensor.panelId,
            energy: 0,
            power: currentPower
          });
        }
        
        // Update previous reading
        previousReadings[sensor.panelId] = {
          timestamp: reading.endTime,
          power: currentPower
        };
      }
    }
    
    // Process irradiance data (from solar)
    if (reading.readings.solar && reading.readings.solar.length > 0) {
      for (const sensor of reading.readings.solar) {
        currentBucket.values.irradiance.push({
          panelId: sensor.panelId,
          value: sensor.average,
          unit: sensor.unit
        });
      }
    }
  }
  
  // Finalize the last bucket
  if (currentBucket.values.energy.length > 0 || currentBucket.values.irradiance.length > 0) {
    finalizeIrradiancePowerBucket(currentBucket);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to finalize irradiance vs power bucket
function finalizeIrradiancePowerBucket(bucket) {
  // Calculate energy average
  if (bucket.values.energy.length > 0) {
    const totalEnergy = bucket.values.energy.reduce((sum, item) => sum + item.energy, 0);
    const totalPower = bucket.values.energy.reduce((sum, item) => sum + item.power, 0);
    const avgEnergy = totalEnergy / bucket.values.energy.length;
    const avgPower = totalPower / bucket.values.energy.length;
    
    bucket.energy = {
      value: avgEnergy,
      unit: 'kWh'
    };
    bucket.power = {
      value: avgPower,
      unit: 'W'
    };
    
    // Store panel-specific power data
    bucket.panels = {};
    for (const item of bucket.values.energy) {
      if (!bucket.panels[item.panelId]) {
        bucket.panels[item.panelId] = {
          energy: 0,
          power: 0
        };
      }
      bucket.panels[item.panelId].energy += item.energy;
      bucket.panels[item.panelId].power = item.power; // Latest power value
    }
    
    // Convert panels object to array
    bucket.panels = Object.entries(bucket.panels).map(([panelId, data]) => ({
      panelId,
      energy: data.energy,
      power: data.power,
      energyUnit: 'kWh',
      powerUnit: 'W'
    }));
  } else {
    bucket.energy = { value: 0, unit: 'kWh' };
    bucket.power = { value: 0, unit: 'W' };
    bucket.panels = [];
  }
  
  // Calculate irradiance average
  if (bucket.values.irradiance.length > 0) {
    const totalIrradiance = bucket.values.irradiance.reduce((sum, item) => sum + item.value, 0);
    const avgIrradiance = totalIrradiance / bucket.values.irradiance.length;
    
    bucket.irradiance = {
      value: avgIrradiance,
      unit: bucket.values.irradiance[0].unit
    };
    
    // Store panel-specific irradiance data
    const irradiancePanels = {};
    for (const item of bucket.values.irradiance) {
      irradiancePanels[item.panelId] = {
        value: item.value,
        unit: item.unit
      };
    }
    
    // Add irradiance data to panels
    bucket.panels = bucket.panels.map(panel => {
      const irradianceData = irradiancePanels[panel.panelId];
      return {
        ...panel,
        irradiance: irradianceData ? irradianceData.value : 0,
        irradianceUnit: irradianceData ? irradianceData.unit : 'W/m2'
      };
    });
  } else {
    bucket.irradiance = { value: 0, unit: 'W/m2' };
  }
  
  // Remove the values array
  delete bucket.values;
}

// Helper function to calculate summary values for analytics page
function calculateSummaryValues(readings, chartData) {
  // 1. Mock Efficiency (to be replaced with real calculation later)
  const efficiency = {
    value: 85, // Mock value - implement real calculation later
    trend: 2,
    unit: '%'
  };
  
  // 2. Calculate Daily Yield (average power accumulation)
  let dailyYield = 0;
  if (chartData.panelPerformance && chartData.panelPerformance.length > 0) {
    const totalEnergy = chartData.panelPerformance.reduce(
      (sum, item) => sum + (item.average ? item.average.value : 0), 
      0
    );
    dailyYield = totalEnergy / chartData.panelPerformance.length;
  }
  
  // 3. Determine Peak Solar Hours
  let peakHourStart = "N/A";
  let peakHourEnd = "N/A";
  let bestTime = "N/A";
  
  if (chartData.peakSolarHours && chartData.peakSolarHours.length > 0) {
    // Find the hours with the highest energy production
    const sortedHours = [...chartData.peakSolarHours].sort((a, b) => 
      (b.average?.value || 0) - (a.average?.value || 0)
    );
    
    if (sortedHours.length > 0 && sortedHours[0].average?.value > 0) {
      // Get the best hour
      bestTime = `${sortedHours[0].hour}:00`;
      
      // Find contiguous range of good production hours (above 50% of peak)
      const threshold = sortedHours[0].average.value * 0.5;
      const productiveHours = chartData.peakSolarHours
        .filter(h => (h.average?.value || 0) >= threshold)
        .map(h => h.hour)
        .sort((a, b) => a - b);
      
      if (productiveHours.length > 0) {
        peakHourStart = `${productiveHours[0]}:00`;
        peakHourEnd = `${productiveHours[productiveHours.length - 1]}:00`;
      }
    }
  }
  
  return {
    efficiency,
    dailyYield: {
      value: dailyYield,
      unit: 'kWh'
    },
    peakSolarHours: {
      start: peakHourStart,
      end: peakHourEnd,
      bestTime: bestTime
    }
  };
} 
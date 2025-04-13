import SensorReading from "../../model/reading.model.js";
import { getTimeIntervalInMs, aggregateDataByTimeInterval } from "../../utils/chartUtils.js";
import { getStartOfDay, getEndOfDay, toUTC } from "../../utils/timeUtils.js";

export const getChartDataService = async (params) => {
  const { 
    deviceId, 
    panelIds, 
    startDateTime, 
    endDateTime, 
    timeInterval,
    chartType,
    timezone 
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
  
  // Convert dates to UTC considering client timezone
  const startDate = timezone ? toUTC(new Date(startDateTime), timezone) : new Date(startDateTime);
  const endDate = timezone ? toUTC(new Date(endDateTime), timezone) : new Date(endDateTime);
  
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
  
  // Process the data based on the time interval
  const timeIntervalMs = getTimeIntervalInMs(timeInterval || '15min');
  const aggregatedData = aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray, timezone);
  
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
    chartTypes,
    timezone
  } = params;
  
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // Validate time interval - restrict to only up to hourly for dashboard
  const validIntervals = ['5min', '10min', '15min', '30min', 'hourly'];
  if (!validIntervals.includes(timeInterval)) {
    throw new Error("Invalid timeInterval for dashboard. Must be one of: 5min, 10min, 15min, 30min, hourly");
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
  
  // Get the reference date based on the latest reading (but don't apply timezone conversion yet)
  const latestDate = new Date(latestReading.endTime);
  
  console.log(`Latest reading date: ${latestDate.toISOString()} for device ${deviceId}`);
  
  // Determine the date range based on the time interval
  let startDate, endDate;
  
  switch (timeInterval) {
    case 'daily':
      // For daily interval, return current month data
      startDate = new Date(latestDate);
      startDate.setDate(1); // First day of the month
      startDate = timezone ? getStartOfDay(startDate, timezone) : startDate.setHours(0, 0, 0, 0) && startDate;
      
      endDate = new Date(latestDate);
      endDate = timezone ? getEndOfDay(endDate, timezone) : endDate.setHours(23, 59, 59, 999) && endDate;
      break;
      
    case 'weekly':
    case 'monthly':
      // For weekly and monthly intervals, return whole year data
      startDate = new Date(latestDate);
      startDate.setMonth(0, 1); // January 1st
      startDate = timezone ? getStartOfDay(startDate, timezone) : startDate.setHours(0, 0, 0, 0) && startDate;
      
      endDate = new Date(latestDate);
      endDate = timezone ? getEndOfDay(endDate, timezone) : endDate.setHours(23, 59, 59, 999) && endDate;
      break;
      
    default:
      // Default behavior for 5min, 10min, 15min, 30min, hourly
      // Use the day of the latest reading, not necessarily today
      startDate = new Date(latestDate);
      startDate = timezone ? getStartOfDay(startDate, timezone) : (startDate.setHours(0, 0, 0, 0), startDate);
      
      endDate = new Date(latestDate);
      endDate = timezone ? getEndOfDay(endDate, timezone) : (endDate.setHours(23, 59, 59, 999), endDate);
      break;
  }
  
  console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()} with timezone: ${timezone || 'none'}`);
  
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
    result[chartType] = aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray, timezone);
  }
  
  return {
    timeInterval: timeInterval,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    timezone: timezone || 'UTC',
    data: result
  };
};

export const getAnalyticsDataService = async (params) => {
  const { 
    deviceId, 
    panelIds, 
    startDateTime, 
    endDateTime,
    timezone
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
  
  // Convert dates to UTC considering client timezone
  const startDate = timezone ? toUTC(new Date(startDateTime), timezone) : new Date(startDateTime);
  const endDate = timezone ? toUTC(new Date(endDateTime), timezone) : new Date(endDateTime);
  
  // Determine appropriate time interval based on date range
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
    panelPerformance: aggregateDataByTimeInterval(readings, timeIntervalMs, 'energy', panelIdsArray, timezone),
    batteryCharge: aggregateDataByTimeInterval(readings, timeIntervalMs, 'battery', panelIdsArray, timezone),
    panelTemperature: aggregateDataByTimeInterval(readings, timeIntervalMs, 'panel_temp', panelIdsArray, timezone),
    irradiance: aggregateDataByTimeInterval(readings, timeIntervalMs, 'irradiance', panelIdsArray, timezone)
  };
  
  // Process data for hourly energy production (peak solar hours - 4am to 7pm)
  const peakSolarHoursData = await getPeakSolarHoursData(deviceId, startDate, endDate, panelIdsArray, timezone);
  result.peakSolarHours = peakSolarHoursData;
  
  // Process data for efficiency vs environment (energy vs humidity and temperature)
  result.efficiencyEnvironment = await getEfficiencyEnvironmentData(readings, timeIntervalMs, timezone);
  
  // Process data for irradiance vs power output correlation
  result.irradiancePower = await getIrradiancePowerCorrelation(readings, timeIntervalMs, timezone);
  
  // Calculate summary values
  const summaryValues = calculateSummaryValues(readings, result, timezone);
  
  return {
    timeInterval: timeInterval,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summaryValues: summaryValues,
    data: result
  };
};

// Helper function to get peak solar hours data (average kWh per hour from 4am-7pm)
async function getPeakSolarHoursData(deviceId, startDate, endDate, panelIdsArray, timezone) {
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
        hour: { $hour: { date: "$endTime", timezone: timezone || "UTC" } },
        day: { $dayOfMonth: { date: "$endTime", timezone: timezone || "UTC" } },
        month: { $month: { date: "$endTime", timezone: timezone || "UTC" } },
        year: { $year: { date: "$endTime", timezone: timezone || "UTC" } },
        "readings.ina226": 1
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
        day: 1,
        month: 1,
        year: 1,
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
  
  // Sort by timestamp to ensure proper energy calculation
  pipeline.push({ $sort: { endTime: 1 } });
  
  // Execute the pipeline
  const readings = await SensorReading.aggregate(pipeline);
  
  // Process hourly data
  const hourlyData = [];
  
  // Create a nested map: date -> hour -> panel data
  const dailyHourlyData = {};
  
  // Process readings to calculate energy per hour for each day
  let previousReadings = {};
  let previousDay = null;
  
  for (const reading of readings) {
    const hour = reading.hour;
    const readingTime = new Date(reading.endTime);
    const dateKey = `${reading.year}-${reading.month}-${reading.day}`;
    
    // Reset previous readings when moving to a new day to avoid day boundary issues
    if (previousDay !== null && previousDay !== dateKey) {
      previousReadings = {};
    }
    previousDay = dateKey;
    
    // Initialize data structure for this day and hour if needed
    if (!dailyHourlyData[dateKey]) {
      dailyHourlyData[dateKey] = {};
    }
    
    if (!dailyHourlyData[dateKey][hour]) {
      // Create a date in the client's timezone
      let clientDate;
      if (timezone) {
        clientDate = new Date(reading.year, reading.month - 1, reading.day, hour, 0, 0, 0);
      } else {
        // Fallback to UTC if no timezone provided
        clientDate = new Date(Date.UTC(reading.year, reading.month - 1, reading.day, hour, 0, 0, 0));
      }
      
      dailyHourlyData[dateKey][hour] = {
        hour,
        date: clientDate,
        samples: 0,
        totalEnergy: 0,
        panels: {}
      };
    }
    
    if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        const panelId = sensor.panelId;
        const currentPower = sensor.voltage.average * sensor.current.average / 1000; // W
        
        // Get previous reading for this panel to calculate energy
        const prevReading = previousReadings[panelId];
        
        if (prevReading) {
          // Only calculate energy if readings are from the same day
          // to avoid attributing overnight gaps to morning hours
          const prevTime = new Date(prevReading.timestamp);
          const isSameDay = prevTime.getDate() === readingTime.getDate() && 
                            prevTime.getMonth() === readingTime.getMonth() && 
                            prevTime.getFullYear() === readingTime.getFullYear();
          
          if (isSameDay) {
            // Calculate energy accumulation (kWh) between readings
            const hoursDiff = (readingTime - prevTime) / (1000 * 60 * 60);
            const avgPower = (currentPower + prevReading.power) / 2; // W
            const energyKWh = avgPower * hoursDiff / 1000; // kWh
            
            // Add to hourly aggregation
            if (!dailyHourlyData[dateKey][hour].panels[panelId]) {
              dailyHourlyData[dateKey][hour].panels[panelId] = 0;
            }
            
            if (energyKWh > 0) { // Only add positive energy production
              dailyHourlyData[dateKey][hour].panels[panelId] += energyKWh;
              dailyHourlyData[dateKey][hour].totalEnergy += energyKWh;
              dailyHourlyData[dateKey][hour].samples++;
            }
          }
        }
        
        // Update previous reading
        previousReadings[panelId] = {
          timestamp: reading.endTime,
          power: currentPower
        };
      }
    }
  }
  
  // Convert daily hourly data to array format grouped by hour
  // Calculate averages across all days for each hour
  const hourlyAggregation = {};
  
  // Initialize hourly buckets for all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyAggregation[hour] = {
      hour,
      days: 0,
      totalEnergy: 0,
      panels: {}
    };
  }
  
  // Aggregate data across all days
  Object.values(dailyHourlyData).forEach(dayData => {
    Object.entries(dayData).forEach(([hour, hourData]) => {
      hour = parseInt(hour);
      
      // Count this day for this hour
      hourlyAggregation[hour].days++;
      
      // Add energy data for each panel
      Object.entries(hourData.panels).forEach(([panelId, energy]) => {
        if (!hourlyAggregation[hour].panels[panelId]) {
          hourlyAggregation[hour].panels[panelId] = 0;
        }
        hourlyAggregation[hour].panels[panelId] += energy;
      });
      
      // Add to total energy
      hourlyAggregation[hour].totalEnergy += hourData.totalEnergy;
    });
  });
  
  // Format the result and calculate averages across days
  for (let hour = 0; hour < 24; hour++) {
    const hourData = hourlyAggregation[hour];
    
    // Skip hours with no data
    if (hourData.days === 0) {
      // Create a timestamp in the client's timezone
      let timestamp;
      if (timezone) {
        // Create a date object and adjust for timezone
        const clientDate = new Date(startDate);
        clientDate.setHours(hour, 0, 0, 0);
        timestamp = clientDate.getTime();
      } else {
        // Fallback to UTC
        timestamp = new Date(startDate).setUTCHours(hour, 0, 0, 0);
      }
      
      hourlyData.push({
        hour,
        timestamp,
        panels: [],
        average: {
          value: 0,
          unit: 'kWh'
        }
      });
      continue;
    }
    
    // Calculate average across days for each panel
    const panelData = Object.entries(hourData.panels).map(([panelId, energy]) => ({
      panelId,
      energy: energy / hourData.days, // Average per day
      unit: 'kWh'
    }));
    
    // Create a timestamp in the client's timezone
    let timestamp;
    if (timezone) {
      // Create a date object and adjust for timezone
      const clientDate = new Date(startDate);
      clientDate.setHours(hour, 0, 0, 0);
      timestamp = clientDate.getTime();
    } else {
      // Fallback to UTC
      timestamp = new Date(startDate).setUTCHours(hour, 0, 0, 0);
    }
    
    hourlyData.push({
      hour,
      timestamp,
      panels: panelData,
      average: {
        value: hourData.days > 0 ? 
          hourData.totalEnergy / (hourData.days * Object.keys(hourData.panels).length) : 0,
        unit: 'kWh'
      }
    });
  }
  
  return hourlyData;
}

// Helper function to get efficiency vs environment data
async function getEfficiencyEnvironmentData(readings, timeIntervalMs, timezone) {
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
async function getIrradiancePowerCorrelation(readings, timeIntervalMs, timezone) {
  const result = [];
  const startTime = readings.length > 0 ? new Date(readings[0].endTime).getTime() : null;
  
  if (!startTime) return [];
  
  let currentBucket = {
    timestamp: new Date(startTime),
    values: {
      power: [],
      irradiance: []
    }
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  for (const reading of readings) {
    const readingTime = new Date(reading.endTime).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket
      if (currentBucket.values.power.length > 0 || currentBucket.values.irradiance.length > 0) {
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
          power: [],
          irradiance: []
        }
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process power data (from ina226)
    if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        const currentPower = sensor.voltage.average * sensor.current.average / 1000; // W
        
        currentBucket.values.power.push({
          panelId: sensor.panelId,
          power: currentPower
        });
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
  if (currentBucket.values.power.length > 0 || currentBucket.values.irradiance.length > 0) {
    finalizeIrradiancePowerBucket(currentBucket);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to finalize irradiance vs power bucket
function finalizeIrradiancePowerBucket(bucket) {
  // Calculate power average
  if (bucket.values.power.length > 0) {
    const totalPower = bucket.values.power.reduce((sum, item) => sum + item.power, 0);
    const avgPower = totalPower / bucket.values.power.length;
    
    bucket.power = {
      value: avgPower,
      unit: 'W'
    };
    
    // Store panel-specific power data
    bucket.panels = {};
    for (const item of bucket.values.power) {
      bucket.panels[item.panelId] = {
        power: item.power
      };
    }
  } else {
    bucket.power = { value: 0, unit: 'W' };
    bucket.panels = {};
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
    for (const item of bucket.values.irradiance) {
      if (!bucket.panels[item.panelId]) {
        bucket.panels[item.panelId] = {};
      }
      bucket.panels[item.panelId].irradiance = item.value;
      bucket.panels[item.panelId].irradianceUnit = item.unit;
    }
  } else {
    bucket.irradiance = { value: 0, unit: 'W/m2' };
  }
  
  // Convert panels object to array
  bucket.panels = Object.entries(bucket.panels).map(([panelId, data]) => ({
    panelId,
    power: data.power || 0,
    powerUnit: 'W',
    irradiance: data.irradiance || 0,
    irradianceUnit: data.irradianceUnit || 'W/m2'
  }));
  
  // Remove the values array
  delete bucket.values;
}

// Helper function to calculate summary values for analytics page
function calculateSummaryValues(readings, chartData, timezone) {
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
      // Get the best hour - format with proper timezone consideration
      const bestHour = sortedHours[0].hour;
      
      // Format the time strings with proper localization if timezone is provided
      if (timezone) {
        const formatHourWithTimezone = (hour) => {
          const date = new Date();
          date.setHours(hour, 0, 0, 0);
          return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: timezone 
          }).replace(/:00$/, ':00');
        };
        
        bestTime = formatHourWithTimezone(bestHour);
      } else {
        // Fallback to simple format if no timezone
        bestTime = `${bestHour}:00`;
      }
      
      // Find contiguous range of good production hours (above 50% of peak)
      const threshold = sortedHours[0].average.value * 0.5;
      const productiveHours = chartData.peakSolarHours
        .filter(h => (h.average?.value || 0) >= threshold)
        .map(h => h.hour)
        .sort((a, b) => a - b);
      
      if (productiveHours.length > 0) {
        // Format the time with proper localization if timezone is provided
        if (timezone) {
          const formatHourWithTimezone = (hour) => {
            const date = new Date();
            date.setHours(hour, 0, 0, 0);
            return date.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false,
              timeZone: timezone 
            }).replace(/:00$/, ':00');
          };
          
          peakHourStart = formatHourWithTimezone(productiveHours[0]);
          peakHourEnd = formatHourWithTimezone(productiveHours[productiveHours.length - 1]);
        } else {
          // Fallback to simple format if no timezone
          peakHourStart = `${productiveHours[0]}:00`;
          peakHourEnd = `${productiveHours[productiveHours.length - 1]}:00`;
        }
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
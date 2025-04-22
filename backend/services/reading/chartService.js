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
    'energy': ['actual_total_energy', 'predicted_total_energy'],
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
  
  // Get the reference date based on the latest reading in UTC
  const latestDateUTC = new Date(latestReading.endTime);
  
  console.log(`Latest reading date (UTC): ${latestDateUTC.toISOString()} for device ${deviceId}`);
  
  // Determine the date range based on the time interval
  let startDate, endDate;
  let clientDate;
  
  // First convert latestDateUTC to client timezone to determine the reference date
  if (timezone) {
    try {
      // Convert the UTC date to the client's local time representation
      // This gives us the date as it appears in the client's timezone
      clientDate = new Date(latestDateUTC.toLocaleString('en-US', { timeZone: timezone }));
      console.log(`Date in client timezone (${timezone}): ${clientDate.toLocaleString()}`);
    } catch (error) {
      console.error(`Error converting to client timezone: ${error.message}`);
      clientDate = new Date(latestDateUTC); // Fallback to UTC
    }
  } else {
    clientDate = new Date(latestDateUTC); // No timezone specified, use UTC
  }
  
  // Now determine the start and end of the day in the client's timezone
  // We want the full day that contains the latest reading in the client's timezone
  if (timezone) {
    try {
      // Calculate the timezone offset in minutes
      // For Asia/Manila (UTC+8), this would be -480 minutes
      const targetDate = new Date();
      const utcDate = new Date(targetDate.toUTCString());
      const tzDate = new Date(targetDate.toLocaleString('en-US', { timeZone: timezone }));
      const tzOffset = (tzDate - utcDate) / 60000; // offset in minutes
      
      console.log(`Calculated timezone offset for ${timezone}: ${tzOffset} minutes`);
      
      // Extract year, month, day from the client date
      const year = clientDate.getFullYear();
      const month = clientDate.getMonth();
      const day = clientDate.getDate();
      
      // Create dates for midnight and 23:59:59 in client timezone
      const clientMidnight = new Date(year, month, day, 0, 0, 0);
      const clientEndOfDay = new Date(year, month, day, 23, 59, 59, 999);
      
      // Convert to UTC by subtracting the timezone offset
      startDate = new Date(clientMidnight.getTime() - tzOffset * 60000);
      endDate = new Date(clientEndOfDay.getTime() - tzOffset * 60000);
      
      console.log(`Calculated date range in UTC: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } catch (error) {
      console.error(`Error in timezone calculation: ${error.message}`);
      // Fallback to UTC day if there's an error
      startDate = new Date(Date.UTC(
        latestDateUTC.getUTCFullYear(),
        latestDateUTC.getUTCMonth(),
        latestDateUTC.getUTCDate(),
        0, 0, 0, 0
      ));
      
      endDate = new Date(Date.UTC(
        latestDateUTC.getUTCFullYear(),
        latestDateUTC.getUTCMonth(),
        latestDateUTC.getUTCDate(),
        23, 59, 59, 999
      ));
    }
  } else {
    // Use UTC midnight
    startDate = new Date(Date.UTC(
      latestDateUTC.getUTCFullYear(),
      latestDateUTC.getUTCMonth(),
      latestDateUTC.getUTCDate(),
      0, 0, 0, 0
    ));
    
    endDate = new Date(Date.UTC(
      latestDateUTC.getUTCFullYear(),
      latestDateUTC.getUTCMonth(),
      latestDateUTC.getUTCDate(),
      23, 59, 59, 999
    ));
  }
  
  console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()} with timezone: ${timezone || 'Asia/Manila'}`);
  
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
  
  // Format date strings consistently for the response
  let formattedStartDate, formattedEndDate;
  
  if (timezone) {
    // Format dates according to the client's timezone
    formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { timeZone: timezone });
    formattedEndDate = new Date(endDate).toLocaleDateString('en-US', { timeZone: timezone });
    
    // Also include ISO format for the dates (this converts to local JS time)
    const clientStartDate = new Date(new Date(startDate).toLocaleString('en-US', { timeZone: timezone }));
    const clientEndDate = new Date(new Date(endDate).toLocaleString('en-US', { timeZone: timezone }));
    
    console.log(`Client timezone dates: ${clientStartDate.toISOString()} to ${clientEndDate.toISOString()}`);
  } else {
    // Use UTC format if no timezone specified
    formattedStartDate = startDate.toISOString().split('T')[0];
    formattedEndDate = endDate.toISOString().split('T')[0];
  }
  
  // Add debugging information to help diagnose timezone issues
  console.log(`Returning dates formatted as: ${formattedStartDate} to ${formattedEndDate}`);
  console.log(`Original UTC dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  return {
    timeInterval: timeInterval,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    originalStartDate: startDate.toISOString(),  // Include the original ISO dates for debugging
    originalEndDate: endDate.toISOString(),
    timezone: timezone || 'Asia/Manila',
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
  } 
  // else if (daysDiff <= 90) {
  //   timeInterval = 'weekly';
  // } else {
  //   timeInterval = 'monthly';
  // }
  
  // Define all sensor types we need for all charts
  const sensorTypes = ['ina226', 'battery', 'panel_temp', 'solar', 'dht22', 'light', 'actual_total_energy', 'predicted_total_energy', 'actual_avg_power', 'predicted_avg_power'];
  
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
    
    // Add conditions for the new energy fields
    orConditions.push({ "readings.actual_total_energy.0": { $exists: true } });
    orConditions.push({ "readings.predicted_total_energy.0": { $exists: true } });
    orConditions.push({ "readings.actual_avg_power.0": { $exists: true } });
    orConditions.push({ "readings.predicted_avg_power.0": { $exists: true } });
    
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
  
  // Process data for lux vs irradiance correlation
  result.luxIrradiance = await getLuxIrradianceCorrelation(readings, timeIntervalMs, timezone);
  
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
        hour: { $hour: { date: "$endTime", timezone: timezone || "Asia/Manila" } },
        day: { $dayOfMonth: { date: "$endTime", timezone: timezone || "Asia/Manila" } },
        month: { $month: { date: "$endTime", timezone: timezone || "Asia/Manila" } },
        year: { $year: { date: "$endTime", timezone: timezone || "Asia/Manila" } },
        "readings.actual_total_energy": 1,
        "readings.predicted_total_energy": 1,
        "readings.actual_avg_power": 1
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
        "readings.actual_total_energy": {
          $filter: {
            input: "$readings.actual_total_energy",
            as: "sensor",
            cond: { $in: ["$$sensor.panelId", panelIdsArray] }
          }
        },
        "readings.predicted_total_energy": {
          $filter: {
            input: "$readings.predicted_total_energy",
            as: "sensor",
            cond: { $in: ["$$sensor.panelId", panelIdsArray] }
          }
        },
        "readings.actual_avg_power": {
          $filter: {
            input: "$readings.actual_avg_power",
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
  
  // Process readings for each hour
  for (const reading of readings) {
    const hour = reading.hour;
    const dateKey = `${reading.year}-${reading.month}-${reading.day}`;
    
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
    
    // Process actual_total_energy readings
    if (reading.readings.actual_total_energy && reading.readings.actual_total_energy.length > 0) {
      for (const sensor of reading.readings.actual_total_energy) {
        const panelId = sensor.panelId;
        const energy = sensor.value; // kWh
        
        // Add to hourly aggregation
        if (!dailyHourlyData[dateKey][hour].panels[panelId]) {
          dailyHourlyData[dateKey][hour].panels[panelId] = 0;
        }
        
        if (energy > 0) { // Only add positive energy production
          // For peak solar hours, we use the actual energy value directly
          dailyHourlyData[dateKey][hour].panels[panelId] += energy;
          dailyHourlyData[dateKey][hour].totalEnergy += energy;
          dailyHourlyData[dateKey][hour].samples++;
        }
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
      efficiency: [],  // Changed from energy to efficiency
      humidity: [],
      temperature: []
    }
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  // Track previous readings for energy calculation
  let previousReadings = {};
  
  const RATED_POWER = 100; // Define rated power as 100W
  
  for (const reading of readings) {
    const readingTime = new Date(reading.endTime).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket
      if (currentBucket.values.efficiency.length > 0 || 
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
          efficiency: [],  // Changed from energy to efficiency
          humidity: [],
          temperature: []
        }
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process efficiency data (from ina226)
    if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        // Calculate performance ratio: (voltage * current) / rated power
        const actualPower = sensor.voltage.average * sensor.current.average / 1000; // W
        const performanceRatio = (actualPower / RATED_POWER) * 100; // Convert to percentage
        
        currentBucket.values.efficiency.push({
          panelId: sensor.panelId,
          value: performanceRatio > 0 ? performanceRatio : 0
        });
        
        // Update previous reading for potential future calculations
        previousReadings[sensor.panelId] = {
          timestamp: reading.endTime,
          power: actualPower
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
  if (currentBucket.values.efficiency.length > 0 || 
      currentBucket.values.humidity.length > 0 || 
      currentBucket.values.temperature.length > 0) {
    
    finalizeEfficiencyEnvironmentBucket(currentBucket);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to finalize efficiency environment bucket
function finalizeEfficiencyEnvironmentBucket(bucket) {
  // Calculate efficiency average
  if (bucket.values.efficiency.length > 0) {
    const totalEfficiency = bucket.values.efficiency.reduce((sum, item) => sum + item.value, 0);
    const avgEfficiency = totalEfficiency / bucket.values.efficiency.length;
    bucket.efficiency = {
      value: avgEfficiency,
      unit: '%'
    };
  } else {
    bucket.efficiency = { value: 0, unit: '%' };
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
      let bucketStartTime;
      
      // Special handling for 'daily' interval to ensure consistent timestamp pattern
      if (timeIntervalMs === 24 * 60 * 60 * 1000) { // daily interval (24h)
        // Create a new date object based on the reading time
        const readingDate = new Date(readingTime);
        
        // Create a new date at the same time as the first bucket, but on the current reading's date
        // This ensures all daily buckets have the same time component
        const firstBucketDate = new Date(result[0]?.timestamp || startTime);
        bucketStartTime = new Date(
          readingDate.getFullYear(),
          readingDate.getMonth(),
          readingDate.getDate(),
          firstBucketDate.getHours(),
          firstBucketDate.getMinutes(),
          firstBucketDate.getSeconds()
        );
      } else {
        // For other intervals, use the standard floor calculation
        bucketStartTime = new Date(
          Math.floor(readingTime / timeIntervalMs) * timeIntervalMs
        );
      }
      
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

// Helper function to correlate lux with irradiance
async function getLuxIrradianceCorrelation(readings, timeIntervalMs, timezone) {
  const result = [];
  const startTime = readings.length > 0 ? new Date(readings[0].endTime).getTime() : null;
  
  if (!startTime) return [];
  
  let currentBucket = {
    timestamp: new Date(startTime),
    values: {
      lux: [],
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
      if (currentBucket.values.lux.length > 0 || currentBucket.values.irradiance.length > 0) {
        finalizeLuxIrradianceBucket(currentBucket);
        result.push(currentBucket);
      }
      
      // Create a new bucket aligned to the time interval
      let bucketStartTime;
      
      // Special handling for 'daily' interval to ensure consistent timestamp pattern
      if (timeIntervalMs === 24 * 60 * 60 * 1000) { // daily interval (24h)
        // Create a new date object based on the reading time
        const readingDate = new Date(readingTime);
        
        // Create a new date at the same time as the first bucket, but on the current reading's date
        // This ensures all daily buckets have the same time component
        const firstBucketDate = new Date(result[0]?.timestamp || startTime);
        bucketStartTime = new Date(
          readingDate.getFullYear(),
          readingDate.getMonth(),
          readingDate.getDate(),
          firstBucketDate.getHours(),
          firstBucketDate.getMinutes(),
          firstBucketDate.getSeconds()
        );
      } else {
        // For other intervals, use the standard floor calculation
        bucketStartTime = new Date(
          Math.floor(readingTime / timeIntervalMs) * timeIntervalMs
        );
      }
      
      currentBucket = {
        timestamp: bucketStartTime,
        values: {
          lux: [],
          irradiance: []
        }
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process lux data (from light)
    if (reading.readings.light && reading.readings.light.length > 0) {
      for (const sensor of reading.readings.light) {
        currentBucket.values.lux.push({
          panelId: sensor.panelId,
          value: sensor.average,
          unit: sensor.unit
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
  if (currentBucket.values.lux.length > 0 || currentBucket.values.irradiance.length > 0) {
    finalizeLuxIrradianceBucket(currentBucket);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to finalize lux vs irradiance bucket
function finalizeLuxIrradianceBucket(bucket) {
  // Calculate lux average
  if (bucket.values.lux.length > 0) {
    const totalLux = bucket.values.lux.reduce((sum, item) => sum + item.value, 0);
    const avgLux = totalLux / bucket.values.lux.length;
    
    bucket.lux = {
      value: avgLux,
      unit: bucket.values.lux[0].unit
    };
    
    // Store panel-specific lux data
    bucket.panels = {};
    for (const item of bucket.values.lux) {
      bucket.panels[item.panelId] = {
        lux: item.value,
        luxUnit: item.unit
      };
    }
  } else {
    bucket.lux = { value: 0, unit: 'lux' };
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
        bucket.panels[item.panelId] = {
          lux: 0,
          luxUnit: 'lux'
        };
      }
      bucket.panels[item.panelId].irradiance = item.value;
      bucket.panels[item.panelId].irradianceUnit = item.unit;
    }
  } else {
    bucket.irradiance = { value: 0, unit: 'W/m2' };
    
    // Initialize irradiance for all panels if not already done
    if (Object.keys(bucket.panels).length > 0) {
      for (const panelId in bucket.panels) {
        if (!bucket.panels[panelId].hasOwnProperty('irradiance')) {
          bucket.panels[panelId].irradiance = 0;
          bucket.panels[panelId].irradianceUnit = 'W/m2';
        }
      }
    }
  }
  
  // Convert panels object to array
  bucket.panels = Object.entries(bucket.panels).map(([panelId, data]) => ({
    panelId,
    lux: data.lux || 0,
    luxUnit: data.luxUnit || 'lux',
    irradiance: data.irradiance || 0,
    irradianceUnit: data.irradianceUnit || 'W/m2'
  }));
  
  // Remove the values array
  delete bucket.values;
}

// Helper function to calculate summary values for analytics page
function calculateSummaryValues(readings, chartData, timezone="Asia/Manila") {
  // 1. Calculate efficiency using morning values only (6am to 4pm)
  let efficiencyValue = 0;
  
  // Define rated power constant
  const RATED_POWER = 100; // 100W rating
  
  // Filter readings to get only those between 6am and 4pm
  if (readings && readings.length > 0) {
    const morningReadings = readings.filter(reading => {
      // Use timezone when determining the hour
      let hour;
      if (timezone) {
        // Convert to client's timezone before getting the hour
        const dateInTimezone = new Date(reading.endTime).toLocaleString('en-US', { 
          timeZone: timezone,
          hour12: false 
        });
        hour = new Date(dateInTimezone).getHours();
      } else {
        // Fallback to server timezone if no client timezone provided
        hour = new Date(reading.endTime).getHours();
      }
      return hour >= 6 && hour <= 16; // 6am to 4pm
    });
    
    // Calculate efficiency using performance ratio instead of comparing to predicted power
    if (morningReadings.length > 0) {
      let totalActualPower = 0;
      let panelCount = 0;
      
      morningReadings.forEach(reading => {
        if (reading.readings.actual_avg_power && reading.readings.actual_avg_power.length > 0) {
          // Sum up all panel values
          reading.readings.actual_avg_power.forEach(panel => {
            totalActualPower += panel.average || 0;
            panelCount++;
          });
        }
      });
      
      // Calculate performance ratio if we have valid readings
      if (panelCount > 0) {
        // Use average power per panel
        const avgPowerPerPanel = totalActualPower / panelCount;
        // Calculate performance ratio: (actual power / rated power) * 100
        efficiencyValue = (avgPowerPerPanel / RATED_POWER) * 100;
      }
    }
  }
  
  const efficiency = {
    value: efficiencyValue,
    unit: '%'
  };
  
  // 2. Calculate Total Yield using daily energy totals from panelPerformance
  let totalYield = 0;
  let totalPredictedYield = 0;
  let yieldTrend = 0;
  let yieldRemark = "within predictions";
  
  if (chartData.panelPerformance && chartData.panelPerformance.length > 0) {
    // Sum up all the daily energy values and predicted values
    chartData.panelPerformance.forEach(day => {
      // Add actual energy
      totalYield += (day.total && day.total.energy) ? day.total.energy : 0;
      
      // Add predicted energy
      totalPredictedYield += (day.total && day.total.predicted) ? day.total.predicted : 0;
    });
    
    // Calculate trend (difference between actual and predicted)
    yieldTrend = totalYield - totalPredictedYield;
    
    // Determine remark based on comparison with 5% threshold
    const percentDifference = totalPredictedYield > 0 ? 
      (yieldTrend / totalPredictedYield) * 100 : 0;
    
    if (Math.abs(percentDifference) <= 5) {
      yieldRemark = "within predictions";
    } else if (percentDifference > 5) {
      yieldRemark = "higher than predicted";
    } else {
      yieldRemark = "lower than predicted";
    }
  }
  
  // 3. Determine Peak Solar Hours
  let peakHourStart = "N/A";
  let peakHourEnd = "N/A";
  let bestTime = "N/A";
  
  if (chartData.peakSolarHours && chartData.peakSolarHours.length > 0) {
    // Find the hours with the highest energy production by checking actual values
    // Create a copy for sorting to avoid changing the original data
    const sortedHours = [...chartData.peakSolarHours]
      .filter(h => h.average && typeof h.average.value === 'number')
      .sort((a, b) => b.average.value - a.average.value);
    
    // Debug the sorted hours
    console.log('Top 3 peak solar hour values:',
      sortedHours.slice(0, 3).map(h => ({ hour: h.hour, value: h.average.value }))
    );
    
    if (sortedHours.length > 0 && sortedHours[0].average.value > 0) {
      // Get the best hour from the sorted data
      const bestHour = sortedHours[0].hour;
      bestTime = `${bestHour}:00`;
      
      // Find contiguous range of good production hours (above 50% of peak)
      const threshold = sortedHours[0].average.value * 0.5;
      const productiveHours = chartData.peakSolarHours
        .filter(h => h.average && h.average.value >= threshold)
        .map(h => h.hour)
        .sort((a, b) => a - b);
      
      console.log('Peak threshold:', threshold);
      console.log('Productive hours:', productiveHours);
      
      if (productiveHours.length > 0) {
        // Find contiguous ranges
        const ranges = [];
        let currentRange = [productiveHours[0]];
        
        for (let i = 1; i < productiveHours.length; i++) {
          if (productiveHours[i] === productiveHours[i-1] + 1) {
            // Continue the current range
            currentRange.push(productiveHours[i]);
          } else {
            // Start a new range
            ranges.push([...currentRange]);
            currentRange = [productiveHours[i]];
          }
        }
        // Add the last range
        ranges.push(currentRange);
        
        // Find the longest contiguous range
        const longestRange = ranges.reduce((longest, current) => 
          current.length > longest.length ? current : longest, []);
        
        if (longestRange.length > 0) {
          peakHourStart = `${longestRange[0]}:00`;
          peakHourEnd = `${longestRange[longestRange.length - 1]}:00`;
        } else {
          // Fallback to first and last productive hour
          peakHourStart = `${productiveHours[0]}:00`;
          peakHourEnd = `${productiveHours[productiveHours.length - 1]}:00`;
        }
      }
    }
  }
  
  return {
    efficiency,
    totalYield: {
      value: totalYield,
      predicted: totalPredictedYield,
      trend: yieldTrend,
      remark: yieldRemark,
      unit: 'kWh'
    },
    peakSolarHours: {
      start: peakHourStart,
      end: peakHourEnd,
      bestTime: bestTime
    }
  };
} 
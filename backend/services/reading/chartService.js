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
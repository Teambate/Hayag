import SensorReading from "../../model/reading.model.js";

export const getFilteredReadingsService = async (params) => {
  const { startDateTime, endDateTime, panelIds, sensorTypes, deviceId } = params;
  
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
  
  return {
    count: sensorReadings.length,
    data: sensorReadings
  };
}; 
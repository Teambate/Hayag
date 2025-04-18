import SensorReading from "../../model/reading.model.js";

export const getFilteredReadingsService = async (params) => {
  const { startDateTime, endDateTime, panelIds, sensorTypes, deviceId, page = 1, pageSize = 10 } = params;
  
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
  
  // Parse pagination parameters
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  
  // Start building the aggregation pipeline
  const pipeline = [];
  
  // Stage 1: Match documents based on time range and deviceId
  const matchStage = {};
  if (startDateTime || endDateTime) {
    matchStage.endTime = {};
    if (startDateTime) matchStage.endTime.$gte = new Date(startDateTime);
    if (endDateTime) matchStage.endTime.$lte = new Date(endDateTime);
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
    endTime: 1
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
          endTime: 1,
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
          endTime: 1,
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
  
  // Create a copy of the pipeline for counting total documents
  const countPipeline = [...pipeline];
  
  // For the count pipeline, add a count stage
  countPipeline.push({ $count: "total" });
  
  // For the data pipeline, add sort, skip, and limit stages for pagination
  pipeline.push({ $sort: { endTime: -1 } }); // Sort by endTime descending (newest first)
  
  if (pageNum > 0 && pageSizeNum > 0) {
    const skip = (pageNum - 1) * pageSizeNum;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSizeNum });
  }
  
  // Execute both pipelines
  const [sensorReadings, countResult] = await Promise.all([
    SensorReading.aggregate(pipeline),
    SensorReading.aggregate(countPipeline)
  ]);
  
  // Get total count from count result
  const totalDocuments = countResult.length > 0 ? countResult[0].total : 0;
  
  // Calculate total pages
  const totalPages = pageSizeNum > 0 ? Math.ceil(totalDocuments / pageSizeNum) : 1;
  
  return {
    count: sensorReadings.length,
    totalDocuments,
    totalPages,
    currentPage: pageNum,
    pageSize: pageSizeNum,
    data: sensorReadings
  };
}; 
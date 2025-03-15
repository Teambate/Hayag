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
    const { startDateTime, endDateTime, panelIds, sensorTypes } = req.query;
    
    // Build the query object
    const query = {};
    
    // Add time range filter if provided (including time component)
    if (startDateTime || endDateTime) {
      query.createdAt = {};
      if (startDateTime) query.createdAt.$gte = new Date(startDateTime);
      if (endDateTime) query.createdAt.$lte = new Date(endDateTime);
    }
    
    // Convert parameters to arrays if they're strings
    const panelIdsArray = panelIds ? 
      (Array.isArray(panelIds) ? panelIds : panelIds.split(',')) : 
      null;
    
    const sensorTypesArray = sensorTypes ? 
      (Array.isArray(sensorTypes) ? sensorTypes : sensorTypes.split(',')) : 
      null;
    
    // Add sensor types filter to the MongoDB query
    if (sensorTypesArray && sensorTypesArray.length > 0) {
      // Create a $or array for each sensor type
      const sensorTypeQueries = sensorTypesArray.map(type => {
        // Check if this sensor type exists and has entries
        const condition = {};
        condition[`readings.${type}`] = { $exists: true, $ne: [] };
        return condition;
      });
      
      if (sensorTypeQueries.length > 0) {
        query.$or = sensorTypeQueries;
      }
    }
    
    // Add panel IDs filter if provided
    if (panelIdsArray && panelIdsArray.length > 0) {
      // We need to filter by panel IDs in the database query
      // This is more complex as we need to check across potentially multiple sensor types
      // For simplicity, we'll handle panel filtering in memory after the query
      // But we'll optimize by using projection to only return relevant fields
    }
    
    // Create projection to only return necessary fields
    const projection = { deviceId: 1, metadata: 1, createdAt: 1 };
    
    // Add requested sensor types to projection if specified
    if (sensorTypesArray && sensorTypesArray.length > 0) {
      sensorTypesArray.forEach(type => {
        projection[`readings.${type}`] = 1;
      });
    } else {
      // If no sensor types specified, include all readings
      projection.readings = 1;
    }
    
    // Execute the query with projection
    let sensorReadings = await SensorReading.find(query, projection);
    
    // If panel IDs are specified, filter the results in memory
    if (panelIdsArray && panelIdsArray.length > 0) {
      // First filter to only include readings that have at least one matching panel ID
      sensorReadings = sensorReadings.filter(reading => {
        // Check if any sensor in any requested sensor type has one of the specified panel IDs
        return Object.entries(reading.readings).some(([type, sensorArray]) => {
          // Skip if not in requested sensor types (if sensor types were specified)
          if (sensorTypesArray && !sensorTypesArray.includes(type)) return false;
          
          // Check if any sensor in this type has one of the requested panel IDs
          return sensorArray.some(sensor => 
            panelIdsArray.includes(sensor.panelId)
          );
        });
      });
      
      // Then filter the sensor arrays to only include the requested panel IDs
      sensorReadings = sensorReadings.map(reading => {
        // Create a deep copy of the reading to avoid modifying the original
        const filteredReading = JSON.parse(JSON.stringify(reading));
        
        // For each sensor type in the readings
        Object.keys(filteredReading.readings).forEach(type => {
          // Skip if not in requested sensor types (if sensor types were specified)
          if (sensorTypesArray && !sensorTypesArray.includes(type)) {
            delete filteredReading.readings[type];
            return;
          }
          
          // Filter the sensor array to only include the requested panel IDs
          if (Array.isArray(filteredReading.readings[type])) {
            filteredReading.readings[type] = filteredReading.readings[type].filter(sensor => 
              panelIdsArray.includes(sensor.panelId)
            );
          }
        });
        
        return filteredReading;
      });
    }
    
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

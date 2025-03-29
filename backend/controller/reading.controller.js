import SensorReading from "../model/reading.model.js";
import { getFilteredReadingsService } from "../services/reading/filterService.js";
import { getChartDataService, getDashboardChartDataService } from "../services/reading/chartService.js";
import { getCurrentSensorValuesService, getPanelIdsForDeviceService, createReadingService, bulkInsertReadingsService } from "../services/reading/sensorService.js";

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
    const result = await getFilteredReadingsService(req.query);
    res.status(200).json({ 
      success: true, 
      count: result.count,
      data: result.data 
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
    // Get the Socket.io instance
    const io = req.app.get('io');
    
    const newSensorReading = await createReadingService(sensorReadings, io);
    
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
    const result = await getCurrentSensorValuesService(req.query);
    
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
    const result = await getChartDataService(req.query);
    
    res.status(200).json({
      success: true,
      chartType: result.chartType,
      timeInterval: result.timeInterval,
      data: result.data
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
    const result = await getDashboardChartDataService(req.query);
    
    res.status(200).json({
      success: true,
      timeInterval: result.timeInterval,
      date: result.date,
      data: result.data
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
    
    const result = await getPanelIdsForDeviceService(deviceId);
    
    res.status(200).json({ 
      success: true, 
      count: result.count,
      data: result.data
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

/**
 * Bulk insert readings from a JSON file or array
 * @route POST /api/readings/bulk
 * @access Admin only
 */
export const bulkInsertReadings = async (req, res) => {
  try {
    const { readings, options } = req.body;
    
    if (!readings || !Array.isArray(readings)) {
      return res.status(400).json({
        success: false,
        message: "Request must contain a 'readings' array"
      });
    }
    
    // Get the Socket.io instance
    const io = req.app.get('io');
    
    // Process bulk insertion
    const insertResult = await bulkInsertReadingsService(
      readings, 
      options || {}, 
      io
    );
    
    res.status(201).json({
      success: true,
      message: `Successfully processed ${insertResult.totalDocuments} documents with ${insertResult.insertedCount} inserted`,
      result: insertResult
    });
  } catch (error) {
    console.error("Error bulk inserting readings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk insert readings",
      error: error.message
    });
  }
};

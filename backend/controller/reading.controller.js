import SensorReading from "../model/reading.model.js";
import { getFilteredReadingsService } from "../services/reading/filterService.js";
import { getChartDataService, getDashboardChartDataService, getAnalyticsDataService } from "../services/reading/chartService.js";
import { getCurrentSensorValuesService, getPanelIdsForDeviceService, createReadingService, bulkInsertReadingsService } from "../services/reading/sensorService.js";
import { formatNumericValues } from "../utils/numberUtils.js";

export const getReadings = async (req, res) => {
  try {
    const sensorReadings = await SensorReading.find();
    res.status(200).json({ success: true, data: formatNumericValues(sensorReadings) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFilteredReadings = async (req, res) => {
  try {
    // Get client timezone from headers or query parameters
    const timezone = req.headers['timezone'] || req.query.timezone;
    
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    
    // Add timezone and pagination to query params
    const queryParams = { 
      ...req.query, 
      timezone,
      page,
      pageSize
    };
    
    const result = await getFilteredReadingsService(queryParams);
    res.status(200).json({ 
      success: true, 
      count: result.count,
      pagination: {
        totalDocuments: result.totalDocuments,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
        hasNextPage: result.currentPage < result.totalPages,
        hasPrevPage: result.currentPage > 1
      },
      data: formatNumericValues(result.data)
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
    // Get client timezone from headers or query parameters
    const timezone = req.headers['timezone'] || req.query.timezone;
    
    // Add timezone to query params
    const queryParams = { ...req.query, timezone };
    
    const result = await getCurrentSensorValuesService(queryParams);
    
    res.status(200).json({
      success: true,
      data: {
        ...formatNumericValues(result),
        timestamp: result.timestamp
      }
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
    // Get client timezone from headers or query parameters
    const timezone = req.headers['timezone'] || req.query.timezone;
    
    // Add timezone to query params
    const queryParams = { ...req.query, timezone };
    
    const result = await getChartDataService(queryParams);
    
    res.status(200).json({
      success: true,
      chartType: result.chartType,
      timeInterval: result.timeInterval,
      data: formatNumericValues(result.data)
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
    // Get client timezone from headers or query parameters
    const timezone = req.headers['timezone'] || req.query.timezone;
    
    // Add timezone to query params
    const queryParams = { ...req.query, timezone };
    
    console.log(`Received dashboard chart request with timezone: ${timezone}`);
    
    const result = await getDashboardChartDataService(queryParams);
    
    // Extract the data from the service result
    const responseData = {
      success: true,
      timeInterval: result.timeInterval,
      startDate: result.startDate,
      endDate: result.endDate,
      timezone: result.timezone,
      data: formatNumericValues(result.data)
    };
    
    // Add debug information if needed
    if (process.env.NODE_ENV === 'development') {
      responseData.debug = {
        originalStartDate: result.originalStartDate,
        originalEndDate: result.originalEndDate,
        serverTimestamp: new Date().toISOString(),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        nodeTZEnv: process.env.TZ || 'not set'
      };
    }
    
    console.log(`Sending response with date range: ${result.startDate} to ${result.endDate} (UTC: ${result.originalStartDate} to ${result.originalEndDate})`);
    
    // Always include the original UTC dates even in production for monitoring this fix
    responseData.originalStartDate = result.originalStartDate;
    responseData.originalEndDate = result.originalEndDate;
    
    res.status(200).json(responseData);
    
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

export const getAnalyticsData = async (req, res) => {
  try {
    // Get client timezone from headers or query parameters
    const timezone = req.headers['timezone'] || req.query.timezone;
    
    // Add timezone to query params
    const queryParams = { ...req.query, timezone };
    
    const result = await getAnalyticsDataService(queryParams);
    
    res.status(200).json({
      success: true,
      timeInterval: result.timeInterval,
      startDate: result.startDate,
      endDate: result.endDate,
      summaryValues: formatNumericValues(result.summaryValues),
      data: formatNumericValues(result.data)
    });
    
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
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

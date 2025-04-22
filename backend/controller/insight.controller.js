import { 
  generateDailyInsightsService, 
  getInsightsService, 
  checkAndGenerateMissingInsightsService 
} from "../services/insight/insightService.js";
import { formatNumericValues } from "../utils/numberUtils.js";

/**
 * Generate insights for a specific device and date
 * @route POST /api/insights/generate
 */
export const generateInsights = async (req, res) => {
  try {
    // Get params from either body (POST) or query (GET)
    const deviceId = req.body.deviceId || req.query.deviceId;
    const date = req.body.date || req.query.date;
    const timezone = req.body.timezone || req.query.timezone || req.headers['timezone'];
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false,
        message: "deviceId is required"
      });
    }
    
    console.log(`Generating insights for deviceId: ${deviceId}, date: ${date}, timezone: ${timezone}`);
    
    // Parse date if provided
    const targetDate = date ? new Date(date) : null;
    
    const result = await generateDailyInsightsService(deviceId, targetDate, timezone);
    
    // For safer handling of circular references in Mongoose documents
    let responseData;
    
    try {
      // Try to format the data, but with a safety mechanism
      if (result.data) {
        responseData = JSON.parse(JSON.stringify(result.data)); // Strip any circular references
        responseData = formatNumericValues(responseData);
      } else {
        responseData = result;
      }
    } catch (formatError) {
      console.error("Error formatting insight data:", formatError);
      responseData = {
        _id: result.data?._id,
        deviceId: result.data?.deviceId,
        date: result.data?.date,
        message: "Data available but couldn't be fully formatted"
      };
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: responseData
    });
    
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights",
      error: error.message
    });
  }
};

/**
 * Get insights for a specific device and date range
 * @route GET /api/insights
 */
export const getInsights = async (req, res) => {
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
    
    const result = await getInsightsService(queryParams);
    
    // For safer handling of circular references in Mongoose documents
    let responseData;
    
    try {
      // Convert to plain object first to break circular references
      responseData = JSON.parse(JSON.stringify(result.data));
      responseData = formatNumericValues(responseData);
    } catch (formatError) {
      console.error("Error formatting insights data:", formatError);
      responseData = result.data.map(insight => ({
        _id: insight._id,
        deviceId: insight.deviceId,
        date: insight.date,
        message: "Data available but couldn't be fully formatted"
      }));
    }
    
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
      data: responseData
    });
    
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insights",
      error: error.message
    });
  }
};

/**
 * Get formatted insight reports for the UI
 * @route GET /api/insights/reports
 */
export const getInsightReports = async (req, res) => {
  try {
    // Get params
    const deviceId = req.query.deviceId;
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false,
        message: "deviceId is required"
      });
    }
    
    // Get all insights for this device
    const result = await getInsightsService({ 
      deviceId,
      pageSize: 1000 // Set a large page size to get all insights
    });
    
    if (!result.data || result.data.length === 0) {
      return res.status(200).json({
        success: true,
        reports: []
      });
    }
    
    // Create formatted reports from insights
    const reports = result.data.map(insight => {
      // Format date
      const date = new Date(insight.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Create performance report
      const performanceReport = {
        title: "Daily Performance Summary",
        sub_title: `Energy: ${insight.dailyPerformance?.energyGenerated?.value || 0} ${insight.dailyPerformance?.energyGenerated?.unit || 'kWh'}`,
        content: createPerformanceReportContent(insight.dailyPerformance)
      };
      
      // Create sensor health report
      const sensorHealthReport = {
        title: "Sensor Health Report",
        sub_title: `${insight.sensorHealth?.summary?.good || 0} Good, ${insight.sensorHealth?.summary?.warning || 0} Warning, ${insight.sensorHealth?.summary?.critical || 0} Critical`,
        content: createSensorHealthReportContent(insight.sensorHealth)
      };
      
      // Create panel health report
      const panelHealthReport = {
        title: "Panel Health & Efficiency",
        sub_title: `${insight.panelHealth?.summary?.goodPanels || 0} Good, ${insight.panelHealth?.summary?.warningPanels || 0} Warning, ${insight.panelHealth?.summary?.criticalPanels || 0} Critical`,
        content: createPanelHealthReportContent(insight.panelHealth)
      };
      
      // Create insights summary
      const insightsSummary = {
        title: "System Insights",
        sub_title: `${insight.insights?.length || 0} Insights Generated`,
        content: createInsightsSummaryContent(insight.insights)
      };
      
      return {
        id: insight._id,
        date: insight.date,
        time: formattedDate,
        performance_report: performanceReport,
        sensorhealth_report: sensorHealthReport,
        panelhealth_report: panelHealthReport,
        insights: insightsSummary
      };
    });
    
    res.status(200).json({
      success: true,
      reports
    });
    
  } catch (error) {
    console.error("Error generating insight reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insight reports",
      error: error.message
    });
  }
};

/**
 * Check for days with missing insights and generate them
 * @route POST /api/insights/check-and-generate
 */
export const checkAndGenerateMissingInsights = async (req, res) => {
  try {
    const deviceId = req.body.deviceId || req.query.deviceId;
    const daysToCheck = req.body.daysToCheck || req.query.daysToCheck;
    
    if (!deviceId) {
      return res.status(400).json({ 
        success: false,
        message: "deviceId is required"
      });
    }
    
    console.log(`Checking for missing insights: deviceId=${deviceId}, daysToCheck=${daysToCheck || 7}`);
    
    const result = await checkAndGenerateMissingInsightsService(
      deviceId,
      daysToCheck || 7
    );
    
    // Convert to plain object to avoid circular references
    const responseData = JSON.parse(JSON.stringify(result));
    
    res.status(200).json({
      success: true,
      message: `Checked ${result.daysChecked} days and generated insights for ${result.daysGenerated} days`,
      data: responseData
    });
    
  } catch (error) {
    console.error("Error checking and generating insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check and generate insights",
      error: error.message
    });
  }
};

/**
 * Helper Functions to Create Report Content
 */

// Format performance data into readable content
function createPerformanceReportContent(performanceData) {
  if (!performanceData) return "No performance data available.";
  
  const lines = [];
  
  const energy = performanceData.energyGenerated?.value || 0;
  const energyUnit = performanceData.energyGenerated?.unit || 'kWh';
  lines.push(`Generated ${energy} ${energyUnit} of energy`);
  
  const comparisonValue = performanceData.comparisonWithYesterday?.value || 0;
  if (comparisonValue !== 0) {
    const trend = comparisonValue > 0 ? "increase" : "decrease";
    lines.push(`${Math.abs(comparisonValue)}% ${trend} compared to yesterday`);
  } else {
    lines.push("Same energy production as yesterday");
  }
  
  const peakTime = performanceData.peakGenerationTime || "N/A";
  const peakValue = performanceData.peakGenerationValue?.value || 0;
  const peakUnit = performanceData.peakGenerationValue?.unit || 'kWh';
  lines.push(`Peak generation: ${peakValue} ${peakUnit} at ${peakTime}`);
  
  const efficiency = performanceData.efficiencyRate?.value || 0;
  lines.push(`System efficiency: ${efficiency}%`);
  
  return lines.join("\n");
}

// Format sensor health data into readable content
function createSensorHealthReportContent(healthData) {
  if (!healthData || !healthData.summary) return "No sensor health data available.";
  
  const lines = [];
  
  const { total, good, warning, critical } = healthData.summary;
  lines.push(`${total} sensors monitored: ${good} good, ${warning} warning, ${critical} critical`);
  
  // Add critical sensor details if any
  if (critical > 0 && healthData.details) {
    const criticalSensors = healthData.details.filter(s => s.status === "critical");
    const criticalTypes = [...new Set(criticalSensors.map(s => s.sensorType))];
    
    if (criticalTypes.length > 0) {
      lines.push(`Critical sensors: ${criticalTypes.join(", ")}`);
    }
  }
  
  // Add warning sensor details if any
  if (warning > 0 && healthData.details) {
    const warningSensors = healthData.details.filter(s => s.status === "warning");
    const warningTypes = [...new Set(warningSensors.map(s => s.sensorType))];
    
    if (warningTypes.length > 0) {
      lines.push(`Warning sensors: ${warningTypes.join(", ")}`);
    }
  }
  
  return lines.join("\n");
}

// Format panel health data into readable content
function createPanelHealthReportContent(panelData) {
  if (!panelData || !panelData.summary) return "No panel health data available.";
  
  const lines = [];
  
  const { totalPanels, goodPanels, warningPanels, criticalPanels } = panelData.summary;
  lines.push(`${totalPanels} panels monitored: ${goodPanels} good, ${warningPanels} warning, ${criticalPanels} critical`);
  
  // Add temperature information if available
  if (panelData.details && panelData.details.length > 0) {
    // Calculate average temperature across all panels
    let totalTemp = 0;
    let tempCount = 0;
    let highestTemp = -Infinity;
    let highestTempPanelId = '';
    
    for (const panel of panelData.details) {
      if (panel.temperature && panel.temperature.avg !== null) {
        totalTemp += panel.temperature.avg;
        tempCount++;
        
        if (panel.temperature.max > highestTemp) {
          highestTemp = panel.temperature.max;
          highestTempPanelId = panel.panelId;
        }
      }
    }
    
    if (tempCount > 0) {
      const avgTemp = totalTemp / tempCount;
      lines.push(`Average panel temperature: ${avgTemp.toFixed(1)}°C`);
      
      if (highestTemp !== -Infinity) {
        lines.push(`Highest temperature: ${highestTemp.toFixed(1)}°C (Panel ${highestTempPanelId})`);
      }
    }
    
    // Add efficiency information
    if (panelData.details.length > 0) {
      // Find best and worst performing panels
      const sortedByEfficiency = [...panelData.details].sort((a, b) => {
        return (b.efficiency?.value || 0) - (a.efficiency?.value || 0);
      });
      
      const bestPanel = sortedByEfficiency[0];
      const worstPanel = sortedByEfficiency[sortedByEfficiency.length - 1];
      
      if (bestPanel && bestPanel.efficiency) {
        lines.push(`Best panel efficiency: ${bestPanel.efficiency.value}% (Panel ${bestPanel.panelId})`);
      }
      
      if (worstPanel && worstPanel.efficiency) {
        lines.push(`Lowest panel efficiency: ${worstPanel.efficiency.value}% (Panel ${worstPanel.panelId})`);
      }
    }
  }
  
  return lines.join("\n");
}

// Format insights into readable content
function createInsightsSummaryContent(insights) {
  if (!insights || insights.length === 0) return "No insights available.";
  
  // Group insights by category
  const categories = {};
  
  for (const insight of insights) {
    if (!categories[insight.category]) {
      categories[insight.category] = [];
    }
    categories[insight.category].push(insight);
  }
  
  const lines = [];
  
  // Add critical insights first
  const criticalInsights = insights.filter(i => i.importance === "critical");
  if (criticalInsights.length > 0) {
    lines.push("Critical insights:");
    criticalInsights.forEach(i => lines.push(`• ${i.message}`));
  }
  
  // Then add warnings
  const warningInsights = insights.filter(i => i.importance === "warning");
  if (warningInsights.length > 0) {
    lines.push("Warning insights:");
    warningInsights.forEach(i => lines.push(`• ${i.message}`));
  }
  
  // Then add important info insights
  const infoInsights = insights.filter(i => i.importance === "info" && i.category === "performance");
  if (infoInsights.length > 0) {
    lines.push("Performance insights:");
    infoInsights.forEach(i => lines.push(`• ${i.message}`));
  }
  
  return lines.join("\n");
} 
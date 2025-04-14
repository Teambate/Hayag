import Insight from "../../model/insight.model.js";
import SensorReading from "../../model/reading.model.js";
import User from "../../model/user.model.js";
import { getStartOfDay, getEndOfDay } from "../../utils/timeUtils.js";
import { formatDecimal } from "../../utils/numberUtils.js";

/**
 * Generate daily insights for a specific device and date
 * @param {string} deviceId - Device ID
 * @param {Date} date - Date to generate insights for (defaults to yesterday)
 * @param {string} timezone - Timezone to use for day calculations
 * @returns {Object} Generated insights
 */
export async function generateDailyInsightsService(deviceId, date, timezone = "Asia/Manila") {
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // If no date provided, default to yesterday
  const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get start and end of the target day in the specified timezone
  const startOfDay = getStartOfDay(targetDate, timezone);
  const endOfDay = getEndOfDay(targetDate, timezone);
  
  // Get start and end of previous day for comparison
  const startOfPrevDay = new Date(startOfDay);
  startOfPrevDay.setDate(startOfPrevDay.getDate() - 1);
  const endOfPrevDay = new Date(endOfDay);
  endOfPrevDay.setDate(endOfPrevDay.getDate() - 1);
  
  // Check if insights already exist for this device and date
  const existingInsight = await Insight.findOne({
    deviceId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  if (existingInsight) {
    return {
      message: "Insights already generated for this date",
      data: existingInsight
    };
  }
  
  // Get all sensor readings for the target day
  const readings = await SensorReading.find({
    deviceId,
    endTime: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ endTime: 1 }).lean();  // Use lean() to get plain JavaScript objects
  
  if (readings.length === 0) {
    return {
      message: "No readings found for the specified date",
      date: targetDate,
      deviceId
    };
  }
  
  // Get previous day's readings for comparison
  const prevDayReadings = await SensorReading.find({
    deviceId,
    endTime: {
      $gte: startOfPrevDay,
      $lte: endOfPrevDay
    }
  }).lean();  // Use lean() to get plain JavaScript objects
  
  // Generate insights
  const dailyPerformance = generatePerformanceInsights(readings, prevDayReadings);
  const sensorHealth = generateSensorHealthInsights(readings);
  const panelHealth = generatePanelHealthInsights(readings);
  const insights = generateTextualInsights(dailyPerformance, sensorHealth, panelHealth);
  
  // Create insight document
  const insight = new Insight({
    deviceId,
    date: startOfDay,
    timezone,
    dailyPerformance,
    sensorHealth,
    panelHealth,
    insights,
    metadata: {
      processingTime: new Date(),
      dataQuality: {
        completeness: calculateDataCompleteness(readings),
        sampleCount: readings.length
      }
    }
  });
  
  // Save the insight
  await insight.save();
  
  return {
    message: "Successfully generated insights",
    data: insight
  };
}

/**
 * Get insights for a specific device and date range
 * @param {Object} params - Query parameters
 * @returns {Object} Insights
 */
export async function getInsightsService(params) {
  const { 
    deviceId, 
    startDate, 
    endDate,
    page = 1,
    pageSize = 10
  } = params;
  
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  let query = { deviceId };
  
  // Add date filter if provided
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Calculate pagination values
  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize, 10);
  
  // Count total matching documents
  const totalDocuments = await Insight.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);
  
  // Get insights
  const insights = await Insight.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .lean();  // Use lean() to get plain JavaScript objects
  
  return {
    count: insights.length,
    totalDocuments,
    totalPages,
    currentPage: parseInt(page, 10),
    pageSize: limit,
    data: insights
  };
}

/**
 * Check for days with missing insights and generate them if needed
 * @param {string} deviceId - Device ID
 * @param {number} daysToCheck - Number of days to check (defaults to 7)
 * @returns {Object} Results of the check and generation
 */
export async function checkAndGenerateMissingInsightsService(deviceId, daysToCheck = 7) {
  if (!deviceId) {
    throw new Error("deviceId is required");
  }
  
  // Get the user's timezone preference
  const user = await User.findOne({ "devices.deviceId": deviceId });
  const timezone = user?.timezone || "Asia/Manila";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const results = {
    deviceId,
    daysChecked: daysToCheck,
    daysWithReadings: 0,
    daysWithInsights: 0,
    daysGenerated: 0,
    newInsights: []
  };
  
  // Check each day starting from yesterday and going back
  for (let i = 1; i <= daysToCheck; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);
    
    const startOfDay = getStartOfDay(targetDate, timezone);
    const endOfDay = getEndOfDay(targetDate, timezone);
    
    // Check if there are readings for this day
    const readingsExist = await SensorReading.exists({
      deviceId,
      endTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (readingsExist) {
      results.daysWithReadings++;
      
      // Check if insights already exist for this day
      const insightExists = await Insight.exists({
        deviceId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      if (insightExists) {
        results.daysWithInsights++;
      } else {
        // Generate insights for this day
        try {
          const generatedInsight = await generateDailyInsightsService(deviceId, targetDate, timezone);
          if (generatedInsight.data) {
            results.daysGenerated++;
            results.newInsights.push({
              date: targetDate,
              id: generatedInsight.data._id
            });
          }
        } catch (error) {
          console.error(`Error generating insights for ${targetDate.toISOString()}: ${error.message}`);
        }
      }
    }
  }
  
  return results;
}

/**
 * Generate performance insights from sensor readings
 * @param {Array} readings - Array of sensor readings
 * @param {Array} prevDayReadings - Array of previous day's readings
 * @returns {Object} Performance insights
 */
function generatePerformanceInsights(readings, prevDayReadings) {
  // Calculate total energy generated
  const totalEnergy = calculateTotalEnergy(readings);
  const prevDayEnergy = calculateTotalEnergy(prevDayReadings);
  
  // Calculate percentage change compared to previous day
  let comparisonValue = 0;
  if (prevDayEnergy > 0) {
    comparisonValue = ((totalEnergy - prevDayEnergy) / prevDayEnergy) * 100;
  }
  
  // Find peak generation time and value
  const peakGeneration = findPeakGeneration(readings);
  
  // Calculate efficiency rate (real power output / theoretical maximum)
  const efficiencyRate = calculateEfficiencyRate(readings);
  
  return {
    energyGenerated: {
      value: formatDecimal(totalEnergy),
      unit: "kWh"
    },
    comparisonWithYesterday: {
      value: formatDecimal(comparisonValue),
      unit: "%"
    },
    peakGenerationTime: peakGeneration.time,
    peakGenerationValue: {
      value: formatDecimal(peakGeneration.value),
      unit: "kWh"
    },
    efficiencyRate: {
      value: formatDecimal(efficiencyRate),
      unit: "%"
    }
  };
}

/**
 * Generate sensor health insights from readings
 * @param {Array} readings - Array of sensor readings
 * @returns {Object} Sensor health insights
 */
function generateSensorHealthInsights(readings) {
  // Sensor types to analyze
  const sensorTypes = ["rain", "uv", "light", "dht22", "panel_temp", "ina226", "solar", "battery"];
  
  const details = [];
  let totalSensors = 0;
  let goodSensors = 0;
  let warningSensors = 0;
  let criticalSensors = 0;
  
  // Calculate average health for each sensor type and panel
  for (const sensorType of sensorTypes) {
    // Skip if this sensor type doesn't exist in readings or first reading
    if (!readings[0] || !readings[0].readings || !readings[0].readings[sensorType]) continue;
    
    // Get unique panel IDs for this sensor type
    const panelIds = new Set();
    for (const reading of readings) {
      if (reading.readings && reading.readings[sensorType]) {
        for (const sensor of reading.readings[sensorType]) {
          if (sensor && sensor.panelId) {
            panelIds.add(sensor.panelId);
          }
        }
      }
    }
    
    for (const panelId of panelIds) {
      let healthSum = 0;
      let healthCount = 0;
      
      // Calculate average health for this sensor and panel
      for (const reading of readings) {
        if (!reading.readings || !reading.readings[sensorType]) continue;
        
        const sensor = reading.readings[sensorType].find(s => s && s.panelId === panelId);
        if (sensor) {
          // Handle nested health values for sensors like dht22
          if (sensorType === 'dht22') {
            if (sensor.temperature && sensor.temperature.health !== undefined) {
              healthSum += sensor.temperature.health;
              healthCount++;
            }
            if (sensor.humidity && sensor.humidity.health !== undefined) {
              healthSum += sensor.humidity.health;
              healthCount++;
            }
          } else if (sensorType === 'ina226') {
            if (sensor.voltage && sensor.voltage.health !== undefined) {
              healthSum += sensor.voltage.health;
              healthCount++;
            }
            if (sensor.current && sensor.current.health !== undefined) {
              healthSum += sensor.current.health;
              healthCount++;
            }
          } else if (sensor.health !== undefined) {
            healthSum += sensor.health;
            healthCount++;
          }
        }
      }
      
      if (healthCount > 0) {
        const avgHealth = healthSum / healthCount;
        totalSensors++;
        
        // Determine status based on health value
        let status = "good";
        if (avgHealth < 40) {
          status = "critical";
          criticalSensors++;
        } else if (avgHealth < 70) {
          status = "warning";
          warningSensors++;
        } else {
          goodSensors++;
        }
        
        details.push({
          sensorType,
          panelId,
          status,
          avgHealth: formatDecimal(avgHealth)
        });
      }
    }
  }
  
  return {
    summary: {
      total: totalSensors,
      good: goodSensors,
      warning: warningSensors,
      critical: criticalSensors
    },
    details
  };
}

/**
 * Generate panel health insights from readings
 * @param {Array} readings - Array of sensor readings
 * @returns {Object} Panel health insights
 */
function generatePanelHealthInsights(readings) {
  // Get unique panel IDs
  const panelIds = new Set();
  for (const reading of readings) {
    if (reading.readings && reading.readings.panel_temp) {
      for (const sensor of reading.readings.panel_temp) {
        if (sensor && sensor.panelId) {
          panelIds.add(sensor.panelId);
        }
      }
    }
  }
  
  const details = [];
  let totalPanels = 0;
  let goodPanels = 0;
  let warningPanels = 0;
  let criticalPanels = 0;
  
  for (const panelId of panelIds) {
    totalPanels++;
    
    // Collect temperature data
    const temperatures = [];
    for (const reading of readings) {
      if (reading.readings && reading.readings.panel_temp) {
        const tempSensor = reading.readings.panel_temp.find(s => s && s.panelId === panelId);
        if (tempSensor && tempSensor.average !== undefined) {
          temperatures.push(tempSensor.average);
        }
      }
    }
    
    // Calculate min, max, avg temperature
    const tempMin = temperatures.length > 0 ? Math.min(...temperatures) : null;
    const tempMax = temperatures.length > 0 ? Math.max(...temperatures) : null;
    const tempAvg = temperatures.length > 0 ? 
      temperatures.reduce((sum, val) => sum + val, 0) / temperatures.length : null;
    
    // Calculate panel efficiency
    const efficiency = calculatePanelEfficiency(readings, panelId);
    
    // Determine panel status based on efficiency and temperature
    let status = "good";
    if (efficiency < 10 || (tempMax && tempMax > 80)) {
      status = "critical";
      criticalPanels++;
    } else if (efficiency < 20 || (tempMax && tempMax > 70)) {
      status = "warning";
      warningPanels++;
    } else {
      goodPanels++;
    }
    
    details.push({
      panelId,
      efficiency: {
        value: formatDecimal(efficiency),
        unit: "%"
      },
      temperature: {
        min: tempMin !== null ? formatDecimal(tempMin) : null,
        max: tempMax !== null ? formatDecimal(tempMax) : null,
        avg: tempAvg !== null ? formatDecimal(tempAvg) : null,
        unit: "°C"
      },
      status
    });
  }
  
  return {
    summary: {
      totalPanels,
      goodPanels,
      warningPanels,
      criticalPanels
    },
    details
  };
}

/**
 * Generate textual insights based on the data
 * @param {Object} performance - Performance insights
 * @param {Object} sensorHealth - Sensor health insights
 * @param {Object} panelHealth - Panel health insights
 * @returns {Array} Array of insight messages
 */
function generateTextualInsights(performance, sensorHealth, panelHealth) {
  const insights = [];
  
  // Performance insights
  if (performance.energyGenerated.value > 0) {
    insights.push({
      category: "performance",
      importance: "info",
      message: `Generated ${performance.energyGenerated.value} ${performance.energyGenerated.unit} of energy today.`
    });
  }
  
  if (performance.comparisonWithYesterday.value !== 0) {
    const trend = performance.comparisonWithYesterday.value > 0 ? "increase" : "decrease";
    const importance = performance.comparisonWithYesterday.value < -20 ? "warning" : "info";
    
    insights.push({
      category: "performance",
      importance,
      message: `${Math.abs(performance.comparisonWithYesterday.value)}% ${trend} in energy production compared to yesterday.`
    });
  }
  
  if (performance.efficiencyRate.value < 15) {
    insights.push({
      category: "performance",
      importance: "warning",
      message: `Low system efficiency (${performance.efficiencyRate.value}%). Consider checking for dust, shading, or panel issues.`
    });
  }
  
  // Sensor health insights
  if (sensorHealth.summary.critical > 0) {
    insights.push({
      category: "health",
      importance: "critical",
      message: `${sensorHealth.summary.critical} sensors reporting critical health status. Immediate maintenance recommended.`
    });
  }
  
  if (sensorHealth.summary.warning > 0) {
    insights.push({
      category: "health",
      importance: "warning",
      message: `${sensorHealth.summary.warning} sensors reporting degraded health status. Consider checking them soon.`
    });
  }
  
  // Panel health insights
  const hotPanels = panelHealth.details.filter(panel => panel.temperature.max > 70);
  if (hotPanels.length > 0) {
    insights.push({
      category: "maintenance",
      importance: "warning",
      message: `${hotPanels.length} panels reached high temperatures (>70°C). Check for potential cooling or ventilation issues.`
    });
  }
  
  const lowEfficiencyPanels = panelHealth.details.filter(panel => panel.efficiency.value < 15);
  if (lowEfficiencyPanels.length > 0) {
    insights.push({
      category: "maintenance",
      importance: "warning",
      message: `${lowEfficiencyPanels.length} panels showing low efficiency (<15%). Consider cleaning or maintenance.`
    });
  }
  
  // Add a comparison insight if multiple panels
  if (panelHealth.details.length > 1) {
    const sortedPanels = [...panelHealth.details].sort((a, b) => {
      return (b.efficiency?.value || 0) - (a.efficiency?.value || 0);
    });
    
    const bestPanel = sortedPanels[0];
    const worstPanel = sortedPanels[sortedPanels.length - 1];
    
    if (bestPanel && worstPanel && bestPanel.panelId !== worstPanel.panelId && 
        bestPanel.efficiency?.value && worstPanel.efficiency?.value) {
      const difference = bestPanel.efficiency.value - worstPanel.efficiency.value;
      if (difference > 10) {
        insights.push({
          category: "performance",
          importance: "info",
          message: `Panel ${bestPanel.panelId} outperforming panel ${worstPanel.panelId} by ${formatDecimal(difference)}%. Consider checking panel ${worstPanel.panelId} for issues.`
        });
      }
    }
  }
  
  return insights;
}

/**
 * Calculate total energy generated for the day
 * @param {Array} readings - Array of sensor readings
 * @returns {number} Total energy in kWh
 */
function calculateTotalEnergy(readings) {
  let totalEnergy = 0;
  
  if (!readings || readings.length === 0) {
    return totalEnergy;
  }
  
  // Get the time difference between readings
  const timeIntervalHours = getTimeIntervalHours(readings);
  
  for (const reading of readings) {
    // Skip readings without ina226 data
    if (!reading.readings || !reading.readings.ina226 || reading.readings.ina226.length === 0) {
      continue;
    }
    
    for (const sensor of reading.readings.ina226) {
      if (!sensor || !sensor.voltage || !sensor.current) continue;
      
      // Calculate power (W) = voltage (V) * current (mA) / 1000
      const voltage = sensor.voltage?.average || 0;
      const current = sensor.current?.average || 0;
      const powerWatts = voltage * current / 1000;
      
      // Energy (kWh) = power (W) * time (h) / 1000
      const energyKwh = powerWatts * timeIntervalHours / 1000;
      totalEnergy += energyKwh;
    }
  }
  
  return totalEnergy;
}

/**
 * Calculate the time interval between readings in hours
 * @param {Array} readings - Array of sensor readings
 * @returns {number} Time interval in hours
 */
function getTimeIntervalHours(readings) {
  if (!readings || readings.length < 2) {
    return 0.25; // Default to 15 minutes if not enough readings
  }
  
  // Get the first two readings to calculate time difference
  const first = readings[0];
  const second = readings[1];
  
  if (!first || !second || !first.endTime || !second.endTime) {
    return 0.25; // Default if missing timestamps
  }
  
  const diffMs = new Date(second.endTime) - new Date(first.endTime);
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours > 0 ? diffHours : 0.25; // Fallback to 15 minutes if calculation fails
}

/**
 * Find the peak generation time and value
 * @param {Array} readings - Array of sensor readings
 * @returns {Object} Peak generation time and value
 */
function findPeakGeneration(readings) {
  let peakValue = 0;
  let peakTime = "N/A";
  
  if (!readings || readings.length === 0) {
    return { time: peakTime, value: peakValue };
  }
  
  for (const reading of readings) {
    if (!reading.readings || !reading.readings.ina226 || reading.readings.ina226.length === 0) {
      continue;
    }
    
    let totalPower = 0;
    for (const sensor of reading.readings.ina226) {
      if (!sensor || !sensor.voltage || !sensor.current) continue;
      
      const voltage = sensor.voltage?.average || 0;
      const current = sensor.current?.average || 0;
      const power = voltage * current / 1000; // Power in watts
      totalPower += power;
    }
    
    if (totalPower > peakValue) {
      peakValue = totalPower;
      // Format time as HH:MM
      try {
        const date = new Date(reading.endTime);
        peakTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      } catch (error) {
        console.error("Error formatting peak time:", error);
        peakTime = "N/A";
      }
    }
  }
  
  return { time: peakTime, value: peakValue / 1000 }; // Convert W to kW
}

/**
 * Calculate efficiency rate of the system
 * @param {Array} readings - Array of sensor readings
 * @returns {number} Efficiency rate in percentage
 */
function calculateEfficiencyRate(readings) {
  // This is a simplified calculation that needs refinement based on actual panel specs
  let totalPower = 0;
  let totalIrradiance = 0;
  let panelArea = 0; // Assumed panel area in m²
  
  if (!readings || readings.length === 0) {
    return 0;
  }
  
  // Count panels to estimate total area
  const uniquePanelIds = new Set();
  for (const reading of readings) {
    if (reading.readings && reading.readings.ina226) {
      for (const sensor of reading.readings.ina226) {
        if (sensor && sensor.panelId) {
          uniquePanelIds.add(sensor.panelId);
        }
      }
    }
  }
  
  // Assume 1.5m² per panel for now (adjust based on actual panel dimensions)
  panelArea = uniquePanelIds.size * 1.5;
  
  for (const reading of readings) {
    // Calculate total power output
    if (reading.readings && reading.readings.ina226) {
      for (const sensor of reading.readings.ina226) {
        if (!sensor || !sensor.voltage || !sensor.current) continue;
        
        const voltage = sensor.voltage?.average || 0;
        const current = sensor.current?.average || 0;
        totalPower += voltage * current / 1000; // Power in watts
      }
    }
    
    // Calculate average irradiance
    if (reading.readings && reading.readings.solar) {
      let readingIrradiance = 0;
      let irradianceCount = 0;
      
      for (const sensor of reading.readings.solar) {
        if (sensor && sensor.average !== undefined) {
          readingIrradiance += sensor.average;
          irradianceCount++;
        }
      }
      
      if (irradianceCount > 0) {
        totalIrradiance += readingIrradiance / irradianceCount;
      }
    }
  }
  
  // Calculate average values
  const avgPower = readings.length > 0 ? totalPower / readings.length : 0;
  const avgIrradiance = readings.length > 0 ? totalIrradiance / readings.length : 0;
  
  // Skip calculation if no irradiance data
  if (avgIrradiance === 0 || panelArea === 0) {
    return 0;
  }
  
  // Calculate theoretical maximum power
  const theoreticalPower = avgIrradiance * panelArea; // W/m² * m²
  
  // Calculate efficiency
  const efficiency = theoreticalPower > 0 ? (avgPower / theoreticalPower) * 100 : 0;
  
  return efficiency;
}

/**
 * Calculate panel efficiency
 * @param {Array} readings - Array of sensor readings
 * @param {string} panelId - Panel ID
 * @returns {number} Panel efficiency in percentage
 */
function calculatePanelEfficiency(readings, panelId) {
  let totalPower = 0;
  let totalIrradiance = 0;
  const panelArea = 1.5; // Assumed panel area in m²
  
  if (!readings || readings.length === 0 || !panelId) {
    return 0;
  }
  
  for (const reading of readings) {
    // Calculate panel power output
    if (reading.readings && reading.readings.ina226) {
      const sensor = reading.readings.ina226.find(s => s && s.panelId === panelId);
      if (sensor && sensor.voltage && sensor.current) {
        const voltage = sensor.voltage?.average || 0;
        const current = sensor.current?.average || 0;
        totalPower += voltage * current / 1000; // Power in watts
      }
    }
    
    // Get panel irradiance
    if (reading.readings && reading.readings.solar) {
      const sensor = reading.readings.solar.find(s => s && s.panelId === panelId);
      if (sensor && sensor.average !== undefined) {
        totalIrradiance += sensor.average;
      }
    }
  }
  
  // Calculate average values
  const avgPower = readings.length > 0 ? totalPower / readings.length : 0;
  const avgIrradiance = readings.length > 0 ? totalIrradiance / readings.length : 0;
  
  // Skip calculation if no irradiance data
  if (avgIrradiance === 0) {
    return 0;
  }
  
  // Calculate theoretical maximum power
  const theoreticalPower = avgIrradiance * panelArea; // W/m² * m²
  
  // Calculate efficiency
  const efficiency = theoreticalPower > 0 ? (avgPower / theoreticalPower) * 100 : 0;
  
  return efficiency;
}

/**
 * Calculate data completeness percentage
 * @param {Array} readings - Array of sensor readings
 * @returns {number} Completeness percentage
 */
function calculateDataCompleteness(readings) {
  if (!readings || readings.length === 0) {
    return 0;
  }
  
  // Expected readings in a day with 5-minute intervals
  const expectedReadings = 288; // 24 hours * 12 readings per hour
  const completeness = (readings.length / expectedReadings) * 100;
  
  return Math.min(completeness, 100); // Cap at 100%
} 
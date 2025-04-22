// Helper function to convert time interval string to milliseconds
export function getTimeIntervalInMs(intervalString) {
  switch (intervalString) {
    case '5min':
      return 5 * 60 * 1000;
    case '10min':
      return 10 * 60 * 1000;
    case '15min':
      return 15 * 60 * 1000;
    case '30min':
      return 30 * 60 * 1000;
    case 'hourly':
      return 60 * 60 * 1000;
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000; // ~30 days
    default:
      return 15 * 60 * 1000; // Default to 15 minutes
  }
}

// Helper function to aggregate data by time interval
export function aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray, timezone) {
  if (readings.length === 0) return [];
  
  const result = [];
  const startTime = new Date(readings[0].endTime).getTime();
  let currentBucket = {
    timestamp: new Date(startTime),
    values: []
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  for (const reading of readings) {
    const readingTime = new Date(reading.endTime).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket by calculating averages
      if (currentBucket.values.length > 0) {
        finalizeDataBucket(currentBucket, chartType, timezone);
        result.push(currentBucket);
      }
      
      // Create a new bucket aligned to the time interval
      const bucketStartTime = new Date(
        Math.floor(readingTime / timeIntervalMs) * timeIntervalMs
      );
      
      currentBucket = {
        timestamp: bucketStartTime,
        values: []
      };
      
      nextBucketTime = bucketStartTime.getTime() + timeIntervalMs;
    }
    
    // Process the reading based on chart type
    processReadingForChart(reading, currentBucket, chartType, panelIdsArray);
  }
  
  // Finalize the last bucket
  if (currentBucket.values.length > 0) {
    finalizeDataBucket(currentBucket, chartType, timezone);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to process a reading for a specific chart type
export function processReadingForChart(reading, bucket, chartType, panelIdsArray) {
  switch (chartType) {
    case 'energy':
      // Use actual_total_energy and predicted_total_energy directly
      if (reading.readings.actual_total_energy && reading.readings.actual_total_energy.length > 0) {
        for (const sensor of reading.readings.actual_total_energy) {
          // Find matching predicted energy entry for same panelId if available
          let predictedValue = 0;
          if (reading.readings.predicted_total_energy && reading.readings.predicted_total_energy.length > 0) {
            const matchingPrediction = reading.readings.predicted_total_energy.find(
              pred => pred.panelId === sensor.panelId
            );
            if (matchingPrediction) {
              predictedValue = matchingPrediction.value;
            }
          }
          
          bucket.values.push({
            panelId: sensor.panelId,
            timestamp: reading.endTime,
            energy: sensor.value,
            predicted: predictedValue,
            unit: sensor.unit || 'kWh'
          });
        }
      }
      // If actual_total_energy is missing but predicted_total_energy exists
      else if (reading.readings.predicted_total_energy && reading.readings.predicted_total_energy.length > 0) {
        for (const sensor of reading.readings.predicted_total_energy) {
          bucket.values.push({
            panelId: sensor.panelId,
            timestamp: reading.endTime,
            energy: 0,
            predicted: sensor.value,
            unit: sensor.unit || 'kWh'
          });
        }
      }
      break;
      
    case 'battery':
      if (reading.readings.battery && reading.readings.battery.length > 0) {
        for (const sensor of reading.readings.battery) {
          bucket.values.push({
            panelId: sensor.panelId,
            value: sensor.average,
            unit: sensor.unit
          });
        }
      }
      break;
      
    case 'panel_temp':
      if (reading.readings.panel_temp && reading.readings.panel_temp.length > 0) {
        for (const sensor of reading.readings.panel_temp) {
          bucket.values.push({
            panelId: sensor.panelId,
            value: sensor.average,
            unit: sensor.unit
          });
        }
      }
      break;
      
    case 'irradiance':
      if (reading.readings.solar && reading.readings.solar.length > 0) {
        for (const sensor of reading.readings.solar) {
          bucket.values.push({
            panelId: sensor.panelId,
            value: sensor.average,
            unit: sensor.unit
          });
        }
      }
      break;
  }
}

// Helper function to finalize a data bucket by calculating averages
export function finalizeDataBucket(bucket, chartType, timezone) {
  if (bucket.values.length === 0) return;
  
  // If timezone is provided, create a formatted timestamp for display
  if (timezone) {
    try {
      // Format the timestamp according to the client's timezone
      bucket.formattedTimestamp = new Date(bucket.timestamp).toLocaleString('en-US', { 
        timeZone: timezone 
      });
      
      // For debugging purposes, convert UTC timestamp to client's timezone
      // First create a new date object with the UTC timestamp
      const utcDate = new Date(bucket.timestamp);
      
      // Then create a date string in the client's timezone
      const dateInClientTZ = utcDate.toLocaleString('en-US', {
        timeZone: timezone
      });
      
      // Parse this string back to a date object (which will be in local time)
      const clientDate = new Date(dateInClientTZ);
      
      // Store this as localTimestamp
      bucket.localTimestamp = clientDate.toISOString();
      
      // Also store as clientTimezoneISO for consistent timezone representation
      bucket.clientTimezoneISO = clientDate.toISOString();
      
      // Add an informative note for debugging
      bucket.timezoneInfo = `Original UTC: ${utcDate.toISOString()}, Converted to ${timezone}`;
    } catch (error) {
      console.error(`Error converting timestamp to timezone ${timezone}:`, error);
      bucket.timezoneError = error.message;
    }
  }
  
  // Group values by panelId
  const panelGroups = {};
  
  for (const value of bucket.values) {
    if (!panelGroups[value.panelId]) {
      panelGroups[value.panelId] = [];
    }
    panelGroups[value.panelId].push(value);
  }
  
  // Calculate averages for each panel
  const panelAverages = [];
  
  for (const [panelId, values] of Object.entries(panelGroups)) {
    switch (chartType) {
      case 'energy':
        // For energy, we sum the total energy and predicted energy in this time bucket
        const totalEnergy = values.reduce((sum, v) => sum + (v.energy || 0), 0);
        const totalPredicted = values.reduce((sum, v) => sum + (v.predicted || 0), 0);
        panelAverages.push({
          panelId,
          energy: totalEnergy,
          predicted: totalPredicted,
          unit: values[0].unit || 'kWh'
        });
        break;
        
      case 'battery':
      case 'panel_temp':
      case 'irradiance':
        const totalValue = values.reduce((sum, v) => sum + v.value, 0);
        const avgValue = totalValue / values.length;
        panelAverages.push({
          panelId,
          value: avgValue,
          unit: values[0].unit
        });
        break;
    }
  }
  
  // Calculate overall average or total across all panels
  let overallValue;
  
  switch (chartType) {
    case 'energy':
      // For energy, we sum the total energy across all panels
      const totalActualEnergy = panelAverages.reduce((sum, panel) => sum + panel.energy, 0);
      const totalPredictedEnergy = panelAverages.reduce((sum, panel) => sum + panel.predicted, 0);
      overallValue = {
        energy: totalActualEnergy,
        predicted: totalPredictedEnergy,
        unit: panelAverages.length > 0 ? panelAverages[0].unit : 'kWh'
      };
      break;
      
    case 'battery':
    case 'panel_temp':
    case 'irradiance':
      const totalValue = panelAverages.reduce((sum, panel) => sum + panel.value, 0);
      overallValue = {
        value: totalValue / panelAverages.length,
        unit: panelAverages[0].unit
      };
      break;
  }
  
  // Replace the values array with the processed data
  bucket.panels = panelAverages;
  
  // Use "total" instead of "average" for energy chart
  if (chartType === 'energy') {
    bucket.total = overallValue;
  } else {
    bucket.average = overallValue;
  }
  
  delete bucket.values;
} 
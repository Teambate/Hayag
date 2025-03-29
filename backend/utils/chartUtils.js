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
    default:
      return 15 * 60 * 1000; // Default to 15 minutes
  }
}

// Helper function to aggregate data by time interval
export function aggregateDataByTimeInterval(readings, timeIntervalMs, chartType, panelIdsArray) {
  if (readings.length === 0) return [];
  
  const result = [];
  const startTime = new Date(readings[0].createdAt).getTime();
  let currentBucket = {
    timestamp: new Date(startTime),
    values: []
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  for (const reading of readings) {
    const readingTime = new Date(reading.createdAt).getTime();
    
    // If this reading belongs to the next time bucket, finalize the current bucket and create a new one
    if (readingTime >= nextBucketTime) {
      // Finalize the current bucket by calculating averages
      if (currentBucket.values.length > 0) {
        finalizeDataBucket(currentBucket, chartType);
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
    finalizeDataBucket(currentBucket, chartType);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to process a reading for a specific chart type
export function processReadingForChart(reading, bucket, chartType, panelIdsArray) {
  switch (chartType) {
    case 'energy':
      if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
        for (const sensor of reading.readings.ina226) {
          bucket.values.push({
            panelId: sensor.panelId,
            voltage: sensor.voltage.average,
            current: sensor.current.average,
            power: sensor.voltage.average * sensor.current.average
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
export function finalizeDataBucket(bucket, chartType) {
  if (bucket.values.length === 0) return;
  
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
        const totalPower = values.reduce((sum, v) => sum + v.power, 0);
        const avgPower = totalPower / values.length;
        panelAverages.push({
          panelId,
          power: avgPower,
          unit: 'W'
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
  
  // Calculate overall average across all panels
  let overallAverage;
  
  switch (chartType) {
    case 'energy':
      const totalPower = panelAverages.reduce((sum, panel) => sum + panel.power, 0);
      overallAverage = {
        value: totalPower / panelAverages.length,
        unit: 'W'
      };
      break;
      
    case 'battery':
    case 'panel_temp':
    case 'irradiance':
      const totalValue = panelAverages.reduce((sum, panel) => sum + panel.value, 0);
      overallAverage = {
        value: totalValue / panelAverages.length,
        unit: panelAverages[0].unit
      };
      break;
  }
  
  // Replace the values array with the processed data
  bucket.panels = panelAverages;
  bucket.average = overallAverage;
  delete bucket.values;
}

// Helper function to process a reading for chart updates
export function processReadingForCharts(reading) {
  const chartData = {
    energy: [],
    battery: [],
    panel_temp: [],
    irradiance: []
  };
  
  const timestamp = reading.createdAt.getTime();
  
  // Energy production (using current and voltage)
  if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
    reading.readings.ina226.forEach(sensor => {
      const voltage = sensor.voltage.average;
      const current = sensor.current.average;
      const power = voltage * current / 1000; // Convert to watts
      
      chartData.energy.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: power,
        unit: 'W'
      });
    });
  }
  
  // Battery charge
  if (reading.readings.battery && reading.readings.battery.length > 0) {
    reading.readings.battery.forEach(sensor => {
      chartData.battery.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: sensor.average,
        unit: sensor.unit
      });
    });
  }
  
  // Panel temperature
  if (reading.readings.panel_temp && reading.readings.panel_temp.length > 0) {
    reading.readings.panel_temp.forEach(sensor => {
      chartData.panel_temp.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: sensor.average,
        unit: sensor.unit
      });
    });
  }
  
  // Irradiance (using solar)
  if (reading.readings.solar && reading.readings.solar.length > 0) {
    reading.readings.solar.forEach(sensor => {
      chartData.irradiance.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        value: sensor.average,
        unit: sensor.unit
      });
    });
  }
  
  return chartData;
} 
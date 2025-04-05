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
  const startTime = new Date(readings[0].endTime).getTime();
  let currentBucket = {
    timestamp: new Date(startTime),
    values: []
  };
  
  // Initialize the first bucket
  let nextBucketTime = startTime + timeIntervalMs;
  
  // For energy accumulation, we need to track the previous reading
  let previousReadings = {};
  
  for (const reading of readings) {
    const readingTime = new Date(reading.endTime).getTime();
    
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
    processReadingForChart(reading, currentBucket, chartType, panelIdsArray, previousReadings);
    
    // For energy chart, update previousReadings after processing
    if (chartType === 'energy' && reading.readings.ina226 && reading.readings.ina226.length > 0) {
      for (const sensor of reading.readings.ina226) {
        previousReadings[sensor.panelId] = {
          timestamp: reading.endTime,
          voltage: sensor.voltage.average,
          current: sensor.current.average,
          power: sensor.voltage.average * sensor.current.average / 1000 // W
        };
      }
    }
  }
  
  // Finalize the last bucket
  if (currentBucket.values.length > 0) {
    finalizeDataBucket(currentBucket, chartType);
    result.push(currentBucket);
  }
  
  return result;
}

// Helper function to process a reading for a specific chart type
export function processReadingForChart(reading, bucket, chartType, panelIdsArray, previousReadings = {}) {
  switch (chartType) {
    case 'energy':
      if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
        for (const sensor of reading.readings.ina226) {
          const currentPower = sensor.voltage.average * sensor.current.average / 1000; // W
          const prevReading = previousReadings[sensor.panelId];
          
          if (prevReading) {
            // Calculate energy accumulation (kWh) between readings
            const hoursDiff = (new Date(reading.endTime) - new Date(prevReading.timestamp)) / (1000 * 60 * 60);
            const avgPower = (currentPower + prevReading.power) / 2; // W
            const energyKWh = avgPower * hoursDiff / 1000; // kWh
            
            bucket.values.push({
              panelId: sensor.panelId,
              timestamp: reading.endTime,
              power: currentPower,
              energy: energyKWh > 0 ? energyKWh : 0 // Avoid negative values
            });
          } else {
            // For first reading, we can't calculate accumulation
            bucket.values.push({
              panelId: sensor.panelId,
              timestamp: reading.endTime,
              power: currentPower,
              energy: 0
            });
          }
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
        // For energy, we sum the accumulated energy (kWh) in this time bucket
        const totalEnergy = values.reduce((sum, v) => sum + (v.energy || 0), 0);
        panelAverages.push({
          panelId,
          energy: totalEnergy,
          unit: 'kWh'
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
      const totalEnergy = panelAverages.reduce((sum, panel) => sum + panel.energy, 0);
      overallValue = {
        value: totalEnergy,
        unit: 'kWh'
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
  bucket.average = overallValue;
  delete bucket.values;
}

// Track previous readings for energy accumulation calculations in real-time updates
const previousReadingsCache = {};

// Helper function to process a reading for chart updates
export function processReadingForCharts(reading) {
  const chartData = {
    energy: [],
    battery: [],
    panel_temp: [],
    irradiance: []
  };
  
  const timestamp = reading.endTime.getTime();
  
  // Energy production - calculate both power (W) and energy accumulation (kWh)
  if (reading.readings.ina226 && reading.readings.ina226.length > 0) {
    reading.readings.ina226.forEach(sensor => {
      const voltage = sensor.voltage.average;
      const current = sensor.current.average;
      const currentPower = voltage * current / 1000; // Convert to watts
      
      // Get previous reading for this panel to calculate energy accumulation
      const prevReading = previousReadingsCache[sensor.panelId];
      let energyKWh = 0;
      
      if (prevReading) {
        // Calculate energy accumulation (kWh) between readings using the same method as in processReadingForChart
        const hoursDiff = (new Date(reading.endTime) - new Date(prevReading.timestamp)) / (1000 * 60 * 60);
        const avgPower = (currentPower + prevReading.power) / 2; // W
        energyKWh = avgPower * hoursDiff / 1000; // kWh
        
        // Avoid negative values
        energyKWh = energyKWh > 0 ? energyKWh : 0;
      }
      
      // Update previous reading cache for next calculation
      previousReadingsCache[sensor.panelId] = {
        timestamp: reading.endTime,
        voltage: voltage,
        current: current,
        power: currentPower
      };
      
      chartData.energy.push({
        panelId: sensor.panelId,
        timestamp: timestamp,
        power: currentPower,
        energy: energyKWh,
        unit: 'W',
        energyUnit: 'kWh'
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
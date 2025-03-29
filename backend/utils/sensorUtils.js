// Import the number formatting utility
import { formatDecimal } from './numberUtils.js';

// Helper function to process a reading for current sensor values
export function processReadingForCurrentValues(reading) {
  const result = {
    deviceId: reading.deviceId,
    timestamp: reading.createdAt,
    sensors: {}
  };
  
  // Process each sensor type
  const sensorTypes = [
    { key: 'solar', path: 'solar' },
    { key: 'rain', path: 'rain' },
    { key: 'uv', path: 'uv' },
    { key: 'light', path: 'light' },
    { key: 'humidity', path: 'dht22', valueField: 'humidity' },
    { key: 'temperature', path: 'dht22', valueField: 'temperature' },
    { key: 'current', path: 'ina226', valueField: 'current' },
    { key: 'voltage', path: 'ina226', valueField: 'voltage' },
    { key: 'battery', path: 'battery' },
    { key: 'panel_temp', path: 'panel_temp' }
  ];
  
  for (const sensorType of sensorTypes) {
    const { key, path, valueField } = sensorType;
    result.sensors[key] = [];
    
    if (reading.readings[path] && reading.readings[path].length > 0) {
      reading.readings[path].forEach(sensor => {
        let value;
        if (valueField) {
          // For nested values like dht22.humidity
          value = formatDecimal(sensor[valueField].average);
        } else {
          // For direct values like solar, rain, etc.
          value = formatDecimal(sensor.average);
        }
        
        result.sensors[key].push({
          panelId: sensor.panelId,
          value: value,
          unit: valueField ? sensor[valueField].unit : sensor.unit
        });
      });
    }
  }
  
  return result;
} 
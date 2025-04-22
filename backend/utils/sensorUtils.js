// Import the number formatting utility
import { formatDecimal } from './numberUtils.js';

// Helper function to process a reading for current sensor values
export function processReadingForCurrentValues(reading, additionalData = {}) {
  const result = {
    deviceId: reading.deviceId,
    timestamp: reading.endTime,
    sensors: {}
  };
  
  // Process each sensor type
  const sensorTypes = [
    { key: 'solar', path: 'solar', includeInHealth: true },
    { key: 'rain', path: 'rain', includeInHealth: true },
    { key: 'uv', path: 'uv', includeInHealth: true },
    { key: 'light', path: 'light', includeInHealth: true },
    { key: 'humidity', path: 'dht22', valueField: 'humidity', includeInHealth: true },
    { key: 'temperature', path: 'dht22', valueField: 'temperature', includeInHealth: true },
    { key: 'current', path: 'ina226', valueField: 'current', includeInHealth: true },
    { key: 'voltage', path: 'ina226', valueField: 'voltage', includeInHealth: true },
    { key: 'battery', path: 'battery', includeInHealth: true },
    { key: 'panel_temp', path: 'panel_temp', includeInHealth: true },
    { key: 'actual_avg_power', path: 'actual_avg_power', includeInHealth: false },
    { key: 'predicted_avg_power', path: 'predicted_avg_power', includeInHealth: false },
    { key: 'actual_total_energy', path: 'actual_total_energy', isEnergyField: true, includeInHealth: false },
    { key: 'predicted_total_energy', path: 'predicted_total_energy', isEnergyField: true, includeInHealth: false }
  ];
  
  for (const sensorType of sensorTypes) {
    const { key, path, valueField, isEnergyField } = sensorType;
    result.sensors[key] = [];
    
    if (reading.readings[path] && reading.readings[path].length > 0) {
      reading.readings[path].forEach(sensor => {
        let value;
        let unit;
        
        if (valueField) {
          // For nested values like dht22.humidity
          value = formatDecimal(sensor[valueField].average);
          unit = sensor[valueField].unit;
        } else if (isEnergyField) {
          // For energy fields that use value instead of average
          value = formatDecimal(sensor.value);
          unit = sensor.unit;
        } else {
          // For direct values like solar, rain, etc.
          value = formatDecimal(sensor.average);
          unit = sensor.unit;
        }
        
        result.sensors[key].push({
          panelId: sensor.panelId,
          value: value,
          unit: unit
        });
      });
    }
  }
  
  // Merge any additional data (like power_accumulation) that might be passed in
  return { ...result, ...additionalData };
} 
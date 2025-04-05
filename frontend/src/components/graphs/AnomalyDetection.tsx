import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';

// Define sensor types
type SensorType = 
  | 'Rain'
  | 'Irradiance'
  | 'Humidity'
  | 'Temperature'
  | 'Panel Temperature'
  | 'UV'
  | 'Lux'
  | 'Panel Voltage'
  | 'Panel Current'
  | 'Battery Voltage';

// Sensor data interface
interface SensorData {
  timestamp: string;
  value: number;
  expected: number;
  deviation: number;
  isAnomaly: boolean;
}

// Mock data generator for sensor readings
const generateSensorData = (sensorType: SensorType, timePeriod: TimePeriod): SensorData[] => {
  // For 24h view, reduce to only show every other hour to prevent crowding
  const numberOfPoints = timePeriod === '24h' ? 12 : 
                        timePeriod === '7d' ? 28 : 
                        timePeriod === '30d' ? 30 : 45;
  
  // Sensor baseline values and units
  const baseValues = {
    'Rain': { base: 0, max: 10, unit: 'mm' },
    'Irradiance': { base: 600, max: 1200, unit: 'W/m²' },
    'Humidity': { base: 60, max: 100, unit: '%' },
    'Temperature': { base: 25, max: 40, unit: '°C' },
    'Panel Temperature': { base: 35, max: 70, unit: '°C' },
    'UV': { base: 5, max: 10, unit: 'UV index' },
    'Lux': { base: 50000, max: 120000, unit: 'lux' },
    'Panel Voltage': { base: 24, max: 48, unit: 'V' },
    'Panel Current': { base: 5, max: 15, unit: 'A' },
    'Battery Voltage': { base: 12, max: 24, unit: 'V' }
  };

  const { base, max } = baseValues[sensorType];
  
  // Generate data with occasional anomalies
  return Array.from({ length: numberOfPoints }, (_, i) => {
    // Create timestamp based on time period
    let timestamp;
    if (timePeriod === '24h') {
      // Use even hours for better spacing (2am, 4am, 6am, etc.)
      const hourValue = i * 2;
      const hour = hourValue % 12 || 12; // Convert 0 to 12
      const ampm = hourValue < 12 ? 'am' : 'pm';
      timestamp = `${hour}${ampm}`;
    } else if (timePeriod === '7d') {
      timestamp = `Day ${Math.floor(i / 4) + 1}`;
    } else if (timePeriod === '30d') {
      timestamp = `Day ${i + 1}`;
    } else {
      timestamp = `Week ${Math.floor(i / 7) + 1}`;
    }
    
    // Expected value with daily pattern
    const timeOfDay = i % 24;
    const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
    const dailyFactor = isDaytime ? 0.8 + (Math.sin((timeOfDay - 6) / 12 * Math.PI) * 0.2) : 0.3;
    
    const expected = base + (max - base) * dailyFactor;
    
    // Introduce random anomalies (about 10% of data points)
    const isAnomaly = Math.random() < 0.1;
    const anomalyFactor = isAnomaly ? (Math.random() > 0.5 ? 1.5 + Math.random() : 0.3 + Math.random() * 0.3) : 1;
    
    const value = expected * anomalyFactor * (0.95 + Math.random() * 0.1);
    const deviation = ((value - expected) / expected) * 100;
    
    return {
      timestamp,
      value: parseFloat(value.toFixed(2)),
      expected: parseFloat(expected.toFixed(2)),
      deviation: parseFloat(deviation.toFixed(2)),
      isAnomaly
    };
  });
};

// Component props interface
interface AnomalyDetectionProps {
  timePeriod?: TimePeriod;
}

const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ timePeriod = '24h' }) => {
  // List of all sensors
  const sensors: SensorType[] = [
    'Rain', 'Irradiance', 'Humidity', 'Temperature', 'Panel Temperature',
    'UV', 'Lux', 'Panel Voltage', 'Panel Current', 'Battery Voltage'
  ];
  
  // State for selected sensor
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('Irradiance');
  
  // Get sensor data for the selected sensor and time period
  const sensorData = generateSensorData(selectedSensor, timePeriod);
  
  // Calculate average values
  const average = {
    value: parseFloat((sensorData.reduce((sum, item) => sum + item.value, 0) / sensorData.length).toFixed(2)),
    expected: parseFloat((sensorData.reduce((sum, item) => sum + item.expected, 0) / sensorData.length).toFixed(2))
  };
  
  // Format for the tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md text-xs">
          <p className="font-semibold">{data.timestamp}</p>
          <p className="text-gray-600">Value: {data.value}</p>
          <p className="text-gray-600">Expected: {data.expected}</p>
          <p className={`${Math.abs(data.deviation) > 15 ? 'text-red-500' : 'text-gray-600'}`}>
            Deviation: {data.deviation.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sensor selector and stats */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="mb-2 md:mb-0">
          <select 
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value as SensorType)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            {sensors.map(sensor => (
              <option key={sensor} value={sensor}>{sensor}</option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-4 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-500">Average</span>
            <span className="font-medium">{average.value}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500">Expected Avg</span>
            <span className="font-medium">{average.expected}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500">Anomalies</span>
            <span className="font-medium">{sensorData.filter(d => d.isAnomaly).length}</span>
          </div>
        </div>
      </div>

      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, left: 25, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              name="Time" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              dataKey="value" 
              name="Value" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: selectedSensor, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <ZAxis 
              dataKey="deviation"
              range={[40, 400]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              name="Normal" 
              data={sensorData.filter(d => !d.isAnomaly)} 
              fill="#2196F3" 
            />
            <Scatter 
              name="Anomaly" 
              data={sensorData.filter(d => d.isAnomaly)} 
              fill="#F44336" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Normal Data</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Anomalies</span>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection; 
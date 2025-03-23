import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for panel performance comparison
const voltageData = [
  { time: '6am', panel1: 10.2, panel2: 10.1, anomaly: null },
  { time: '8am', panel1: 11.8, panel2: 11.6, anomaly: null },
  { time: '10am', panel1: 12.5, panel2: 12.3, anomaly: null },
  { time: '12pm', panel1: 12.8, panel2: 12.7, anomaly: 10.5 }, // Anomaly
  { time: '2pm', panel1: 12.7, panel2: 12.6, anomaly: null },
  { time: '4pm', panel1: 12.0, panel2: 11.9, anomaly: 10.2 }, // Anomaly
  { time: '6pm', panel1: 11.0, panel2: 10.9, anomaly: null },
];

const currentData = [
  { time: '6am', panel1: 1.5, panel2: 1.4, anomaly: null },
  { time: '8am', panel1: 2.8, panel2: 2.7, anomaly: null },
  { time: '10am', panel1: 3.5, panel2: 3.4, anomaly: null },
  { time: '12pm', panel1: 3.8, panel2: 3.7, anomaly: 1.2 }, // Anomaly
  { time: '2pm', panel1: 3.6, panel2: 3.5, anomaly: null },
  { time: '4pm', panel1: 3.0, panel2: 2.9, anomaly: 1.0 }, // Anomaly
  { time: '6pm', panel1: 2.0, panel2: 1.9, anomaly: null },
];

const powerData = [
  { time: '6am', panel1: 15, panel2: 14, anomaly: null },
  { time: '8am', panel1: 33, panel2: 31, anomaly: null },
  { time: '10am', panel1: 43, panel2: 41, anomaly: null },
  { time: '12pm', panel1: 48, panel2: 47, anomaly: 12 }, // Anomaly
  { time: '2pm', panel1: 45, panel2: 44, anomaly: null },
  { time: '4pm', panel1: 36, panel2: 34, anomaly: 10 }, // Anomaly
  { time: '6pm', panel1: 22, panel2: 21, anomaly: null },
];

// Units and limits for each metric
const metricConfig = {
  voltage: { unit: 'V', domain: [0, 15] },
  current: { unit: 'A', domain: [0, 5] },
  power: { unit: 'kW', domain: [0, 60] }
};

const PanelPerformance: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'voltage' | 'current' | 'power'>('power');
  
  // Get the data for the selected metric
  const getDataForMetric = () => {
    switch (selectedMetric) {
      case 'voltage': return voltageData;
      case 'current': return currentData;
      case 'power': return powerData;
      default: return powerData;
    }
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <select 
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as 'voltage' | 'current' | 'power')}
          className="py-1 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="power">Power (kW)</option>
          <option value="voltage">Voltage (V)</option>
          <option value="current">Current (A)</option>
        </select>
      </div>
      
      <div className="w-full aspect-[16/9]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getDataForMetric()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              domain={metricConfig[selectedMetric].domain}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: metricConfig[selectedMetric].unit, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
            />
            <Tooltip formatter={(value) => `${value} ${metricConfig[selectedMetric].unit}`} />
            <Line
              type="monotone"
              dataKey="panel1"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Panel 1"
            />
            <Line
              type="monotone"
              dataKey="panel2"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Panel 2"
            />
            <Line
              type="monotone"
              dataKey="anomaly"
              stroke="#F44336"
              strokeWidth={0}
              dot={{ r: 6, fill: "#F44336" }}
              name="Anomaly"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-1 space-x-4 text-sm text-gray-500 justify-center pt-3 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Panel 1</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Panel 2</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Anomaly</span>
        </div>
      </div>
    </div>
  );
};

export default PanelPerformance; 
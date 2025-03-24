import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for fault and anomaly detection
const anomalyData = [
  { hour: '6am', solarYield: 20, power: 18, size: 10 },
  { hour: '8am', solarYield: 30, power: 28, size: 20 },
  { hour: '10am', solarYield: 50, power: 47, size: 10 },
  { hour: '10am', solarYield: 50, power: 30, size: 40 }, // Anomaly
  { hour: '12pm', solarYield: 60, power: 58, size: 10 },
  { hour: '2pm', solarYield: 55, power: 52, size: 10 },
  { hour: '2pm', solarYield: 55, power: 25, size: 40 }, // Anomaly
  { hour: '4pm', solarYield: 40, power: 38, size: 10 },
  { hour: '6pm', solarYield: 20, power: 18, size: 10 },
];

const AnomalyDetection: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="solarYield" 
              name="Solar Yield" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 70]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              dataKey="power" 
              name="Power" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 70]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <ZAxis 
              dataKey="size"
              range={[40, 400]}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter 
              name="Solar Yield" 
              data={anomalyData.filter(d => d.size === 10)} 
              fill="#2196F3" 
            />
            <Scatter 
              name="Anomaly" 
              data={anomalyData.filter(d => d.size === 40)} 
              fill="#F44336" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-1 pb-3">
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
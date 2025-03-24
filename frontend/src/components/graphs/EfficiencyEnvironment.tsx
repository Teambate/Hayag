import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for environment vs efficiency
const envEfficiencyData = [
  { month: 'Jan', temperature: -20, efficiency: 60 },
  { month: 'Feb', temperature: -15, efficiency: 65 },
  { month: 'Mar', temperature: -5, efficiency: 70 },
  { month: 'Apr', temperature: 10, efficiency: 80 },
  { month: 'May', temperature: 20, efficiency: 85 },
  { month: 'Jun', temperature: 25, efficiency: 75 },
];

const EfficiencyEnvironment: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={envEfficiencyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false}
              domain={[-25, 30]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: '', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false}
              domain={[50, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: '', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2196F3" }}
              activeDot={{ r: 6 }}
              name="Temperature"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiency"
              stroke="#F06292"
              strokeWidth={2}
              dot={{ r: 4, fill: "#F06292" }}
              activeDot={{ r: 6 }}
              name="Efficiency"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-1 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Temperature (°C)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-pink-400 mr-1"></div>
          <span>Efficiency (%)</span>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyEnvironment; 
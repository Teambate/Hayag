import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for environment vs efficiency with multiple metrics
const envEfficiencyData = [
  { 
    month: 'Jan', 
    temperature: -20, 
    humidity: 65, 
    irradiance: 400, 
    efficiency: 60 
  },
  { 
    month: 'Feb', 
    temperature: -15, 
    humidity: 60, 
    irradiance: 450, 
    efficiency: 65 
  },
  { 
    month: 'Mar', 
    temperature: -5, 
    humidity: 55, 
    irradiance: 550, 
    efficiency: 70 
  },
  { 
    month: 'Apr', 
    temperature: 10, 
    humidity: 50, 
    irradiance: 700, 
    efficiency: 80 
  },
  { 
    month: 'May', 
    temperature: 20, 
    humidity: 60, 
    irradiance: 850, 
    efficiency: 85 
  },
  { 
    month: 'Jun', 
    temperature: 25, 
    humidity: 70, 
    irradiance: 900, 
    efficiency: 75 
  },
  { 
    month: 'Jul', 
    temperature: 30, 
    humidity: 75, 
    irradiance: 950, 
    efficiency: 70 
  },
];

const EfficiencyEnvironment: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={envEfficiencyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            {/* Left Y-Axis for temperature and humidity */}
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false}
              domain={[-30, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Temp (°C) / Humidity (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#6B7280' } }}
            />
            {/* Right Y-Axis for efficiency and irradiance */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false}
              domain={[0, 1000]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Efficiency (%) / Irradiance (W/m²)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12, fill: '#6B7280' } }}
            />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2196F3" }}
              activeDot={{ r: 6 }}
              name="Temperature °C"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity"
              stroke="#9C27B0"
              strokeWidth={2}
              dot={{ r: 4, fill: "#9C27B0" }}
              activeDot={{ r: 6 }}
              name="Humidity %"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiency"
              stroke="#F06292"
              strokeWidth={2}
              dot={{ r: 4, fill: "#F06292" }}
              activeDot={{ r: 6 }}
              name="Efficiency %"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="irradiance"
              stroke="#FF9800"
              strokeWidth={2}
              dot={{ r: 4, fill: "#FF9800" }}
              activeDot={{ r: 6 }}
              name="Irradiance W/m²"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap mt-1 space-x-3 text-sm text-gray-500 justify-center pt-3 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Temperature (°C)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span>Humidity (%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-pink-400 mr-1"></div>
          <span>Efficiency (%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span>Irradiance (W/m²)</span>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyEnvironment; 
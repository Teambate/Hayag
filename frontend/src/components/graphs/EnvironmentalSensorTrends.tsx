import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Mock data for environmental sensor trends
const sensorData = [
  { 
    name: 'Irradiance', 
    panel1: 900, 
    panel2: 850, 
    unit: 'W/m²' 
  },
  { 
    name: 'Rain', 
    panel1: 90, 
    panel2: 90, 
    unit: '%' 
  },
  { 
    name: 'UV', 
    panel1: 10, 
    panel2: 9, 
    unit: 'mW/cm²' 
  },
  { 
    name: 'Light', 
    panel1: 90, 
    panel2: 85, 
    unit: 'lx' 
  },
  { 
    name: 'Humidity', 
    panel1: 90, 
    panel2: 92, 
    unit: '%' 
  },
  { 
    name: 'Temperature', 
    panel1: 40, 
    panel2: 42, 
    unit: '°C' 
  }
];

const EnvironmentalSensorTrends: React.FC = () => {
  return (
    <div>
      <div className="w-full aspect-[16/9]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sensorData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            barGap={10}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              domain={[0, 'dataMax + 100']}
            />
            <Tooltip 
              formatter={(value, name) => {
                const item = sensorData.find(d => d.panel1 === value || d.panel2 === value);
                return [`${value} ${item?.unit || ''}`, name === 'panel1' ? 'Panel 1' : 'Panel 2'];
              }}
            />
            <Bar dataKey="panel1" fill="#4CAF50" name="Panel 1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="panel2" fill="#2196F3" name="Panel 2" radius={[4, 4, 0, 0]} />
          </BarChart>
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
      </div>
    </div>
  );
};

export default EnvironmentalSensorTrends; 
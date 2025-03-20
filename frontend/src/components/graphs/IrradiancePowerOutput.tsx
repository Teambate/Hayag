import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for irradiance vs power
const irradianceData = [
  { time: '6am', irradiance: 10, power: 8, size: 10 },
  { time: '8am', irradiance: 30, power: 25, size: 10 },
  { time: '10am', irradiance: 60, power: 50, size: 10 },
  { time: '12pm', irradiance: 80, power: 70, size: 10 },
  { time: '2pm', irradiance: 70, power: 65, size: 10 },
  { time: '4pm', irradiance: 40, power: 35, size: 10 },
  { time: '6pm', irradiance: 20, power: 15, size: 10 },
];

const IrradiancePowerOutput: React.FC = () => {
  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="irradiance" 
              name="Irradiance" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
            />
            <YAxis 
              dataKey="power" 
              name="Power Output" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
            />
            <ZAxis 
              dataKey="size"
              range={[40, 400]}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Panel 1" data={irradianceData} fill="#F44336" />
            <Scatter name="Panel 2" data={irradianceData.map(d => ({...d, power: d.power * 0.95}))} fill="#2196F3" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-4 space-x-4 text-sm text-gray-500 border-t border-gray-200 pt-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
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

export default IrradiancePowerOutput; 
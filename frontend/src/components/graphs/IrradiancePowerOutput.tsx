import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

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
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="irradiance" 
              name="Irradiance" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              dataKey="power" 
              name="Power Output" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <ZAxis 
              dataKey="size"
              range={[40, 400]}
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Panel 1" data={irradianceData} fill="#F44336" />
            <Scatter name="Panel 2" data={irradianceData.map(d => ({...d, power: d.power * 0.95}))} fill="#2196F3" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-1 space-x-4 text-sm text-gray-500 justify-center pt-3 pb-3">
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
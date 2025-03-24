import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Mock data for battery charge and discharge
const batteryData = [
  { time: '6AM', charge: 140, discharge: 100 },
  { time: '8AM', charge: 240, discharge: 150 },
  { time: '10AM', charge: 300, discharge: 200 },
  { time: '12PM', charge: 320, discharge: 250 },
  { time: '2PM', charge: 280, discharge: 260 },
  { time: '4PM', charge: 250, discharge: 210 },
  { time: '6PM', charge: 180, discharge: 170 },
  { time: '8PM', charge: 150, discharge: 160 },
];

const BatteryChargeDischarge: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={batteryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCharge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB547" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#FFB547" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDischarge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              domain={[0, 350]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickCount={5}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="charge"
              stroke="#FFB547"
              fillOpacity={1}
              fill="url(#colorCharge)"
              name="Charge"
            />
            <Area
              type="monotone"
              dataKey="discharge"
              stroke="#4CAF50"
              fillOpacity={1}
              fill="url(#colorDischarge)"
              name="Discharge"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-1 space-x-4 text-sm text-gray-500 justify-center pt-3 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
          <span>Charge Rate</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Discharge Rate</span>
        </div>
      </div>
    </div>
  );
};

export default BatteryChargeDischarge; 
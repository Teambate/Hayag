import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
//import { ThermometerIcon } from 'lucide-react';

// Mock data for panel temperature
const temperatureData = [
  { time: '6AM', temperature: 150 },
  { time: '8AM', temperature: 220 },
  { time: '10AM', temperature: 190 },
  { time: '12PM', temperature: 240 },
  { time: '2PM', temperature: 320 }, // Peak temperature
  { time: '4PM', temperature: 240 },
  { time: '6PM', temperature: 200 },
];

const PanelTemperature: React.FC = () => {
  return (
    <div>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={temperatureData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB547" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FFB547" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              domain={[0, 350]}
              tickCount={5}
            />
            <Tooltip />
            <ReferenceLine 
              y={280} 
              stroke="#FF5252" 
              strokeDasharray="3 3"
              label={{ value: 'Warning Threshold', position: 'top', fill: '#FF5252', fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#FFB547"
              fill="url(#colorTemp)"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 6, fill: '#FFB547' }}
            />
          </AreaChart>
        </ResponsiveContainer>

      </div>
      
      <div className="flex mt-4 text-sm text-gray-500 border-t border-gray-200 pt-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
          <span>Panel Temperature</span>
        </div>
      </div>
    </div>
  );
};

export default PanelTemperature; 
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock } from 'lucide-react';

// Mock data for battery charge
const batteryData = [
  { time: '6AM', battery1: 150, battery2: 170 },
  { time: '8AM', battery1: 170, battery2: 200 },
  { time: '10AM', battery1: 240, battery2: 210 },
  { time: '12PM', battery1: 280, battery2: 250 },
  { time: '2PM', battery1: 250, battery2: 290 },
  { time: '4PM', battery1: 220, battery2: 270 },
  { time: '6PM', battery1: 210, battery2: 250 },
];

const BatteryCharge: React.FC = () => {
  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={batteryData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorBattery1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB547" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FFB547" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBattery2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
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
            <Area
              type="monotone"
              dataKey="battery1"
              stroke="#FFB547"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBattery1)"
            />
            <Area
              type="monotone"
              dataKey="battery2"
              stroke="#4CAF50"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBattery2)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-4 space-x-4 text-sm text-gray-500 border-t border-gray-200 pt-3">
        <div className="flex items-center">
          <Clock size={16} className="mr-1" />
          <span>Time</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
          <span>Battery 1</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Battery 2</span>
        </div>
      </div>
    </div>
  );
};

export default BatteryCharge; 
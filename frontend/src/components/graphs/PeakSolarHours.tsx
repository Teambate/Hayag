import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for peak solar hours
const peakSolarData = [
  { day: 'Mon', peak: 140, offPeak: 60, total: 200 },
  { day: 'Tue', peak: 150, offPeak: 70, total: 220 },
  { day: 'Wed', peak: 170, offPeak: 90, total: 260 },
  { day: 'Thu', peak: 160, offPeak: 80, total: 240 },
  { day: 'Fri', peak: 150, offPeak: 60, total: 210 },
  { day: 'Sat', peak: 100, offPeak: 40, total: 140 },
  { day: 'Sun', peak: 80, offPeak: 30, total: 110 },
];

const PeakSolarHours: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={peakSolarData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              domain={[0, 'dataMax + 50']}
              label={{ value: 'Energy Output (kWh)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickCount={5}
            />
            <Tooltip />
            <Bar 
              dataKey="peak" 
              stackId="a" 
              fill="#FFB74D" 
              name="Peak Hours" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="offPeak" 
              stackId="a" 
              fill="#90CAF9" 
              name="Off-Peak Hours" 
              radius={[0, 0, 4, 4]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-1 space-x-4 text-sm text-gray-500 justify-center pt-3 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-400 mr-1"></div>
          <span>Peak Hours (9AM-3PM)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-300 mr-1"></div>
          <span>Off-Peak Hours</span>
        </div>
      </div>
    </div>
  );
};

export default PeakSolarHours; 
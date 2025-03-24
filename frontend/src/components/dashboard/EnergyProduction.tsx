import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { BatteryIcon, ZapIcon } from 'lucide-react';

// Mock data for the bar chart
const energyData = [
  { name: '6AM', value: 80 },
  { name: '8AM', value: 110 },
  { name: '10AM', value: 190 },
  { name: '12PM', value: 350 },
  { name: '2PM', value: 340 },
  { name: '4PM', value: 200 },
  { name: '6PM', value: 140 },
];

const EnergyProduction: React.FC = () => {
  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#81C784" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              domain={[0, 400]} 
              tickCount={5}
            />
            <Tooltip 
              cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
              formatter={(value) => [`${value} kWH`, 'Production']}
            />
            <Bar 
              dataKey="value" 
              fill="url(#colorEnergy)" 
              radius={[4, 4, 0, 0]} 
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
<<<<<<< Updated upstream:frontend/src/components/dashboard/EnergyProduction.tsx

      <div className="grid grid-cols-2 mt-6 border-t border-gray-200 pt-4">
        {/* Capacity */}
        <div className="flex items-center border-r border-gray-200 pr-4">
          <div className="bg-amber-100 p-2 rounded-full mr-3">
            <BatteryIcon className="text-amber-500" size={20} />
          </div>
          <div>
            <div className="text-sm text-gray-500">Capacity</div>
            <div className="text-xl font-semibold">220.0 kWH</div>
          </div>
        </div>

        {/* Total Yield */}
        <div className="flex items-center pl-4">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <ZapIcon className="text-green-500" size={20} />
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Yield</div>
            <div className="text-xl font-semibold">175.0 kWH</div>
          </div>
=======
      
      {/* Legend - No border and centered */}
      <div className="flex space-x-4 text-sm text-gray-500 justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Energy Output (kWh)</span>
>>>>>>> Stashed changes:frontend/src/components/graphs/EnergyProduction.tsx
        </div>
      </div>
    </div>
  );
};

export default EnergyProduction; 
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { BatteryIcon, ZapIcon } from 'lucide-react';

// Define the type for time period
export type TimePeriod = '24h' | '7d' | '30d' | '90d';

// Different mock data sets for different time periods
const energyDataSets = {
  '24h': [
    { name: '6AM', value: 80 },
    { name: '8AM', value: 110 },
    { name: '10AM', value: 190 },
    { name: '12PM', value: 350 },
    { name: '2PM', value: 340 },
    { name: '4PM', value: 200 },
    { name: '6PM', value: 140 },
  ],
  '7d': [
    { name: 'Mon', value: 1200 },
    { name: 'Tue', value: 1300 },
    { name: 'Wed', value: 1100 },
    { name: 'Thu', value: 1500 },
    { name: 'Fri', value: 1400 },
    { name: 'Sat', value: 1000 },
    { name: 'Sun', value: 900 },
  ],
  '30d': [
    { name: 'W1', value: 7500 },
    { name: 'W2', value: 8200 },
    { name: 'W3', value: 7800 },
    { name: 'W4', value: 8500 },
  ],
  '90d': [
    { name: 'Jan', value: 25000 },
    { name: 'Feb', value: 23000 },
    { name: 'Mar', value: 30000 },
  ],
};

// Component props interface
interface EnergyProductionProps {
  timePeriod?: TimePeriod;
}

const EnergyProduction: React.FC<EnergyProductionProps> = ({ timePeriod = '24h' }) => {
  // Get the correct data set based on the time period
  const energyData = energyDataSets[timePeriod];

  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
              domain={[0, 'auto']} 
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
      
      {/* Legend - No border and centered */}
      <div className="flex mt-1 space-x-4 text-sm text-gray-500 justify-center pt-1 pb-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Energy Output (kWh)</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyProduction; 
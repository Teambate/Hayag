import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';

// Different mock data sets for different time periods
const irradianceDataSets = {
  '24h': [
    { month: 'Jan', morning: 300, afternoon: 600 },
    { month: 'Feb', morning: 400, afternoon: 700 },
    { month: 'Mar', morning: 500, afternoon: 800 },
    { month: 'Apr', morning: 600, afternoon: 700 },
    { month: 'May', morning: 700, afternoon: 950 },
    { month: 'Jun', morning: 800, afternoon: 900 },
    { month: 'Jul', morning: 700, afternoon: 800 },
  ],
  '7d': [
    { month: 'Mon', morning: 350, afternoon: 650 },
    { month: 'Tue', morning: 450, afternoon: 750 },
    { month: 'Wed', morning: 550, afternoon: 850 },
    { month: 'Thu', morning: 650, afternoon: 750 },
    { month: 'Fri', morning: 750, afternoon: 980 },
    { month: 'Sat', morning: 850, afternoon: 950 },
    { month: 'Sun', morning: 750, afternoon: 850 },
  ],
  '30d': [
    { month: 'W1', morning: 1500, afternoon: 2200 },
    { month: 'W2', morning: 1700, afternoon: 2500 },
    { month: 'W3', morning: 1900, afternoon: 2800 },
    { month: 'W4', morning: 2100, afternoon: 3000 },
  ],
  '90d': [
    { month: 'Jan', morning: 5500, afternoon: 8800 },
    { month: 'Feb', morning: 6500, afternoon: 9500 },
    { month: 'Mar', morning: 7500, afternoon: 10200 },
  ]
};

// Component props interface
interface IrradianceGraphProps {
  timePeriod?: TimePeriod;
}

const IrradianceGraph: React.FC<IrradianceGraphProps> = ({ timePeriod = '24h' }) => {
  // Get the correct data set based on the time period
  const irradianceData = irradianceDataSets[timePeriod];
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={irradianceData}
            margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 'auto']}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickCount={5}
            />
            <Tooltip />
            <Bar
              dataKey="morning"
              fill="#FFE082"
              barSize={20}
              radius={[4, 4, 0, 0]}
              name="Morning"
            />
            <Bar
              dataKey="afternoon"
              fill="#81C784"
              barSize={20}
              radius={[4, 4, 0, 0]}
              name="Afternoon"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 text-sm text-gray-500 pt-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-200 mr-1"></div>
          <span>Morning</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
          <span>Afternoon</span>
        </div>
      </div>
    </div>
  );
};

export default IrradianceGraph; 
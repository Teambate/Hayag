import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { TimePeriod } from './EnergyProduction';

// Different mock data sets for different time periods
const temperatureDataSets = {
  '24h': [
    { panel: 'P1', morning: 60, afternoon: 80 },
    { panel: 'P2', morning: 65, afternoon: 85 },
    { panel: 'P3', morning: 55, afternoon: 75 },
    { panel: 'P4', morning: 62, afternoon: 82 },
  ],
  '7d': [
    { panel: 'Mon-P1', morning: 62, afternoon: 81 },
    { panel: 'Mon-P2', morning: 65, afternoon: 84 },
    { panel: 'Tue-P1', morning: 60, afternoon: 79 },
    { panel: 'Tue-P2', morning: 63, afternoon: 86 },
    { panel: 'Wed-P1', morning: 64, afternoon: 83 },
    { panel: 'Wed-P2', morning: 66, afternoon: 87 },
  ],
  '30d': [
    { panel: 'W1-Avg', morning: 63, afternoon: 82 },
    { panel: 'W2-Avg', morning: 65, afternoon: 85 },
    { panel: 'W3-Avg', morning: 61, afternoon: 80 },
    { panel: 'W4-Avg', morning: 64, afternoon: 83 },
  ],
  '90d': [
    { panel: 'Jan-Avg', morning: 58, afternoon: 78 },
    { panel: 'Feb-Avg', morning: 62, afternoon: 81 },
    { panel: 'Mar-Avg', morning: 66, afternoon: 85 },
  ],
};

// Component props interface
interface PanelTemperatureOverheatingProps {
  timePeriod?: TimePeriod;
}

const PanelTemperatureOverheating: React.FC<PanelTemperatureOverheatingProps> = ({ timePeriod = '24h' }) => {
  // Get the correct data set based on the time period
  const temperatureData = temperatureDataSets[timePeriod];
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={temperatureData} 
            margin={{ top: 5, right: 10, left: 5, bottom: 5 }} 
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="panel" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickCount={5}
            />
            <Tooltip />
            <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" 
              label={{  
                position: 'top', 
                fill: 'red',
                fontSize: 10
              }} 
            />
            <Bar dataKey="morning" fill="#81C784" name="Morning" radius={[4, 4, 0, 0]} />
            <Bar dataKey="afternoon" fill="#FFB74D" name="Afternoon" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-1 pb-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
          <span>Morning Temp</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-400 mr-1"></div>
          <span>Afternoon Temp</span>
        </div>
        <div className="flex items-center ml-4">
          <div className="w-3 h-3 border border-red-500 mr-1"></div>
          <span className="text-red-500">Warning Level</span>
        </div>
      </div>
    </div>
  );
};

export default PanelTemperatureOverheating; 
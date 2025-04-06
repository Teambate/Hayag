import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';

// Mock data for environment vs efficiency
const envEfficiencyDataDaily = [
  { month: 'Jan', temperature: -20, efficiency: 60 },
  { month: 'Feb', temperature: -15, efficiency: 65 },
  { month: 'Mar', temperature: -5, efficiency: 70 },
  { month: 'Apr', temperature: 10, efficiency: 80 },
  { month: 'May', temperature: 20, efficiency: 85 },
  { month: 'Jun', temperature: 25, efficiency: 75 },
];

// Different data sets for different time periods
const envEfficiencyDataSets = {
  '24h': envEfficiencyDataDaily.map(item => ({ ...item, month: ['6am', '8am', '10am', '12pm', '2pm', '4pm'][envEfficiencyDataDaily.indexOf(item) % 6] })),
  '7d': envEfficiencyDataDaily.map(item => ({ ...item, month: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][envEfficiencyDataDaily.indexOf(item) % 6] })),
  '30d': envEfficiencyDataDaily,
  '90d': envEfficiencyDataDaily.map(item => ({ ...item, month: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2'][envEfficiencyDataDaily.indexOf(item) % 6] })),
};

// Component props interface
interface EfficiencyEnvironmentProps {
  timePeriod?: TimePeriod;
  chartData?: any[];
}

// Helper to format timestamp as a readable string
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const EfficiencyEnvironment: React.FC<EfficiencyEnvironmentProps> = ({ timePeriod = '24h', chartData = [] }) => {
  // Transform API data format to chart format
  const transformedData = useMemo(() => {
    if (chartData.length === 0) {
      return envEfficiencyDataSets[timePeriod];
    }
    
    return chartData.map(item => ({
      month: formatTimestamp(item.timestamp),
      temperature: item.temperature?.value || 0,
      efficiency: item.energy?.value ? (item.energy.value * 100) : 0, // Convert to efficiency percentage
      humidity: item.humidity?.value || 0
    }));
  }, [chartData, timePeriod]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData} margin={{ top: 5, right: 25, left: 25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false}
              domain={[0, 50]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Efficiency (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip formatter={(value) => [value, '']} />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="temperature" 
              stroke="#FF8A65" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Temperature (°C)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="efficiency" 
              stroke="#64B5F6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Efficiency (%)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="humidity" 
              stroke="#81C784" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Humidity (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-1 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-400 mr-1"></div>
          <span>Temperature (°C)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
          <span>Efficiency (%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
          <span>Humidity (%)</span>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyEnvironment; 
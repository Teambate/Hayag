import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface EfficiencyEnvironmentProps {
  timePeriod?: TimePeriod;
  chartData?: any[];
}

const EfficiencyEnvironment: React.FC<EfficiencyEnvironmentProps> = ({ chartData = [] }) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(item => {
      // Handle both string and number timestamp formats
      return item.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Transform API data format to chart format
  const transformedData = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }
    
    return chartData.map(item => {
      const timestamp = item.timestamp?.toString() || '';
      return {
        month: formatTimestamp(timestamp, allTimestamps),
        temperature: item.temperature?.value || 0,
        efficiency: item.energy?.value ? (item.energy.value * 100) : 0, // Convert to efficiency percentage
        humidity: item.humidity?.value || 0
      };
    });
  }, [chartData, allTimestamps]);
  
  // If no data is available, display a message
  if (transformedData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <p className="text-gray-500">No efficiency vs environment data available</p>
      </div>
    );
  }
  
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
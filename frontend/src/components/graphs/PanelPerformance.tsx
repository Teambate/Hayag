import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';

// Mock data for panel performance comparison
const performanceData = [
  { time: '6am', panel1: 5, panel2: 4, anomaly: null },
  { time: '8am', panel1: 12, panel2: 11, anomaly: null },
  { time: '10am', panel1: 25, panel2: 23, anomaly: null },
  { time: '12pm', panel1: 35, panel2: 34, anomaly: 32 },
  { time: '2pm', panel1: 30, panel2: 31, anomaly: null },
  { time: '4pm', panel1: 20, panel2: 19, anomaly: 15 },
  { time: '6pm', panel1: 10, panel2: 9, anomaly: null },
];

// Different data sets for different time periods
const performanceDataSets = {
  '24h': performanceData,
  '7d': performanceData, // Use the same data for now, would be different in production
  '30d': performanceData, // Use the same data for now, would be different in production
  '90d': performanceData, // Use the same data for now, would be different in production
};

// Component props interface
interface PanelPerformanceProps {
  timePeriod?: TimePeriod;
}

const PanelPerformance: React.FC<PanelPerformanceProps> = ({ timePeriod = '24h' }) => {
  // Get the correct data set based on the time period
  const currentData = performanceDataSets[timePeriod];

  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData} margin={{ top: 5, right: 10, left: 25, bottom: 5 }}>
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
              domain={[0, 40]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Power Output (kW)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="panel1"
              stroke="#4CAF50"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Panel 1"
            />
            <Line
              type="monotone"
              dataKey="panel2"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Panel 2"
            />
            <Line
              type="monotone"
              dataKey="anomaly"
              stroke="#F44336"
              strokeWidth={0}
              dot={{ r: 6, fill: "#F44336" }}
              name="Anomaly"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Panel 1</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Panel 2</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Anomaly</span>
        </div>
      </div>
    </div>
  );
};

export default PanelPerformance; 
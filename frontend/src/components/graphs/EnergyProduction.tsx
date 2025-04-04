import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BatteryIcon, ZapIcon } from 'lucide-react';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';

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
  chartData?: ChartDataPoint[];
}

const EnergyProduction: React.FC<EnergyProductionProps> = ({ timePeriod = '24h', chartData = [] }) => {
  // Use real data if available, otherwise fallback to mock data
  const energyData = chartData.length > 0 
    ? chartData.map((point, index) => {
        // Format time for display using 24-hour format
        const time = new Date(point.timestamp.toString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Create an object with time and a data point for each panel
        const dataPoint: any = { time };
        
        // Add each panel's energy as a separate data key
        point.panels.forEach(panel => {
          const panelId = panel.panelId.replace('Panel_', '');
          dataPoint[`panel${panelId}`] = panel.energy;
        });
        
        return dataPoint;
      })
    : energyDataSets[timePeriod];

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : ['1', '2'];  // Default panel IDs if no data

  // Generate colors for each panel
  const panelColors = ['#4CAF50', '#81C784', '#2196F3', '#64B5F6', '#FFC107', '#FFD54F'];

  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energyData} margin={{ top: 5, right: 5, left: 25, bottom: 5 }}>
            <defs>
              {panelIds.map((panelId, index) => (
                <linearGradient key={panelId} id={`colorPanel${panelId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={panelColors[index % panelColors.length]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={panelColors[index % panelColors.length]} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey={chartData.length > 0 ? "time" : "name"} 
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
              label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip 
              cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
              formatter={(value, name) => {
                // Check if name is a string before using string methods
                const isPanel = typeof name === 'string' && name.startsWith('panel');
                const displayName = typeof name === 'string' 
                  ? (isPanel ? `Panel ${name.replace('panel', '')}` : name) 
                  : name; // Use name directly if it's not a string (e.g., a number)
                
                return [
                  `${value} kWh`, 
                  displayName
                ];
              }}
            />
            
            {/* If we have real data, render a Bar for each panel */}
            {chartData.length > 0 ? (
              panelIds.map((panelId, index) => (
                <Bar 
                  key={panelId}
                  dataKey={`panel${panelId}`} 
                  fill={`url(#colorPanel${panelId})`} 
                  radius={[4, 4, 0, 0]} 
                  barSize={30/panelIds.length}
                  name={`Panel ${panelId}`}
                />
              ))
            ) : (
              // Otherwise use the mock data format
              <Bar 
                dataKey="value" 
                fill="url(#colorEnergy)" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            )}
            
            {chartData.length > 0 && <Legend />}
            
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - No border and centered (only shown for mock data) */}
      {chartData.length === 0 && (
        <div className="flex mt-1 space-x-4 text-sm text-gray-500 justify-center pt-1 pb-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>Energy Output (kWh)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyProduction; 
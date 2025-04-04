import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TimePeriod } from './EnergyProduction';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';

// Different mock data sets for different time periods
const batteryDataSets = {
  '24h': [
    { time: '6AM', battery1: 12.6, battery2: 12.7 },
    { time: '8AM', battery1: 12.8, battery2: 12.9 },
    { time: '10AM', battery1: 13.2, battery2: 13.1 },
    { time: '12PM', battery1: 13.4, battery2: 13.3 },
    { time: '2PM', battery1: 13.5, battery2: 13.4 },
    { time: '4PM', battery1: 13.3, battery2: 13.2 },
    { time: '6PM', battery1: 13.1, battery2: 13.0 },
    { time: '8PM', battery1: 12.9, battery2: 12.8 },
  ],
  '7d': [
    { time: 'Mon', battery1: 12.7, battery2: 12.8 },
    { time: 'Tue', battery1: 12.9, battery2: 13.0 },
    { time: 'Wed', battery1: 13.1, battery2: 13.2 },
    { time: 'Thu', battery1: 13.3, battery2: 13.4 },
    { time: 'Fri', battery1: 13.1, battery2: 13.2 },
    { time: 'Sat', battery1: 12.9, battery2: 13.0 },
    { time: 'Sun', battery1: 12.7, battery2: 12.8 },
  ],
  '30d': [
    { time: 'W1', battery1: 12.8, battery2: 12.9 },
    { time: 'W2', battery1: 13.0, battery2: 13.1 },
    { time: 'W3', battery1: 12.9, battery2: 13.0 },
    { time: 'W4', battery1: 12.7, battery2: 12.8 },
  ],
  '90d': [
    { time: 'Jan', battery1: 12.9, battery2: 13.0 },
    { time: 'Feb', battery1: 13.1, battery2: 13.2 },
    { time: 'Mar', battery1: 12.8, battery2: 12.9 },
  ],
};

// Component props interface
interface BatteryChargeDischargeProps {
  timePeriod?: TimePeriod;
  chartData?: ChartDataPoint[];
}

const BatteryChargeDischarge: React.FC<BatteryChargeDischargeProps> = ({ timePeriod = '24h', chartData = [] }) => {
  // Use real data if available, otherwise fallback to mock data
  const batteryData = chartData.length > 0 
    ? chartData.map((point, index) => {
        // Format time for display using 24-hour format
        const time = new Date(point.timestamp.toString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Create an object with time and a data point for each panel
        const dataPoint: any = { time };
        
        // Add each panel's battery voltage as a separate data key
        point.panels.forEach(panel => {
          const panelId = panel.panelId.replace('Panel_', '');
          dataPoint[`battery${panelId}`] = panel.value;
        });
        
        return dataPoint;
      })
    : batteryDataSets[timePeriod];

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : ['1', '2'];  // Default panel IDs if no data

  // Determine unit from data or use default
  const unit = chartData.length > 0 && chartData[0].panels.length > 0 
    ? chartData[0].panels[0].unit 
    : 'V';

  // Line colors for each panel
  const panelColors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4'];
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={batteryData} 
            margin={{ top: 5, right: 5, left: 25, bottom: 5 }}
          >
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
              domain={[10, 14]}
              tickCount={5}
              label={{ value: `Voltage (${unit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip />
            
            {/* Map each panel to a Line */}
            {panelIds.map((panelId, index) => (
              <Line 
                key={panelId}
                type="monotone" 
                dataKey={`battery${panelId}`} 
                stroke={panelColors[index % panelColors.length]} 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={`Panel ${panelId}`}
              />
            ))}
            
            {chartData.length > 0 && <Legend />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - No border and centered (only shown for mock data) */}
      {chartData.length === 0 && (
        <div className="flex justify-center space-x-4 text-sm text-gray-500 pt-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span>Battery 1 (Panel 1)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span>Battery 2 (Panel 2)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatteryChargeDischarge; 
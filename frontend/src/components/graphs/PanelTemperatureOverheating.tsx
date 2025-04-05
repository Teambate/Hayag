import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from 'recharts';
import { TimePeriod } from './EnergyProduction';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';

// Different mock data sets for different time periods
const temperatureDataSets = {
  '24h': [
    { time: '12AM', panel1: 60, panel2: 80 },
    { time: '6AM', panel1: 65, panel2: 85 },
    { time: '12PM', panel1: 55, panel2: 75 },
    { time: '6PM', panel1: 62, panel2: 82 },
  ],
  '7d': [
    { time: 'Mon', panel1: 62, panel2: 81 },
    { time: 'Tue', panel1: 65, panel2: 84 },
    { time: 'Wed', panel1: 60, panel2: 79 },
    { time: 'Thu', panel1: 63, panel2: 86 },
    { time: 'Fri', panel1: 64, panel2: 83 },
    { time: 'Sat', panel1: 66, panel2: 87 },
    { time: 'Sun', panel1: 64, panel2: 85 },
  ],
  '30d': [
    { time: 'Week 1', panel1: 63, panel2: 82 },
    { time: 'Week 2', panel1: 65, panel2: 85 },
    { time: 'Week 3', panel1: 61, panel2: 80 },
    { time: 'Week 4', panel1: 64, panel2: 83 },
  ],
  '90d': [
    { time: 'Jan', panel1: 58, panel2: 78 },
    { time: 'Feb', panel1: 62, panel2: 81 },
    { time: 'Mar', panel1: 66, panel2: 85 },
  ],
};

// Component props interface
interface PanelTemperatureOverheatingProps {
  timePeriod?: TimePeriod;
  chartData?: ChartDataPoint[];
}

const PanelTemperatureOverheating: React.FC<PanelTemperatureOverheatingProps> = ({ timePeriod = '24h', chartData = [] }) => {
  // Use real data if available, otherwise fallback to mock data
  const temperatureData = chartData.length > 0 
    ? chartData.map((point) => {
        // Format time for display using 24-hour format
        const time = new Date(point.timestamp.toString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Create an object with time and a data point for each panel
        const dataPoint: any = { time };
        
        // Add each panel's temperature as a separate data key
        point.panels.forEach(panel => {
          const panelId = panel.panelId.replace('Panel_', '');
          dataPoint[`panel${panelId}`] = panel.value;
        });
        
        return dataPoint;
      })
    : temperatureDataSets[timePeriod];

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : ['1', '2'];  // Default panel IDs if no data

  // Determine unit from data or use default
  const unit = chartData.length > 0 && chartData[0].panels.length > 0 
    ? chartData[0].panels[0].unit 
    : '°C';

  // Bar colors for each panel
  const panelColors = ['#81C784', '#FFB74D', '#64B5F6', '#FF8A65', '#BA68C8', '#4DD0E1'];
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={temperatureData} 
            margin={{ top: 5, right: 10, left: 25, bottom: 5 }} 
            barGap={2}
          >
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
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickCount={5}
              label={{ value: `Temperature (${unit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip />
            <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" 
              label={{  
                position: 'top', 
                fill: 'red',
                fontSize: 10
              }} 
            />
            
            {/* Map each panel to a Bar */}
            {panelIds.map((panelId, index) => (
              <Bar 
                key={panelId}
                dataKey={`panel${panelId}`} 
                fill={panelColors[index % panelColors.length]} 
                name={`Panel ${panelId}`} 
                radius={[4, 4, 0, 0]}
                barSize={20} 
              />
            ))}
            
            {chartData.length > 0 && <Legend />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-1 pb-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
          <span>Panel 1</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-400 mr-1"></div>
          <span>Panel 2</span>
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
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';

// Component props interface
interface EnergyProductionProps {
  chartData: ChartDataPoint[]; // Make chartData required
}

const EnergyProduction: React.FC<EnergyProductionProps> = ({ chartData }) => {
  // Process real data
  const energyData = chartData.map((point) => {
    // Format time for display using 24-hour format
    const time = new Date(point.timestamp.toString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Create an object with time and a data point for each panel
    const dataPoint: any = { time };
    
    // Add each panel's energy as a separate data key
    point.panels.forEach(panel => {
      const panelId = panel.panelId.replace('Panel_', '');
      // Ensure energy value is a number, default to 0 if undefined
      dataPoint[`panel${panelId}`] = panel.energy ?? 0;
    });
    
    return dataPoint;
  });

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : []; 

  // Generate colors for each panel
  const panelColors = ['#4CAF50', '#81C784', '#2196F3', '#64B5F6', '#FFC107', '#FFD54F'];

  // Render nothing or a placeholder if there's no data or no panels
  if (!chartData || chartData.length === 0 || panelIds.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No energy data available</div>;
  }

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
              dataKey="time"
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
              formatter={(value: number, name: string | number) => {
                // Check if name is a string before using string methods
                const isPanel = typeof name === 'string' && name.startsWith('panel');
                const displayName = typeof name === 'string' 
                  ? (isPanel ? `Panel ${name.replace('panel', '')}` : name) 
                  : name; // Use name directly if it's not a string (e.g., a number)
                
                // Format the value to have more precision if it's small
                const formattedValue = value < 0.1 ? value.toFixed(4) : value.toFixed(2);

                return [
                  `${formattedValue} kWh`, 
                  displayName
                ];
              }}
            />
            
            {/* Render a Bar for each panel */} 
            {panelIds.map((panelId) => (
              <Bar 
                key={panelId}
                dataKey={`panel${panelId}`} 
                fill={`url(#colorPanel${panelId})`} 
                radius={[4, 4, 0, 0]} 
                // Adjust bar size based on number of panels
                barSize={Math.max(5, 30 / panelIds.length)} 
                name={`Panel ${panelId}`}
              />
            ))}
            
            <Legend />
            
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnergyProduction; 
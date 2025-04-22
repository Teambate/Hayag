import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';

// Component props interface
interface EnergyProductionProps {
  chartData: ChartDataPoint[]; // Make chartData required
}

export type TimePeriod = '24h' | '7d' | '30d' | '90d';

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
      // Add predicted energy values, ensure negative values fallback to 0
      dataPoint[`predicted${panelId}`] = (panel.predicted && panel.predicted > 0) ? panel.predicted : 0;
    });
    
    return dataPoint;
  });

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : []; 

  // Generate colors for each panel
  const panelColors = ['#3D9D40', '#81C784', '#2196F3', '#64B5F6', '#FFC107', '#FFD54F'];

  // Render nothing or a placeholder if there's no data or no panels
  if (!chartData || chartData.length === 0 || panelIds.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No energy data available</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={energyData} margin={{ top: 5, right: 5, left: 25, bottom: 5 }}>
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
                if (typeof name !== 'string') return [value.toFixed(2) + ' kWh', name];
                
                // Determine if it's a panel or predicted value
                const isPanelActual = name.startsWith('panel');
                const isPanelPredicted = name.startsWith('predicted');
                
                let displayName = name;
                
                if (isPanelActual) {
                  displayName = `Panel ${name.replace('panel', '')} (Actual)`;
                } else if (isPanelPredicted) {
                  displayName = `Panel ${name.replace('predicted', '')} (Predicted)`;
                }
                
                // Format the value to have more precision if it's small
                const formattedValue = value < 0.1 ? value.toFixed(4) : value.toFixed(2);

                return [
                  `${formattedValue} kWh`, 
                  displayName
                ];
              }}
            />
            
            {/* Render a Bar for each panel's actual energy */} 
            {panelIds.map((panelId) => (
              <Bar 
                key={`actual-${panelId}`}
                dataKey={`panel${panelId}`} 
                fill={`url(#colorPanel${panelId})`} 
                radius={[4, 4, 0, 0]} 
                // Adjust bar size based on number of panels
                barSize={Math.max(5, 30 / panelIds.length)} 
                name={`Panel ${panelId} (Actual)`}
              />
            ))}
            
            {/* Render a Line for each panel's predicted energy */}
            {panelIds.map((panelId, index) => (
              <Line
                key={`predicted-${panelId}`}
                type="monotone"
                dataKey={`predicted${panelId}`}
                stroke={panelColors[index % panelColors.length]}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name={`Panel ${panelId} (Predicted)`}
              />
            ))}
            
            <Legend />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnergyProduction; 
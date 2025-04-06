import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from 'recharts';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface PanelTemperatureOverheatingProps {
  chartData: ChartDataPoint[]; // Make chartData required
}

const PanelTemperatureOverheating: React.FC<PanelTemperatureOverheatingProps> = ({ chartData }) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(point => {
      // Handle both string and number timestamp formats
      return point.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Process real data
  const temperatureData = useMemo(() => {
    return chartData.map((point) => {
      // Format time based on timestamp intervals
      const timestamp = point.timestamp?.toString() || '';
      const time = formatTimestamp(timestamp, allTimestamps);
      
      // Create an object with time and a data point for each panel
      const dataPoint: any = { time };
      
      // Add each panel's temperature as a separate data key
      point.panels.forEach(panel => {
        const panelId = panel.panelId.replace('Panel_', '');
        dataPoint[`panel${panelId}`] = panel.value ?? 0;
      });
      
      return dataPoint;
    });
  }, [chartData, allTimestamps]);

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : [];

  // Determine unit from data or use default
  const unit = chartData.length > 0 && chartData[0].panels.length > 0 
    ? chartData[0].panels[0].unit 
    : '°C';

  // Bar colors for each panel
  const panelColors = ['#81C784', '#FFB74D', '#64B5F6', '#FF8A65', '#BA68C8', '#4DD0E1'];
  
  // Render nothing or a placeholder if there's no data or no panels
  if (!chartData || chartData.length === 0 || panelIds.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No temperature data available</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={temperatureData} 
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }} 
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
              // Dynamically set domain based on data, with padding
              domain={[
                0, // Always start Y-axis at 0 for temperature
                (dataMax: number) => Math.ceil(dataMax / 10) * 10 + 10 // Round up to next 10, add padding
              ]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickCount={5}
            />
            <Tooltip />
            <ReferenceLine 
              y={80} 
              stroke="#EF4444" 
              strokeDasharray="3 3" 
              label={{  
                value: `Warning (${80}${unit})`, // Add unit to warning label
                position: 'insideTopRight', 
                fill: '#EF4444',
                fontSize: 10,
                dy: -5 // Adjust vertical position
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
                // Adjust bar size based on number of panels
                barSize={Math.max(5, 20 / panelIds.length)} 
              />
            ))}
            
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PanelTemperatureOverheating; 
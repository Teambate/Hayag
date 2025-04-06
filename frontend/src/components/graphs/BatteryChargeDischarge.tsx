import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface BatteryChargeDischargeProps {
  chartData: ChartDataPoint[]; // Make chartData required
}

const BatteryChargeDischarge: React.FC<BatteryChargeDischargeProps> = ({ chartData }) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(point => {
      // Handle both string and number timestamp formats
      return point.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Process real data
  const batteryData = useMemo(() => {
    return chartData.map((point) => {
      // Format time based on timestamp intervals
      const timestamp = point.timestamp?.toString() || '';
      const time = formatTimestamp(timestamp, allTimestamps);
      
      // Create an object with time and a data point for each panel
      const dataPoint: any = { time };
      
      // Add each panel's battery voltage as a separate data key
      point.panels.forEach(panel => {
        const panelId = panel.panelId.replace('Panel_', '');
        dataPoint[`battery${panelId}`] = panel.value ?? 0;
      });
      
      return dataPoint;
    });
  }, [chartData, allTimestamps]);

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : [];


  // Line colors for each panel
  const panelColors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4'];
  
  // Render nothing or a placeholder if there's no data or no panels
  if (!chartData || chartData.length === 0 || panelIds.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No battery data available</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={batteryData} 
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
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
              // Dynamically set domain based on data, with padding
              domain={[
                (dataMin: number) => Math.max(0, Math.floor(dataMin) - 1),
                (dataMax: number) => Math.ceil(dataMax) + 1
              ]}
              tickCount={5}
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
            
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BatteryChargeDischarge; 
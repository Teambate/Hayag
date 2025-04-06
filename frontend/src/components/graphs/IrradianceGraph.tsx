import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface IrradianceGraphProps {
  chartData: ChartDataPoint[]; // Make chartData required
}

const IrradianceGraph: React.FC<IrradianceGraphProps> = ({ chartData }) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(point => {
      // Handle both string and number timestamp formats
      return point.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Process real data
  const irradianceData = useMemo(() => {
    return chartData.map((point) => {
      // Format time based on timestamp intervals
      const timestamp = point.timestamp?.toString() || '';
      const time = formatTimestamp(timestamp, allTimestamps);
      
      // Create an object with time and a data point for each panel
      const dataPoint: any = { time };
      
      // Add each panel's irradiance as a separate data key
      point.panels.forEach(panel => {
        const panelId = panel.panelId.replace('Panel_', '');
        dataPoint[`panel${panelId}`] = panel.value ?? 0;
      });
      
      // Also add average across all panels (optional, could be removed if not needed)
      // dataPoint.average = point.average.value;
      
      return dataPoint;
    });
  }, [chartData, allTimestamps]);

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : [];

  // Determine unit from data or use default

  // Bar colors for each panel
  const panelColors = ['#FFCA28', '#FFA726', '#FF7043', '#FFD54F', '#FFAB40', '#FFB300'];
  
  // Render nothing or a placeholder if there's no data or no panels
  if (!chartData || chartData.length === 0 || panelIds.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No irradiance data available</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={irradianceData} 
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
                0, // Always start Y-axis at 0 for irradiance
                (dataMax: number) => Math.ceil(dataMax / 100) * 100 + 100 // Round up to next 100, add padding
              ]}
              tickCount={5}
            />
            <Tooltip />
            {/* Render a Bar for each panel */}
            {panelIds.map((panelId, index) => (
              <Bar 
                key={panelId}
                dataKey={`panel${panelId}`} 
                fill={panelColors[index % panelColors.length]} 
                name={`Panel ${panelId}`}
                radius={[4, 4, 0, 0]} 
                // Adjust bar size based on number of panels
                barSize={Math.max(5, 15 / panelIds.length)} 
              />
            ))}
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IrradianceGraph; 
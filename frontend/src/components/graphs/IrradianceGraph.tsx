import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface IrradianceGraphProps {
  chartData: ChartDataPoint[]; // Make chartData required
  showAverageOnly?: boolean; // New prop to control display mode
  irradiancePowerData?: any[]; // Optional irradiancePower data for Analytics view
}

const IrradianceGraph: React.FC<IrradianceGraphProps> = ({ 
  chartData, 
  showAverageOnly = false,
  irradiancePowerData
}) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(point => {
      // Handle both string and number timestamp formats
      return point.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Process real data
  const irradianceData = useMemo(() => {
    // If we have irradiancePower data and showAverageOnly is true, use that instead
    if (irradiancePowerData && showAverageOnly) {
      return irradiancePowerData.map((point) => {
        // Format time based on timestamp intervals
        const timestamp = point.timestamp?.toString() || '';
        const time = formatTimestamp(timestamp, allTimestamps);
        
        return {
          time,
          averageIrradiance: point.irradiance?.value || 0,
          averagePower: point.power?.value || 0,
          irradianceUnit: point.irradiance?.unit || 'W/m²',
          powerUnit: point.power?.unit || 'W'
        };
      });
    }
    
    // Standard processing for Dashboard view (unchanged)
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
  }, [chartData, allTimestamps, irradiancePowerData, showAverageOnly]);

  // Get panel IDs from the first data point (if available)
  const panelIds = !showAverageOnly && chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : [];

  // Colors for bars
  const panelColors = ['#FFCA28', '#FFA726', '#FF7043', '#FFD54F', '#FFAB40', '#FFB300'];
  const averageColors = {
    irradiance: '#F59E0B', // Amber color for irradiance
    power: '#3B82F6'       // Blue color for power
  };
  
  // Render nothing or a placeholder if there's no data
  if ((!chartData || chartData.length === 0) && 
      (!irradiancePowerData || irradiancePowerData.length === 0)) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No irradiance data available</div>;
  }

  // If showing individual panels and no panels exist, show message
  if (!showAverageOnly && panelIds.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No panel data available</div>;
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
            
            {showAverageOnly ? (
              // Analytics view with dual Y-axes
              <>
                {/* Left Y-axis for irradiance */}
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100 + 100]}
                  tickCount={5}
                />
                {/* Right Y-axis for power */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  domain={[0, (dataMax: number) => Math.ceil(dataMax / 5) * 5 + 5]}
                  tickCount={5}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'averageIrradiance') {
                      return [`${value.toFixed(2)} W/m²`, 'Solar Irradiance'];
                    }
                    return [`${value.toFixed(2)} W`, 'Power Output'];
                  }}
                />
                {/* Bars for average values */}
                <Bar 
                  yAxisId="left"
                  dataKey="averageIrradiance" 
                  fill={averageColors.irradiance} 
                  name="Solar Irradiance"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="averagePower" 
                  fill={averageColors.power} 
                  name="Power Output"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </>
            ) : (
              // Dashboard view (unchanged)
              <>
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100 + 100]}
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
              </>
            )}
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IrradianceGraph; 
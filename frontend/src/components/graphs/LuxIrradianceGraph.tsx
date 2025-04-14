import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ScatterChart, Scatter } from 'recharts';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface LuxIrradianceGraphProps {
  chartData: any[]; // The luxIrradiance data from backend
  showPanels?: boolean; // Option to show panel-specific data
}

const LuxIrradianceGraph: React.FC<LuxIrradianceGraphProps> = ({ 
  chartData, 
  showPanels = true
}) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(point => {
      return point.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Process the data for the chart
  const processedData = useMemo(() => {
    return chartData.map((point) => {
      // Format time based on timestamp intervals
      const timestamp = point.timestamp?.toString() || '';
      const time = formatTimestamp(timestamp, allTimestamps);
      
      return {
        time,
        luxValue: point.lux?.value || 0,
        irradianceValue: point.irradiance?.value || 0,
        luxUnit: point.lux?.unit || 'lux',
        irradianceUnit: point.irradiance?.unit || 'W/m²',
        panels: point.panels || []
      };
    });
  }, [chartData, allTimestamps]);

  // Calculate max values for Y axis scaling
  const maxLux = useMemo(() => {
    const max = Math.max(...processedData.map(d => d.luxValue));
    return max > 0 ? Math.ceil(max / 1000) * 1000 : 1000; // Round up to nearest 1000
  }, [processedData]);

  const maxIrradiance = useMemo(() => {
    const max = Math.max(...processedData.map(d => d.irradianceValue));
    return max > 0 ? Math.ceil(max / 100) * 100 : 100; // Round up to nearest 100
  }, [processedData]);

  // Colors for the chart
  const chartColors = {
    lux: '#22C55E', // Green for lux
    irradiance: '#F59E0B' // Amber for irradiance
  };
  
  // Render nothing or a placeholder if there's no data
  if (!chartData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No lux/irradiance data available</div>;
  }

  // Custom tooltip to show both values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded text-sm">
          <p className="font-semibold mb-1">{label}</p>
          <div className="space-y-1">
            <p style={{ color: chartColors.lux }}>
              Light Intensity: {payload[0].value.toLocaleString()} lux
            </p>
            <p style={{ color: chartColors.irradiance }}>
              Solar Irradiance: {payload[1].value.toLocaleString()} W/m²
            </p>
            {showPanels && payload[0].payload.panels && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="font-semibold text-gray-600 mb-1">Panel Data:</p>
                {payload[0].payload.panels.map((panel: any) => (
                  <div key={panel.panelId} className="flex justify-between text-xs">
                    <span className="text-gray-600">{panel.panelId}:</span>
                    <span>{panel.lux.toLocaleString()} lux / {panel.irradiance.toLocaleString()} W/m²</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={processedData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }}
            />
            
            {/* Left Y-axis for lux values */}
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              domain={[0, maxLux]}
              tickCount={5}
              tickFormatter={(value) => value.toLocaleString()}
            />
            
            {/* Right Y-axis for irradiance values */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              domain={[0, maxIrradiance]}
              tickCount={5}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Bars for lux values */}
            <Bar 
              yAxisId="left"
              dataKey="luxValue" 
              fill={chartColors.lux} 
              name="Light Intensity (lux)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            
            {/* Bars for irradiance values */}
            <Bar 
              yAxisId="right"
              dataKey="irradianceValue" 
              fill={chartColors.irradiance} 
              name="Solar Irradiance (W/m²)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LuxIrradianceGraph; 
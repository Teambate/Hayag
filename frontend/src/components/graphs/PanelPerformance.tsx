import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface PanelPerformanceProps {
  timePeriod?: TimePeriod;
  chartData?: any[];
}

const PanelPerformance: React.FC<PanelPerformanceProps> = ({ chartData = [] }) => {
  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(item => {
      // Handle both string and number timestamp formats
      return item.timestamp?.toString() || '';
    });
  }, [chartData]);

  // Transform API data format to chart format
  const transformedData = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }
    
    // Transform the data from the API to a format that Recharts can handle
    return chartData.map(item => {
      const timestamp = item.timestamp?.toString() || '';
      const result: any = {
        time: formatTimestamp(timestamp, allTimestamps),
        // Add average if available
        average: item.average?.value || 0
      };
      
      // Map each panel's energy to a property like panel1, panel2, etc.
      if (item.panels && Array.isArray(item.panels)) {
        item.panels.forEach((panel: { panelId: string, energy: number }) => {
          // Extract panel number from panelId (e.g., "Panel_1" -> "1")
          let panelNumber;
          if (panel.panelId.includes('Panel_')) {
            panelNumber = panel.panelId.split('_')[1];
          } else if (panel.panelId.startsWith('Panel ')) {
            panelNumber = panel.panelId.split(' ')[1];
          } else {
            panelNumber = panel.panelId;
          }
          
          // Add panel data to result
          result[`panel${panelNumber}`] = panel.energy;
        });
      }
      
      return result;
    });
  }, [chartData, allTimestamps]);
  
  // Dynamically determine which panel lines to show based on data
  const panelKeys = useMemo(() => {
    if (transformedData.length === 0) return [];
    
    // Get all keys that start with 'panel'
    const allKeys = Object.keys(transformedData[0]);
    return allKeys.filter(key => key.startsWith('panel'));
  }, [transformedData]);
  
  // Define panel colors
  const panelColors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#3F51B5'];

  // If no data is available, display a message
  if (transformedData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <p className="text-gray-500">No panel performance data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData} margin={{ top: 5, right: 10, left: 25, bottom: 5 }}>
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
              domain={[0, 'auto']}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip formatter={(value) => [value, '']} />
            
            {/* Render a line for each panel dynamically */}
            {panelKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={panelColors[index % panelColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={`Panel ${key.replace('panel', '')}`}
              />
            ))}
            
            {/* Average line */}
            <Line
              type="monotone"
              dataKey="average"
              stroke="#757575"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Average"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center pt-6">
        {panelKeys.map((key, index) => (
          <div key={key} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-1" 
              style={{ backgroundColor: panelColors[index % panelColors.length] }}
            ></div>
            <span>Panel {key.replace('panel', '')}</span>
          </div>
        ))}
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
          <span>Average</span>
        </div>
      </div>
    </div>
  );
};

export default PanelPerformance; 
import React, { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area } from 'recharts';
import { formatTimestamp } from '../../utils/dateUtils';

// Component props interface
interface PanelPerformanceProps {
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
        // Add total values if available
        totalEnergy: item.total?.energy || 0,
        totalPredicted: item.total?.predicted || 0
      };
      
      // Map each panel's energy and predicted values
      if (item.panels && Array.isArray(item.panels)) {
        item.panels.forEach((panel: { panelId: string, energy: number, predicted: number }) => {
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
          result[`panel${panelNumber}Predicted`] = panel.predicted || 0;
        });
      }
      
      return result;
    });
  }, [chartData, allTimestamps]);
  
  // Dynamically determine which panel lines to show based on data
  const panelKeys = useMemo(() => {
    if (transformedData.length === 0) return [];
    
    // Get all keys that start with 'panel' but don't include 'Predicted'
    const allKeys = Object.keys(transformedData[0]);
    return allKeys.filter(key => key.startsWith('panel') && !key.includes('Predicted'));
  }, [transformedData]);
  
  // Define panel colors
  const panelColors = ['#EA9010', '#358260', '#FF9800', '#9C27B0', '#F44336', '#3F51B5'];

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
          <ComposedChart data={transformedData} margin={{ top: 5, right: 10, left: 25, bottom: 5 }}>
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
            <Tooltip 
              formatter={(value, name) => {
                // Format name for tooltip - handle type safety
                const nameStr = String(name);
                if (nameStr.includes('Predicted')) {
                  const panel = nameStr.replace('Predicted', '');
                  return [value, `${panel} (Predicted)`];
                }
                return [value, `${nameStr} (Actual)`];
              }} 
            />
            
            {/* Render area charts for actual energy values */}
            {panelKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={panelColors[index % panelColors.length]}
                fill={panelColors[index % panelColors.length]}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={`Panel ${key.replace('panel', '')}`}
              />
            ))}
            
            {/* Render lines for predicted energy values */}
            {panelKeys.map((key, index) => (
              <Line
                key={`${key}Predicted`}
                type="monotone"
                dataKey={`${key}Predicted`}
                stroke={panelColors[index % panelColors.length]}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={`${key}Predicted`}
              />
            ))}
            
            {/* Total average line - hide if showing individual panels */}
            {panelKeys.length <= 1 && (
              <Area
                type="monotone"
                dataKey="totalEnergy"
                stroke="#757575"
                fill="#757575"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                name="Total Actual"
              />
            )}
            
            {/* Total predicted line - hide if showing individual panels */}
            {panelKeys.length <= 1 && (
              <Line
                type="monotone"
                dataKey="totalPredicted"
                stroke="#757575"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Total Predicted"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center pt-6">
        {panelKeys.map((key, index) => (
          <React.Fragment key={key}>
            <div className="flex items-center">
              <div 
                className="w-6 h-2 mr-1" 
                style={{ 
                  backgroundColor: panelColors[index % panelColors.length],
                  borderRadius: '1px' 
                }}
              ></div>
              <span>Panel {key.replace('panel', '')} (Actual)</span>
            </div>
            <div className="flex items-center">
              <div 
                className="w-6 h-0 mr-1 border-t-2" 
                style={{ 
                  borderColor: panelColors[index % panelColors.length],
                  borderStyle: 'dashed'
                }}
              ></div>
              <span>Panel {key.replace('panel', '')} (Predicted)</span>
            </div>
          </React.Fragment>
        ))}
        
        {panelKeys.length <= 1 && (
          <>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
              <span>Total Actual</span>
            </div>
            <div className="flex items-center">
              <div 
                className="w-6 h-0 mr-1 border-t-2" 
                style={{ 
                  borderColor: "#757575",
                  borderStyle: 'dashed'
                }}
              ></div>
              <span>Total Predicted</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PanelPerformance; 
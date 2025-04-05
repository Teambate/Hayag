import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TimePeriod } from './EnergyProduction';
import { ChartDataPoint } from '../../hooks/useDashboardCharts';

// Different mock data sets for different time periods
const irradianceDataSets = {
  '24h': [
    { time: '6AM', irradiance: 0 },
    { time: '8AM', irradiance: 600 },
    { time: '10AM', irradiance: 900 },
    { time: '12PM', irradiance: 1200 },
    { time: '2PM', irradiance: 1000 },
    { time: '4PM', irradiance: 650 },
    { time: '6PM', irradiance: 250 },
    { time: '8PM', irradiance: 0 },
  ],
  '7d': [
    { time: 'Mon', irradiance: 780 },
    { time: 'Tue', irradiance: 890 },
    { time: 'Wed', irradiance: 650 },
    { time: 'Thu', irradiance: 910 },
    { time: 'Fri', irradiance: 870 },
    { time: 'Sat', irradiance: 820 },
    { time: 'Sun', irradiance: 750 },
  ],
  '30d': [
    { time: 'W1', irradiance: 850 },
    { time: 'W2', irradiance: 900 },
    { time: 'W3', irradiance: 860 },
    { time: 'W4', irradiance: 790 },
  ],
  '90d': [
    { time: 'Jan', irradiance: 800 },
    { time: 'Feb', irradiance: 870 },
    { time: 'Mar', irradiance: 920 },
  ],
};

// Component props interface
interface IrradianceGraphProps {
  timePeriod?: TimePeriod;
  chartData?: ChartDataPoint[];
}

const IrradianceGraph: React.FC<IrradianceGraphProps> = ({ timePeriod = '24h', chartData = [] }) => {
  // Use real data if available, otherwise fallback to mock data
  const irradianceData = chartData.length > 0 
    ? chartData.map((point) => {
        // Format time for display using 24-hour format
        const time = new Date(point.timestamp.toString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Create an object with time and a data point for each panel
        const dataPoint: any = { time };
        
        // Add each panel's irradiance as a separate data key
        point.panels.forEach(panel => {
          const panelId = panel.panelId.replace('Panel_', '');
          dataPoint[`panel${panelId}`] = panel.value;
        });
        
        // Also add average across all panels
        dataPoint.average = point.average.value;
        
        return dataPoint;
      })
    : irradianceDataSets[timePeriod];

  // Get panel IDs from the first data point (if available)
  const panelIds = chartData.length > 0 && chartData[0].panels 
    ? chartData[0].panels.map(panel => panel.panelId.replace('Panel_', '')) 
    : ['1', '2'];  // Default panel IDs if no data

  // Determine unit from data or use default
  const unit = chartData.length > 0 && chartData[0].panels.length > 0 
    ? chartData[0].panels[0].unit 
    : 'W/m²';

  // Bar colors for each panel
  const panelColors = ['#FFCA28', '#FFA726', '#FF7043', '#FFD54F', '#FFAB40', '#FFB300'];
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={irradianceData} 
            margin={{ top: 5, right: 5, left: 20, bottom: 5 }}
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
              domain={[0, 'dataMax + 100']}
              tickCount={5}
              label={{ value: `Irradiance (${unit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 } }}
            />
            <Tooltip />
            {chartData.length > 0 ? (
              // If we have real data, render a Bar for each panel
              <>
                {panelIds.map((panelId, index) => (
                  <Bar 
                    key={panelId}
                    dataKey={`panel${panelId}`} 
                    fill={panelColors[index % panelColors.length]} 
                    name={`Panel ${panelId}`}
                    radius={[4, 4, 0, 0]} 
                    barSize={15}
                  />
                ))}
                <Legend />
              </>
            ) : (
              // Otherwise use the mock data format
              <Bar 
                dataKey="irradiance" 
                fill="#FFC107" 
                name="Irradiance"
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - Only shown for mock data */}
      {chartData.length === 0 && (
        <div className="flex items-center justify-center pt-1 text-sm text-gray-500">
          <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
          <span>Solar Irradiance (W/m²)</span>
        </div>
      )}
    </div>
  );
};

export default IrradianceGraph; 
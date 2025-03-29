import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { TimePeriod } from './EnergyProduction';

// Mock data for peak solar hours with trend indicators
const peakSolarDataDaily = [
  { day: 'Mon', value: 276, label: 'kWh', trend: 'up' },
  { day: 'Tue', value: 282, label: 'kWh', trend: 'up' },
  { day: 'Wed', value: 297, label: 'kWh', highlight: true, trend: 'up' },
  { day: 'Thu', value: 269, label: 'kWh', trend: 'down' },
  { day: 'Fri', value: 274, label: 'kWh', trend: 'up' },
  { day: 'Sat', value: 175, label: 'kWh', trend: 'down' },
  { day: 'Sun', value: 138, label: 'kWh', trend: 'down' },
];

// Different data sets for different time periods
const peakSolarDataSets = {
  '24h': peakSolarDataDaily.map(item => ({ ...item, label: 'Wh' })), // Smaller scale for hourly
  '7d': peakSolarDataDaily,
  '30d': peakSolarDataDaily.map(item => ({ ...item, value: item.value * 4, label: 'kWh' })), // Scaled up for weekly
  '90d': peakSolarDataDaily.map(item => ({ ...item, day: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][peakSolarDataDaily.indexOf(item)], value: item.value * 15, label: 'kWh' })), // Different labels and scale for monthly
};

// Component props interface
interface PeakSolarHoursProps {
  timePeriod?: TimePeriod;
}

const PeakSolarHours: React.FC<PeakSolarHoursProps> = ({ timePeriod = '24h' }) => {
  // Get the correct data set based on the time period
  const peakSolarData = peakSolarDataSets[timePeriod];
  
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 flex-grow">
        {peakSolarData.map((day, index) => (
          <div key={index} className="text-center flex flex-col border-r last:border-r-0 border-gray-200 relative">
            {/* Day header */}
            <div className={`text-lg font-medium py-3 flex items-center justify-center gap-1 ${day.highlight ? 'text-amber-500' : 'text-gray-600'}`}>
              {day.day}
              {day.trend === 'up' ? (
                <ArrowUp className={`h-4 w-4 ${day.highlight ? 'text-amber-500' : 'text-gray-400'}`} />
              ) : (
                <ArrowDown className={`h-4 w-4 text-gray-400`} />
              )}
            </div>
            
            {/* Value section with integrated highlight */}
            <div className="flex-grow flex flex-col items-center">
              <div className="flex-1 flex items-center justify-center flex-col">
                <div className={`text-2xl font-bold ${day.highlight ? 'text-amber-500' : 'text-gray-700'}`}>
                  {day.value}
                </div>
                <div className={`text-sm pb-1 ${day.highlight ? 'text-amber-500' : 'text-gray-500'}`}>
                  {day.label}
                </div>
              </div>
              
              {/* Bottom highlight bar connected to the label */}
              <div className={`w-full h-[30px] ${day.highlight ? 'bg-amber-200' : 'bg-gray-200'}`}></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-200 mr-1"></div>
          <span>Normal Day</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-200 mr-1"></div>
          <span>Peak Day</span>
        </div>
      </div>
    </div>
  );
};

export default PeakSolarHours; 
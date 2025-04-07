import React, { useMemo, useRef } from 'react';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimePeriod } from './EnergyProduction';
import { formatTimestamp, determineTimeFormat } from '../../utils/dateUtils';

// Component props interface
interface PeakSolarHoursProps {
  timePeriod?: TimePeriod;
  chartData?: any[];
}

// Helper to format hour as a readable string
const formatHour = (hour: number): string => {
  return hour === 0 || hour === 24 ? '12am' :
         hour === 12 ? '12pm' :
         hour < 12 ? `${hour}am` :
         `${hour - 12}pm`;
};

const PeakSolarHours: React.FC<PeakSolarHoursProps> = ({ chartData = [] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll left
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  // Function to scroll right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Extract all timestamps for interval determination
  const allTimestamps = useMemo(() => {
    return chartData.map(item => {
      // Use timestamp property if it exists, otherwise use the numeric timestamp
      return typeof item.timestamp === 'string' 
        ? item.timestamp 
        : item.timestamp || item.timestamp;
    });
  }, [chartData]);

  // Determine the time format based on the interval between timestamps
  const timeFormatInfo = useMemo(() => {
    return determineTimeFormat(allTimestamps);
  }, [allTimestamps]);

  // Check if timestamps span multiple days
  const isDailyData = useMemo(() => {
    if (chartData.length < 2) return false;
    
    // If we have hour field in data, check the timestamp dates
    if (chartData[0].hour !== undefined) {
      const dates = chartData.map(item => {
        const timestamp = item.timestamp?.toString() || '';
        return new Date(timestamp).toDateString();
      });
      
      // Check if all dates are the same
      const firstDate = dates[0];
      return !dates.every(date => date === firstDate);
    }
    
    return timeFormatInfo.type === 'day' || timeFormatInfo.type === 'month';
  }, [chartData, timeFormatInfo]);

  // Transform API data format to chart format
  const transformedData = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }
    
    // Find the highest energy value to highlight it
    let maxEnergy = 0;
    let maxIndex = -1;
    
    chartData.forEach((item, index) => {
      if (item.average && item.average.value > maxEnergy) {
        maxEnergy = item.average.value;
        maxIndex = index;
      }
    });
    
    // Transform the data to match expected format
    return chartData.map((item, index) => {
      const averageValue = item.average?.value || 0;
      const unit = item.average?.unit || 'kWh';
      
      // Format the time display based on data type
      let timeDisplay;

      // If data has hour field and we're not in daily mode, use hour format
      if (item.hour !== undefined && !isDailyData) {
        timeDisplay = formatHour(item.hour);
      } else {
        // For daily data or data without hour field, use timestamp formatting
        const timestamp = item.timestamp?.toString() || '';
        timeDisplay = formatTimestamp(timestamp, allTimestamps);
      }
      
      // Determine trend (simple logic: higher than previous is 'up')
      const prevItem = index > 0 ? chartData[index - 1] : null;
      const prevValue = prevItem?.average?.value || 0;
      const trend = averageValue >= prevValue ? 'up' : 'down';
      
      return {
        day: timeDisplay,
        value: parseFloat(averageValue.toFixed(2)),
        label: unit,
        trend: trend,
        highlight: index === maxIndex
      };
    });
  }, [chartData, allTimestamps, timeFormatInfo, isDailyData]);
  
  // If no data is available, display a message
  if (transformedData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <p className="text-gray-500">No peak solar hours data available</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-grow flex flex-col justify-between">
        {/* Arrow navigation buttons */}
        <button 
          onClick={scrollLeft} 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md rounded-r-full p-1"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        
        <div className="overflow-x-auto pb-1 flex-grow flex flex-col" ref={scrollContainerRef}>
          <div className="flex flex-nowrap min-w-full h-full">
            {transformedData.map((day, index) => (
              <div key={index} className="text-center flex flex-col border-r last:border-r-0 border-gray-200 relative min-w-[100px] flex-grow">
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
                <div className="flex-grow flex flex-col items-center justify-between">
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
        </div>
        
        <button 
          onClick={scrollRight} 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md rounded-l-full p-1"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
      </div>
      
      {/* Legend */}
      <div className="flex space-x-4 text-sm text-gray-500 justify-center pt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-200 mr-1"></div>
          <span>Normal Hour</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-200 mr-1"></div>
          <span>Peak Hour</span>
        </div>
      </div>
    </div>
  );
};

export default PeakSolarHours; 
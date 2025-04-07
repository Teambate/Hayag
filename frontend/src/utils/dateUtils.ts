/**
 * Utility functions for handling date and time formatting in charts
 */

/**
 * Determines the appropriate time format based on the interval between timestamps
 * @param timestamps - Array of timestamp strings or numbers
 * @returns Object with interval type and formatting function
 */
export const determineTimeFormat = (timestamps: (string | number)[]) => {
  if (!timestamps || timestamps.length < 2) {
    return {
      type: 'day',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };
  }

  // Convert timestamps to Date objects and sort them
  const dates = timestamps
    .map(ts => new Date(ts))
    .sort((a, b) => a.getTime() - b.getTime());

  // Calculate intervals between timestamps in hours
  const intervals = [];
  for (let i = 1; i < dates.length; i++) {
    const intervalMs = dates[i].getTime() - dates[i - 1].getTime();
    const intervalHours = intervalMs / (1000 * 60 * 60);
    intervals.push(intervalHours);
  }
  
  // Count how many intervals are 24 hours (with small tolerance)
  const dailyIntervals = intervals.filter(interval => Math.abs(interval - 24) <= 0.01);
  const mostlyDaily = dailyIntervals.length >= Math.floor(intervals.length / 2);
  
  // Calculate average interval
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  
  // Check if timestamps represent different days
  const isDailyOrLonger = dates.some((date, i) => {
    if (i === 0) return false;
    const prevDate = dates[i - 1];
    return (
      date.getDate() !== prevDate.getDate() || 
      date.getMonth() !== prevDate.getMonth() || 
      date.getFullYear() !== prevDate.getFullYear()
    );
  });

  // Force daily format if timestamps span multiple days
  if (isDailyOrLonger) {
    // If the intervals are mostly 24 hours, show only date without time
    if (mostlyDaily) {
      return {
        type: 'day',
        format: (timestamp: string | number) => {
          const date = new Date(timestamp);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      };
    }
    
    // If the intervals are not 24 hours but span multiple days, show both date and time
    return {
      type: 'dateTime',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
               date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    };
  }

  // For timestamps within the same day
  if (avgInterval < 1) {
    // Less than 1 hour interval - show hours and minutes
    return {
      type: 'minute',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    };
  } else if (avgInterval < 24) {
    // Less than 24 hours interval - show hours only
    return {
      type: 'hour',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    };
  } else {
    // Default to daily format if calculation is uncertain
    return {
      type: 'day',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };
  }
};

/**
 * Format a timestamp according to a specified format
 * @param timestamp - Timestamp string or number
 * @param timestamps - Array of all timestamps for interval determination
 * @returns Formatted time string
 */
export const formatTimestamp = (timestamp: string | number, timestamps: (string | number)[] = []) => {
  const { format } = determineTimeFormat(timestamps);
  return format(timestamp);
}; 
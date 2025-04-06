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

  // Calculate average interval between timestamps in milliseconds
  let totalInterval = 0;
  for (let i = 1; i < dates.length; i++) {
    totalInterval += dates[i].getTime() - dates[i - 1].getTime();
  }
  const avgInterval = totalInterval / (dates.length - 1);

  // Convert to hours
  const hourInterval = avgInterval / (1000 * 60 * 60);

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
    // If spanning more than a month, show month/year format
    if (hourInterval > 24 * 30) {
      return {
        type: 'month',
        format: (timestamp: string | number) => {
          const date = new Date(timestamp);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
      };
    }
    
    // If spanning more than a week but less than a month, show month/day
    if (hourInterval > 24 * 7) {
      return {
        type: 'day',
        format: (timestamp: string | number) => {
          const date = new Date(timestamp);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      };
    }
    
    // If spanning multiple days but less than a week, show day of week
    return {
      type: 'day',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      }
    };
  }

  // For timestamps within the same day
  if (hourInterval < 1) {
    // Less than 1 hour interval - show hours and minutes
    return {
      type: 'minute',
      format: (timestamp: string | number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    };
  } else if (hourInterval < 24) {
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
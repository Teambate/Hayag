// Time utility functions for sensor data

/**
 * Convert time interval string to milliseconds
 * @param {string} intervalString - Time interval (5min, 10min, 15min, 30min, hourly, daily)
 * @returns {number} Time interval in milliseconds
 */
export function getTimeIntervalInMs(intervalString) {
  switch (intervalString) {
    case '5min':
      return 5 * 60 * 1000;
    case '10min':
      return 10 * 60 * 1000;
    case '15min':
      return 15 * 60 * 1000;
    case '30min':
      return 30 * 60 * 1000;
    case 'hourly':
      return 60 * 60 * 1000;
    case 'daily':
      return 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // Default to 15 minutes
  }
}

/**
 * Get start and end of a day in UTC
 * @param {Date} date - Date to get start/end for
 * @returns {Object} Object with startOfDay and endOfDay properties
 */
export function getDayBoundaries(date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
} 
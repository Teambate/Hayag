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

/**
 * Convert a date string or Date object to UTC
 * @param {string|Date} dateInput - Date to convert
 * @param {string} [clientTimezone] - Client timezone (IANA format, e.g., 'America/New_York')
 * @returns {Date} Date object in UTC
 */
export function toUTC(dateInput, clientTimezone) {
  const date = new Date(dateInput);
  
  // If no timezone provided, assume local date is already correct
  if (!clientTimezone) {
    return date;
  }
  
  try {
    // Calculate the offset between client timezone and UTC
    const clientOffset = new Date().getTimezoneOffset();
    
    // Create a new date using the client's timezone
    const targetDate = new Date(date.toLocaleString('en-US', {
      timeZone: clientTimezone
    }));
    
    // Get the timezone offset for the target timezone
    const targetOffset = new Date(date.toLocaleString('en-US', {
      timeZone: clientTimezone
    })).getTimezoneOffset();
    
    // Calculate the difference between the two timezones
    const offsetDiff = targetOffset - clientOffset;
    
    // Create a UTC date representing the same local time in the target timezone
    return new Date(date.getTime() - offsetDiff * 60 * 1000);
  } catch (error) {
    console.error(`Error converting timezone: ${error.message}`);
    return date; // Return original date if conversion fails
  }
}

/**
 * Get start of day for a specific date in client's timezone
 * @param {Date} date - Date to get start of day for
 * @param {string} [clientTimezone] - Client timezone (IANA format, e.g., 'America/New_York')
 * @returns {Date} Start of day in UTC
 */
export function getStartOfDay(date, clientTimezone) {
  // Use Asia/Manila as default if no timezone specified
  const timezone = clientTimezone || "Asia/Manila";

  try {
    // First convert the date to the client's local time representation
    const clientDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    // Set to midnight in client's timezone
    clientDate.setHours(0, 0, 0, 0);
    
    // Now we need to convert this local midnight back to the equivalent UTC time
    // Calculate timezone offsets
    const localOffset = new Date().getTimezoneOffset();
    const targetOffset = new Date(new Date().toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
    const offsetDiff = targetOffset - localOffset;
    
    // Apply offset to get correct UTC time that represents midnight in client's timezone
    return new Date(clientDate.getTime() - offsetDiff * 60 * 1000);
  } catch (error) {
    console.error(`Error in getStartOfDay: ${error.message}`);
    // Fallback to original date with UTC midnight
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
  }
}

/**
 * Get end of day for a specific date in client's timezone
 * @param {Date} date - Date to get end of day for
 * @param {string} [clientTimezone] - Client timezone (IANA format, e.g., 'America/New_York')
 * @returns {Date} End of day in UTC
 */
export function getEndOfDay(date, clientTimezone) {
  // Use Asia/Manila as default if no timezone specified
  const timezone = clientTimezone || "Asia/Manila";

  try {
    // First convert the date to the client's local time representation
    const clientDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    // Set to end of day in client's timezone
    clientDate.setHours(23, 59, 59, 999);
    
    // Now we need to convert this local end of day back to the equivalent UTC time
    // Calculate timezone offsets
    const localOffset = new Date().getTimezoneOffset();
    const targetOffset = new Date(new Date().toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
    const offsetDiff = targetOffset - localOffset;
    
    // Apply offset to get correct UTC time that represents end of day in client's timezone
    return new Date(clientDate.getTime() - offsetDiff * 60 * 1000);
  } catch (error) {
    console.error(`Error in getEndOfDay: ${error.message}`);
    // Fallback to original date with UTC end of day
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23, 59, 59, 999
    ));
  }
} 
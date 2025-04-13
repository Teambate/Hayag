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
    // Create date string with explicit timezone
    const dateString = date.toLocaleString('en-US', { 
      timeZone: clientTimezone
    });
    
    // Parse the date string back to a date with the client's timezone offset
    const clientDate = new Date(dateString);
    
    // Return a date object that represents this time in UTC
    return clientDate;
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
  if (!clientTimezone) {
    // If no timezone specified, use UTC
    const utcDate = new Date(date);
    return new Date(Date.UTC(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      0, 0, 0, 0
    ));
  }

  try {
    // Convert the date to the client's timezone
    const dateInClientTZ = new Date(date.toLocaleString('en-US', {
      timeZone: clientTimezone
    }));
    
    // Set to midnight in client's timezone
    dateInClientTZ.setHours(0, 0, 0, 0);
    
    // Calculate the timezone offset between client time and UTC
    const clientOffset = new Date().getTimezoneOffset();
    const targetTZDate = new Date();
    targetTZDate.setHours(0);
    const targetOffset = new Date(targetTZDate.toLocaleString('en-US', {
      timeZone: clientTimezone
    })).getTimezoneOffset();
    
    // Apply the timezone difference to get the correct UTC time
    const offsetDiff = targetOffset - clientOffset;
    const correctedDate = new Date(dateInClientTZ.getTime() - offsetDiff * 60 * 1000);
    
    return correctedDate;
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
  if (!clientTimezone) {
    // If no timezone specified, use UTC
    const utcDate = new Date(date);
    return new Date(Date.UTC(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      23, 59, 59, 999
    ));
  }

  try {
    // Convert the date to the client's timezone
    const dateInClientTZ = new Date(date.toLocaleString('en-US', {
      timeZone: clientTimezone
    }));
    
    // Set to end of day in client's timezone
    dateInClientTZ.setHours(23, 59, 59, 999);
    
    // Calculate the timezone offset between client time and UTC
    const clientOffset = new Date().getTimezoneOffset();
    const targetTZDate = new Date();
    targetTZDate.setHours(0);
    const targetOffset = new Date(targetTZDate.toLocaleString('en-US', {
      timeZone: clientTimezone
    })).getTimezoneOffset();
    
    // Apply the timezone difference to get the correct UTC time
    const offsetDiff = targetOffset - clientOffset;
    const correctedDate = new Date(dateInClientTZ.getTime() - offsetDiff * 60 * 1000);
    
    return correctedDate;
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
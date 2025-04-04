/**
 * Format a decimal number based on its magnitude
 * - For regular numbers: returns up to 2 decimal places
 * - For very small numbers: preserves significant digits
 * 
 * @param {number} value - The number to format
 * @param {number} [decimalPlaces=2] - Maximum decimal places to show for regular numbers
 * @param {number} [significantDigits=6] - Maximum significant digits to show for very small numbers
 * @returns {number} - The formatted number
 */
export function formatDecimal(value, decimalPlaces = 2, significantDigits = 6) {
  if (value === null || value === undefined || isNaN(value)) {
    return value;
  }
  
  // For zero
  if (value === 0) {
    return 0;
  }
  
  // For very small numbers (magnitude < 0.01), preserve significant digits
  if (Math.abs(value) < 0.01 && value !== 0) {
    return parseFloat(value.toFixed(significantDigits - 1 - Math.floor(Math.log10(Math.abs(value)))));
  }
  
  // For regular numbers, return up to maxDecimalPlaces
  return parseFloat(value.toFixed(decimalPlaces));
}

/**
 * Format an object containing numeric values
 * Recursively goes through objects and arrays to format all numbers
 * 
 * @param {Object|Array} data - The data structure to format
 * @param {number} [decimalPlaces=2] - Maximum decimal places to show for regular numbers
 * @param {number} [significantDigits=6] - Maximum significant digits to show for very small numbers
 * @returns {Object|Array} - A new object with all numeric values formatted
 */
export function formatNumericValues(data, decimalPlaces = 2, significantDigits = 6) {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'number') {
    return formatDecimal(data, decimalPlaces, significantDigits);
  }
  
  // Check if the data is a Date object
  if (data instanceof Date) {
    return data; // Return Date objects directly
  }
  
  if (Array.isArray(data)) {
    return data.map(item => formatNumericValues(item, decimalPlaces, significantDigits));
  }
  
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      result[key] = formatNumericValues(data[key], decimalPlaces, significantDigits);
    }
    return result;
  }
  
  return data;
} 
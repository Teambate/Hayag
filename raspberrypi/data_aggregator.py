import csv
import json
import math
import time
import asyncio
import aiohttp
from datetime import datetime, timedelta
import pytz
import os
import logging
import dateutil.parser

# This does not and should not modify the csv file.

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('data_aggregator')

# Constants
CSV_FILENAME = "sensor_data.csv"
DEVICE_ID = "SOLAR_01"
AGGREGATION_PERIOD_MINUTES = 5
TIMEZONE = "Asia/Manila"
BACKEND_URL = "http://192.168.1.66:3000"  # Changed from HTTPS to HTTP
BACKEND_API_URL = f"{BACKEND_URL}/api/readings"
AUTH_API_URL = f"{BACKEND_URL}/api/auth/login"
# Auth credentials
AUTH_EMAIL = "irahansdedicatoria@gmail.com"
AUTH_PASSWORD = "12345678"
LAST_PROCESSED_TIMESTAMP_FILE = "last_processed_timestamp.txt"
# Auth token storage
AUTH_TOKEN = None

def is_valid(value):
    """Check if a value is valid (not NaN, None, or empty string)"""
    if isinstance(value, str) and not value:
        return False
    try:
        float_val = float(value)
        return not (math.isnan(float_val) or math.isinf(float_val))
    except (ValueError, TypeError):
        return False

def initialize_last_valid_values():
    """
    Scan the CSV file for the most recent valid values for each sensor.
    This ensures forward filling works even at the start of processing.
    """
    last_valid_values = {
        'rain_1': None, 'rain_2': None,
        'uv_1': None, 'uv_2': None,
        'lux_1': None, 'lux_2': None,
        'dht_temp_1': None, 'dht_humidity_1': None,
        'dht_temp_2': None, 'dht_humidity_2': None,
        'panel_temp_1': None, 'panel_temp_2': None,
        'panel_voltage_1': None, 'panel_current_1': None,
        'panel_voltage_2': None, 'panel_current_2': None,
        'solar_irrad_1': None, 'solar_irrad_2': None,
        'battery_voltage_1': None, 'battery_voltage_2': None
    }
    
    # Get the timestamp we're starting from
    start_timestamp = get_last_processed_timestamp()
    
    if not os.path.exists(CSV_FILENAME) or os.path.getsize(CSV_FILENAME) == 0:
        logger.warning(f"CSV file {CSV_FILENAME} doesn't exist or is empty for initializing values")
        return last_valid_values
    
    try:
        with open(CSV_FILENAME, 'r') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)  # Skip header row
            
            # Store all rows with timestamps before our start point
            prior_rows = []
            for row in reader:
                if len(row) < 22:  # Skip incomplete rows
                    continue
                    
                try:
                    row_time = datetime.strptime(f"{row[0]} {row[1]}", "%Y-%m-%d %I:%M:%S %p")
                    if row_time < start_timestamp:
                        prior_rows.append((row_time, row))
                except ValueError:
                    # Skip rows with invalid date/time format
                    continue
            
            # Sort rows by timestamp, newest first
            prior_rows.sort(reverse=True, key=lambda x: x[0])
            
            # Go through rows from newest to oldest, updating last_valid_values
            # for any sensors that don't yet have a value
            for _, row in prior_rows:
                # Check if all values are filled - if so, we're done
                if all(v is not None for v in last_valid_values.values()):
                    break
                
                # Process each sensor value with validation rules
                sensor_mappings = [
                    ('rain_1', row[2], 0, 100),
                    ('rain_2', row[12], 0, 100),
                    ('uv_1', row[3], 0, 15),
                    ('uv_2', row[13], 0, 15),
                    ('lux_1', row[4], 0, 120000),
                    ('lux_2', row[14], 0, 120000),
                    ('dht_temp_1', row[5], 10, 60),
                    ('dht_temp_2', row[15], 10, 60),
                    ('dht_humidity_1', row[6], 0, 100),
                    ('dht_humidity_2', row[16], 0, 100),
                    ('panel_temp_1', row[7], 0, None),
                    ('panel_temp_2', row[17], 0, None),
                    ('panel_voltage_1', row[8], 0, None),
                    ('panel_voltage_2', row[18], 0, None),
                    ('panel_current_1', row[9], 0, None),
                    ('panel_current_2', row[19], 0, None),
                    ('solar_irrad_1', row[10], 0, 1800),
                    ('solar_irrad_2', row[20], 0, 1800),
                    ('battery_voltage_1', row[11], 0, None),
                    ('battery_voltage_2', row[21], 0, None)
                ]
                
                for key, value, min_val, max_val in sensor_mappings:
                    # Only process if we don't have a value for this sensor yet
                    if last_valid_values[key] is None:
                        valid_value = validate_and_convert(value, min_val, max_val)
                        if valid_value is not None:
                            last_valid_values[key] = valid_value
            
            logger.info(f"Initialized forward-fill values from CSV: {sum(1 for v in last_valid_values.values() if v is not None)}/{len(last_valid_values)} sensors have values")
    
    except Exception as e:
        logger.error(f"Error initializing last valid values from CSV: {e}")
    
    return last_valid_values

def clean_data(rows):
    """
    Clean the data by removing invalid entries and converting to proper types.
    Apply range validation based on specified rules and forward fill null values.
    """
    cleaned_rows = []
    
    # Initialize last valid values from CSV history
    last_valid_values = initialize_last_valid_values()
    
    for row in rows:
        # Skip rows with incomplete data
        if len(row) < 22:  # We expect at least 22 columns based on the original CSV
            continue
            
        cleaned_row = {}
        cleaned_row['timestamp'] = datetime.strptime(f"{row[0]} {row[1]}", "%Y-%m-%d %I:%M:%S %p")
        
        # Process each sensor value with proper validation rules
        
        # Rain Readings - 0-100%
        rain_1 = validate_and_convert(row[2], min_val=0, max_val=100)
        rain_2 = validate_and_convert(row[12], min_val=0, max_val=100)
        
        # UV readings - 0-15 mW/cm²
        uv_1 = validate_and_convert(row[3], min_val=0, max_val=15)
        uv_2 = validate_and_convert(row[13], min_val=0, max_val=15)
        
        # Lux - 0-120000 lux
        lux_1 = validate_and_convert(row[4], min_val=0, max_val=120000)
        lux_2 = validate_and_convert(row[14], min_val=0, max_val=120000)
        
        # DHT Temperature - 10-60°C
        dht_temp_1 = validate_and_convert(row[5], min_val=10, max_val=60)
        dht_temp_2 = validate_and_convert(row[15], min_val=10, max_val=60)
        
        # DHT Humidity - 0-100%
        dht_humidity_1 = validate_and_convert(row[6], min_val=0, max_val=100)
        dht_humidity_2 = validate_and_convert(row[16], min_val=0, max_val=100)
        
        # Panel Temp - above 0°C
        panel_temp_1 = validate_and_convert(row[7], min_val=0)
        panel_temp_2 = validate_and_convert(row[17], min_val=0)
        
        # Panel Voltage - above 0V
        panel_voltage_1 = validate_and_convert(row[8], min_val=0)
        panel_voltage_2 = validate_and_convert(row[18], min_val=0)
        
        # Panel Current - above 0mA
        panel_current_1 = validate_and_convert(row[9], min_val=0)
        panel_current_2 = validate_and_convert(row[19], min_val=0)
        
        # Irradiance - 0-1800 W/m²
        solar_irrad_1 = validate_and_convert(row[10], min_val=0, max_val=1800)
        solar_irrad_2 = validate_and_convert(row[20], min_val=0, max_val=1800)
        
        # Battery Voltage - above 0V
        battery_voltage_1 = validate_and_convert(row[11], min_val=0)
        battery_voltage_2 = validate_and_convert(row[21], min_val=0)
        
        # Update last valid values for forward filling
        sensor_values = {
            'rain_1': rain_1, 'rain_2': rain_2,
            'uv_1': uv_1, 'uv_2': uv_2,
            'lux_1': lux_1, 'lux_2': lux_2,
            'dht_temp_1': dht_temp_1, 'dht_humidity_1': dht_humidity_1,
            'dht_temp_2': dht_temp_2, 'dht_humidity_2': dht_humidity_2,
            'panel_temp_1': panel_temp_1, 'panel_temp_2': panel_temp_2,
            'panel_voltage_1': panel_voltage_1, 'panel_current_1': panel_current_1,
            'panel_voltage_2': panel_voltage_2, 'panel_current_2': panel_current_2,
            'solar_irrad_1': solar_irrad_1, 'solar_irrad_2': solar_irrad_2,
            'battery_voltage_1': battery_voltage_1, 'battery_voltage_2': battery_voltage_2
        }
        
        # Forward fill null values and update last valid values
        for key, value in sensor_values.items():
            if value is not None:
                # Valid value, update the last valid value 
                last_valid_values[key] = value
                cleaned_row[key] = value
            else:
                # Invalid value, use forward fill from last valid
                cleaned_row[key] = last_valid_values[key]  # May still be None if no valid value seen yet
                if last_valid_values[key] is not None:
                    logger.debug(f"Forward filling {key} with value {last_valid_values[key]}")
                
        cleaned_rows.append(cleaned_row)
    
    return cleaned_rows

def validate_and_convert(value, min_val=None, max_val=None):
    """
    Validates and converts a value based on specified range constraints.
    Returns 0 if value is empty/null, or returns None if the value is outside allowed range.
    """
    # Handle empty or null values by returning 0
    if not value or value == "":
        return 0.0
        
    try:
        # Convert to float and validate range
        float_val = float(value)
        
        # Check for NaN or infinite values
        if math.isnan(float_val) or math.isinf(float_val):
            return 0.0  # Use 0 for NaN or infinite values
            
        # Validate minimum if specified
        if min_val is not None and float_val < min_val:
            return 0.0  # Use 0 for values below minimum
            
        # Validate maximum if specified
        if max_val is not None and float_val > max_val:
            return 0.0  # Use 0 for values above maximum
            
        return float_val
    except (ValueError, TypeError):
        return 0.0  # Use 0 for values that can't be converted to float

def calculate_stat(values):
    """
    Calculate statistics (average, min, max) for a list of values.
    Also calculates health as the percentage of valid values.
    """
    # Count total values including None/null values
    total_values = len(values)
    
    # Filter to only valid values
    valid_values = [v for v in values if v is not None]
    valid_count = len(valid_values)
    
    # Calculate health as percentage of valid values
    health = int((valid_count / total_values) * 100) if total_values > 0 else 0
    
    if not valid_values:
        return {
            "average": None,
            "min": None,
            "max": None,
            "health": health
        }
    
    return {
        "average": sum(valid_values) / valid_count,
        "min": min(valid_values),
        "max": max(valid_values),
        "health": health
    }

def aggregate_data(cleaned_data):
    """Aggregate the cleaned data into the required format"""
    # Extract values for each sensor
    rain_1_values = [row.get('rain_1') for row in cleaned_data]
    rain_2_values = [row.get('rain_2') for row in cleaned_data]
    
    uv_1_values = [row.get('uv_1') for row in cleaned_data]
    uv_2_values = [row.get('uv_2') for row in cleaned_data]
    
    lux_1_values = [row.get('lux_1') for row in cleaned_data]
    lux_2_values = [row.get('lux_2') for row in cleaned_data]
    
    dht_temp_1_values = [row.get('dht_temp_1') for row in cleaned_data]
    dht_humidity_1_values = [row.get('dht_humidity_1') for row in cleaned_data]
    dht_temp_2_values = [row.get('dht_temp_2') for row in cleaned_data]
    dht_humidity_2_values = [row.get('dht_humidity_2') for row in cleaned_data]
    
    panel_temp_1_values = [row.get('panel_temp_1') for row in cleaned_data]
    panel_temp_2_values = [row.get('panel_temp_2') for row in cleaned_data]
    
    panel_voltage_1_values = [row.get('panel_voltage_1') for row in cleaned_data]
    panel_current_1_values = [row.get('panel_current_1') for row in cleaned_data]
    panel_voltage_2_values = [row.get('panel_voltage_2') for row in cleaned_data]
    panel_current_2_values = [row.get('panel_current_2') for row in cleaned_data]
    
    solar_irrad_1_values = [row.get('solar_irrad_1') for row in cleaned_data]
    solar_irrad_2_values = [row.get('solar_irrad_2') for row in cleaned_data]
    
    battery_voltage_1_values = [row.get('battery_voltage_1') for row in cleaned_data]
    battery_voltage_2_values = [row.get('battery_voltage_2') for row in cleaned_data]
    
    # Calculate statistics
    rain_1_stats = calculate_stat(rain_1_values)
    rain_2_stats = calculate_stat(rain_2_values)
    
    uv_1_stats = calculate_stat(uv_1_values)
    uv_2_stats = calculate_stat(uv_2_values)
    
    lux_1_stats = calculate_stat(lux_1_values)
    lux_2_stats = calculate_stat(lux_2_values)
    
    dht_temp_1_stats = calculate_stat(dht_temp_1_values)
    dht_humidity_1_stats = calculate_stat(dht_humidity_1_values)
    dht_temp_2_stats = calculate_stat(dht_temp_2_values)
    dht_humidity_2_stats = calculate_stat(dht_humidity_2_values)
    
    panel_temp_1_stats = calculate_stat(panel_temp_1_values)
    panel_temp_2_stats = calculate_stat(panel_temp_2_values)
    
    panel_voltage_1_stats = calculate_stat(panel_voltage_1_values)
    panel_current_1_stats = calculate_stat(panel_current_1_values)
    panel_voltage_2_stats = calculate_stat(panel_voltage_2_values)
    panel_current_2_stats = calculate_stat(panel_current_2_values)
    
    solar_irrad_1_stats = calculate_stat(solar_irrad_1_values)
    solar_irrad_2_stats = calculate_stat(solar_irrad_2_values)
    
    battery_voltage_1_stats = calculate_stat(battery_voltage_1_values)
    battery_voltage_2_stats = calculate_stat(battery_voltage_2_values)
    
    # Create the aggregated data structure according to the expected format
    readings = {
        "rain": [
            {
                "panelId": "Panel_1",
                "average": rain_1_stats["average"],
                "min": rain_1_stats["min"],
                "max": rain_1_stats["max"],
                "unit": "%",
                "health": rain_1_stats["health"]
            },
            {
                "panelId": "Panel_2",
                "average": rain_2_stats["average"],
                "min": rain_2_stats["min"],
                "max": rain_2_stats["max"],
                "unit": "%",
                "health": rain_2_stats["health"]
            }
        ],
        "uv": [
            {
                "panelId": "Panel_1",
                "average": uv_1_stats["average"],
                "min": uv_1_stats["min"],
                "max": uv_1_stats["max"],
                "unit": "mW/cm2",
                "health": uv_1_stats["health"]
            },
            {
                "panelId": "Panel_2",
                "average": uv_2_stats["average"],
                "min": uv_2_stats["min"],
                "max": uv_2_stats["max"],
                "unit": "mW/cm2",
                "health": uv_2_stats["health"]
            }
        ],
        "light": [
            {
                "panelId": "Panel_1",
                "average": lux_1_stats["average"],
                "min": lux_1_stats["min"],
                "max": lux_1_stats["max"],
                "unit": "lux",
                "health": lux_1_stats["health"]
            },
            {
                "panelId": "Panel_2",
                "average": lux_2_stats["average"],
                "min": lux_2_stats["min"],
                "max": lux_2_stats["max"],
                "unit": "lux",
                "health": lux_2_stats["health"]
            }
        ],
        "dht22": [
            {
                "panelId": "Panel_1",
                "temperature": {
                    "average": dht_temp_1_stats["average"],
                    "min": dht_temp_1_stats["min"],
                    "max": dht_temp_1_stats["max"],
                    "unit": "°C",
                    "health": dht_temp_1_stats["health"]
                },
                "humidity": {
                    "average": dht_humidity_1_stats["average"],
                    "min": dht_humidity_1_stats["min"],
                    "max": dht_humidity_1_stats["max"],
                    "unit": "%",
                    "health": dht_humidity_1_stats["health"]
                }
            },
            {
                "panelId": "Panel_2",
                "temperature": {
                    "average": dht_temp_2_stats["average"],
                    "min": dht_temp_2_stats["min"],
                    "max": dht_temp_2_stats["max"],
                    "unit": "°C",
                    "health": dht_temp_2_stats["health"]
                },
                "humidity": {
                    "average": dht_humidity_2_stats["average"],
                    "min": dht_humidity_2_stats["min"],
                    "max": dht_humidity_2_stats["max"],
                    "unit": "%",
                    "health": dht_humidity_2_stats["health"]
                }
            }
        ],
        "panel_temp": [
            {
                "panelId": "Panel_1",
                "average": panel_temp_1_stats["average"],
                "min": panel_temp_1_stats["min"],
                "max": panel_temp_1_stats["max"],
                "unit": "°C",
                "health": panel_temp_1_stats["health"]
            },
            {
                "panelId": "Panel_2",
                "average": panel_temp_2_stats["average"],
                "min": panel_temp_2_stats["min"],
                "max": panel_temp_2_stats["max"],
                "unit": "°C",
                "health": panel_temp_2_stats["health"]
            }
        ],
        "ina226": [
            {
                "panelId": "Panel_1",
                "voltage": {
                    "average": panel_voltage_1_stats["average"],
                    "min": panel_voltage_1_stats["min"],
                    "max": panel_voltage_1_stats["max"],
                    "unit": "V",
                    "health": panel_voltage_1_stats["health"]
                },
                "current": {
                    "average": panel_current_1_stats["average"],
                    "min": panel_current_1_stats["min"],
                    "max": panel_current_1_stats["max"],
                    "unit": "mA",
                    "health": panel_current_1_stats["health"]
                }
            },
            {
                "panelId": "Panel_2",
                "voltage": {
                    "average": panel_voltage_2_stats["average"],
                    "min": panel_voltage_2_stats["min"],
                    "max": panel_voltage_2_stats["max"],
                    "unit": "V",
                    "health": panel_voltage_2_stats["health"]
                },
                "current": {
                    "average": panel_current_2_stats["average"],
                    "min": panel_current_2_stats["min"],
                    "max": panel_current_2_stats["max"],
                    "unit": "mA",
                    "health": panel_current_2_stats["health"]
                }
            }
        ],
        "solar": [
            {
                "panelId": "Panel_1",
                "average": solar_irrad_1_stats["average"],
                "min": solar_irrad_1_stats["min"],
                "max": solar_irrad_1_stats["max"],
                "unit": "W/m2",
                "health": solar_irrad_1_stats["health"]
            },
            {
                "panelId": "Panel_2",
                "average": solar_irrad_2_stats["average"],
                "min": solar_irrad_2_stats["min"],
                "max": solar_irrad_2_stats["max"],
                "unit": "W/m2",
                "health": solar_irrad_2_stats["health"]
            }
        ],
        "battery": [
            {
                "panelId": "Panel_1",
                "average": battery_voltage_1_stats["average"],
                "min": battery_voltage_1_stats["min"],
                "max": battery_voltage_1_stats["max"],
                "unit": "V",
                "health": battery_voltage_1_stats["health"]
            },
            {
                "panelId": "Panel_2",
                "average": battery_voltage_2_stats["average"],
                "min": battery_voltage_2_stats["min"],
                "max": battery_voltage_2_stats["max"],
                "unit": "V",
                "health": battery_voltage_2_stats["health"]
            }
        ],
        "battery_capacity": 12000  # This appears to be a static value based on the example
    }
    
    return readings

def get_last_processed_timestamp():
    """Get the timestamp of the last processed row"""
    if not os.path.exists(LAST_PROCESSED_TIMESTAMP_FILE):
        # If no timestamp file exists, try to get the first date from the CSV
        if os.path.exists(CSV_FILENAME) and os.path.getsize(CSV_FILENAME) > 0:
            try:
                with open(CSV_FILENAME, 'r') as csvfile:
                    reader = csv.reader(csvfile)
                    next(reader)  # Skip header row
                    
                    # Try to get the first row with valid date/time
                    for row in reader:
                        if len(row) >= 2:  # Need at least date and time columns
                            try:
                                date_str = row[0].strip()
                                time_str = row[1].strip()
                                
                                # Try different date formats
                                try:
                                    first_timestamp = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%y %I:%M:%S %p")
                                except ValueError:
                                    try:
                                        first_timestamp = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M:%S %p")
                                    except ValueError:
                                        continue
                                
                                logger.info(f"Using first CSV entry timestamp: {first_timestamp.isoformat()}")
                                return first_timestamp
                            except Exception:
                                continue
            except Exception as e:
                logger.error(f"Error reading first timestamp from CSV: {e}")
        
        # Fall back to default if CSV doesn't exist or has no valid entries
        default_timestamp = datetime.now() - timedelta(minutes=AGGREGATION_PERIOD_MINUTES)
        logger.info(f"Using default timestamp: {default_timestamp.isoformat()}")
        return default_timestamp
    
    try:
        with open(LAST_PROCESSED_TIMESTAMP_FILE, 'r') as f:
            timestamp_str = f.read().strip()
            
            # Handle ISO 8601 format with timezone
            try:
                # Parse the timestamp with timezone info
                dt = dateutil.parser.isoparse(timestamp_str)
                
                # Convert to local naive datetime for consistent comparison
                if dt.tzinfo is not None:
                    # Remove timezone info to match CSV timestamps (which are naive)
                    dt = dt.replace(tzinfo=None)
                    
                logger.info(f"Parsed timestamp with timezone: {timestamp_str} -> {dt.isoformat()}")
                return dt
            except Exception as e:
                logger.error(f"Error parsing timestamp with timezone: {e}")
                # Fall back to basic parsing if timezone handling fails
                try:
                    # Try to parse without timezone information
                    return datetime.fromisoformat(timestamp_str.split('+')[0])
                except Exception:
                    # If that also fails, try a more aggressive approach
                    timestamp_basic = timestamp_str.split('T')[0] + " " + timestamp_str.split('T')[1].split('+')[0]
                    return datetime.strptime(timestamp_basic, "%Y-%m-%d %H:%M:%S")
    except Exception as e:
        logger.error(f"Error reading last processed timestamp: {e}")
        # Fall back to default if there's an error
        default_timestamp = datetime.now() - timedelta(minutes=AGGREGATION_PERIOD_MINUTES)
        return default_timestamp

def save_last_processed_timestamp(timestamp):
    """Save the timestamp of the last processed row"""
    try:
        # Ensure we're saving a timezone-naive datetime in ISO format
        if timestamp.tzinfo is not None:
            timestamp = timestamp.replace(tzinfo=None)
            
        # Create ISO 8601 format timestamp without timezone (to match CSV timestamps)
        with open(LAST_PROCESSED_TIMESTAMP_FILE, 'w') as f:
            f.write(timestamp.isoformat())
        logger.info(f"Updated last processed timestamp to {timestamp.isoformat()}")
    except Exception as e:
        logger.error(f"Error saving last processed timestamp: {e}")

def read_new_data():
    """Read data that hasn't been processed yet based on timestamp tracking"""
    if not os.path.exists(CSV_FILENAME) or os.path.getsize(CSV_FILENAME) == 0:
        logger.warning(f"CSV file {CSV_FILENAME} doesn't exist or is empty")
        return []
    
    # Get the last processed timestamp
    last_processed = get_last_processed_timestamp()
    logger.info(f"Reading data newer than {last_processed.isoformat()}")
    
    # If the timestamp contains timezone info that doesn't match our data,
    # it might cause comparison issues - log this for debugging
    if last_processed.tzinfo is not None:
        logger.warning(f"Last processed timestamp has timezone info: {last_processed}")
    
    rows = []
    latest_timestamp = last_processed
    
    try:
        with open(CSV_FILENAME, 'r', errors='replace') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)  # Skip header row
            
            # First scan to check if we have any data newer than last_processed
            # This handles gaps in the data by finding the next available timestamp
            all_future_rows = []
            for row in reader:
                if len(row) < 22:  # Need at least the expected columns
                    continue
                
                try:
                    # Parse date and time
                    date_str = row[0].strip()
                    time_str = row[1].strip()
                    
                    # Convert to datetime object
                    try:
                        row_time = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%y %I:%M:%S %p")
                    except ValueError:
                        # Try alternative formats
                        try:
                            row_time = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M:%S %p")
                        except ValueError:
                            logger.warning(f"Unrecognized date format: {date_str} {time_str}")
                            continue
                    
                    # Ensure both timestamps are naive (no timezone) for comparison
                    if row_time.tzinfo is not None:
                        row_time = row_time.replace(tzinfo=None)
                    
                    if last_processed.tzinfo is not None:
                        compare_last_processed = last_processed.replace(tzinfo=None)
                    else:
                        compare_last_processed = last_processed
                    
                    # Collect all rows with timestamps >= the last processed timestamp
                    if row_time >= compare_last_processed:
                        all_future_rows.append((row_time, row))
                    
                except ValueError as e:
                    # Skip rows with invalid date/time format
                    logger.debug(f"Skipping row with invalid date/time: {e}")
                    continue
            
            # If we found no data after last_processed, check if there's data much later
            if not all_future_rows:
                logger.info("No data found immediately after last processed timestamp. Checking for data after gaps...")
                
                # Reset file position and skip header
                csvfile.seek(0)
                next(reader)
                
                # Find the next available data point after our last processed timestamp
                next_available_timestamp = None
                next_available_row = None
                
                for row in reader:
                    if len(row) < 22:
                        continue
                    
                    try:
                        date_str = row[0].strip()
                        time_str = row[1].strip()
                        
                        # Convert to datetime
                        try:
                            row_time = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%y %I:%M:%S %p")
                        except ValueError:
                            try:
                                row_time = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M:%S %p")
                            except ValueError:
                                continue
                        
                        # Ensure both timestamps are naive
                        if row_time.tzinfo is not None:
                            row_time = row_time.replace(tzinfo=None)
                        
                        if last_processed.tzinfo is not None:
                            compare_last_processed = last_processed.replace(tzinfo=None)
                        else:
                            compare_last_processed = last_processed
                        
                        # Find the earliest timestamp that's after our last processed time
                        if row_time > compare_last_processed:
                            if next_available_timestamp is None or row_time < next_available_timestamp:
                                next_available_timestamp = row_time
                                next_available_row = row
                    except Exception:
                        continue
                
                # If we found data after a gap, process it
                if next_available_timestamp:
                    logger.info(f"Found data after a gap at {next_available_timestamp.isoformat()}")
                    rows.append(next_available_row)
                    latest_timestamp = next_available_timestamp
                    
                    # Continue reading from this timestamp forward
                    csvfile.seek(0)
                    next(reader)  # Skip header
                    for row in reader:
                        if len(row) < 22:
                            continue
                        
                        try:
                            date_str = row[0].strip()
                            time_str = row[1].strip()
                            
                            try:
                                row_time = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%y %I:%M:%S %p")
                            except ValueError:
                                try:
                                    row_time = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M:%S %p")
                                except ValueError:
                                    continue
                            
                            # Include rows with timestamps >= next_available_timestamp
                            if row_time >= next_available_timestamp:
                                rows.append(row)
                                if row_time > latest_timestamp:
                                    latest_timestamp = row_time
                        except Exception:
                            continue
            else:
                # We have data after the last processed timestamp, process it normally
                rows = [row for _, row in all_future_rows]
                latest_timestamp = max([row_time for row_time, _ in all_future_rows])
    except Exception as e:
        logger.error(f"Error reading CSV file: {e}")
        
        # If we encounter 'NUL' characters, try to fix the file
        if "NUL" in str(e):
            try:
                logger.info("Attempting to fix CSV file with NUL characters")
                fix_csv_with_null_chars(CSV_FILENAME)
                return read_new_data()  # Try reading again after fixing
            except Exception as fix_error:
                logger.error(f"Failed to fix CSV file: {fix_error}")
    
    # If we found new data, update the last processed timestamp
    # Add 1 second to the latest timestamp to ensure we don't reprocess the same timestamps
    if rows and latest_timestamp >= last_processed:
        # Add a small offset to avoid reprocessing rows with the exact same timestamp
        next_timestamp = latest_timestamp + timedelta(seconds=1)
        save_last_processed_timestamp(next_timestamp)
        logger.info(f"Found {len(rows)} rows, newest timestamp is {latest_timestamp.isoformat()}")
    else:
        logger.info("No new data found after considering potential gaps")
    
    return rows

def fix_csv_with_null_chars(filename):
    """Fix a CSV file that contains NUL characters by removing them"""
    tmp_filename = filename + ".tmp"
    
    try:
        # Read the file in binary mode
        with open(filename, 'rb') as f:
            content = f.read()
        
        # Remove NUL bytes (0x00)
        content = content.replace(b'\x00', b'')
        
        # Write clean content to temp file
        with open(tmp_filename, 'wb') as f:
            f.write(content)
            
        # Replace original with fixed version
        os.replace(tmp_filename, filename)
        logger.info(f"Successfully fixed CSV file by removing NUL characters")
    except Exception as e:
        if os.path.exists(tmp_filename):
            os.remove(tmp_filename)
        raise e

async def login():
    """Login to get JWT token for authentication"""
    global AUTH_TOKEN
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                AUTH_API_URL,
                json={"email": AUTH_EMAIL, "password": AUTH_PASSWORD},
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status == 200:
                    # If login was successful, we need to extract the token from Set-Cookie header
                    cookies = response.headers.getall('Set-Cookie', [])
                    logger.info(f"Response headers: {response.headers}")
                    
                    # Check for token in Set-Cookie headers
                    for cookie in cookies:
                        if 'token=' in cookie:
                            # Extract token value from cookie string
                            token_part = cookie.split('token=')[1].split(';')[0]
                            AUTH_TOKEN = token_part
                            logger.info("Authentication successful, token extracted from header")
                            return True
                            
                    # If we can't find the token in cookies, we'll use the response success and continue anyway
                    # The server might be setting the cookie in a different way
                    logger.warning("Authentication successful but no token found in headers. Will try to proceed.")
                    AUTH_TOKEN = "dummy_token"  # Use a dummy token to proceed with the request
                    return True
                else:
                    response_text = await response.text()
                    logger.error(f"Authentication failed: {response.status} - {response_text}")
                    return False
    except aiohttp.ClientError as e:
        logger.error(f"Error during authentication: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {e}")
        return False

async def send_to_backend(data):
    """Send the aggregated data to the backend service asynchronously"""
    global AUTH_TOKEN
    
    # Ensure we have a valid auth token
    if not AUTH_TOKEN:
        auth_success = await login()
        if not auth_success:
            logger.error("Failed to authenticate, cannot send data")
            return False
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    # Create a simple dict of cookies instead of using cookie jar directly
    cookies = {'token': AUTH_TOKEN}
    
    try:
        # Create session and pass cookies in the request directly
        async with aiohttp.ClientSession() as session:
            # Make the request with cookies attached as a simple dict
            async with session.post(
                BACKEND_API_URL, 
                json=data, 
                headers=headers,
                cookies=cookies
            ) as response:
                if response.status == 200 or response.status == 201:
                    logger.info(f"Data successfully sent to backend. Response: {response.status}")
                    return True
                elif response.status == 401:
                    # Token might be expired, try to login again
                    logger.info("Authentication token expired, attempting to login again")
                    AUTH_TOKEN = None
                    auth_success = await login()
                    if auth_success:
                        # Retry with new token
                        return await send_to_backend(data)
                    else:
                        logger.error("Failed to re-authenticate")
                        return False
                else:
                    response_text = await response.text()
                    logger.error(f"Error response from backend: {response.status} - {response_text}")
                    return False
    except aiohttp.ClientError as e:
        logger.error(f"Error sending data to backend: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending data to backend: {e}")
        return False

def group_data_by_time_window(data, minutes=5):
    """
    Group data into specified time windows (e.g., 5-minute intervals).
    Returns a dictionary with timestamp keys and lists of data rows as values.
    """
    grouped_data = {}
    
    for row in data:
        # Get the timestamp
        timestamp = row['timestamp']
        
        # Truncate to the nearest time window
        truncated_minute = (timestamp.minute // minutes) * minutes
        window_timestamp = timestamp.replace(minute=truncated_minute, second=0, microsecond=0)
        
        # Add to the appropriate group
        if window_timestamp not in grouped_data:
            grouped_data[window_timestamp] = []
        
        grouped_data[window_timestamp].append(row)
    
    return grouped_data

async def process_and_send_data():
    """Main function to process and send data asynchronously"""
    logger.info("Processing new data since last run")
    
    # Try to login first to ensure we have a valid token
    await login()
    
    # Read the new data since last processed timestamp
    raw_data = read_new_data()
    
    if not raw_data:
        logger.info("No new data found since last run")
        return
    
    logger.info(f"Found {len(raw_data)} new rows of data to process")
    
    # Clean the data
    cleaned_data = clean_data(raw_data)
    
    if not cleaned_data:
        logger.warning("No valid data after cleaning")
        return
    
    logger.info(f"Successfully cleaned {len(cleaned_data)} rows of data")
    
    # Group data by 5-minute windows
    grouped_data = group_data_by_time_window(cleaned_data, AGGREGATION_PERIOD_MINUTES)
    logger.info(f"Data grouped into {len(grouped_data)} time windows of {AGGREGATION_PERIOD_MINUTES} minutes each")
    
    # Process each time window separately
    success_count = 0
    total_windows = len(grouped_data)
    
    for window_start, window_data in sorted(grouped_data.items()):
        window_end = window_start + timedelta(minutes=AGGREGATION_PERIOD_MINUTES)
        logger.info(f"Processing window {window_start.isoformat()} to {window_end.isoformat()} with {len(window_data)} rows")
        
        # Generate payload for this time window
        window_payload = generate_window_payload(window_data, window_start, window_end)
        
        if not window_payload:
            logger.warning(f"Failed to generate payload for window {window_start.isoformat()}")
            continue
        
        # Optionally save the last payload for debugging (only the most recent window)
        if window_start == max(grouped_data.keys()):
            try:
                with open('last_payload.json', 'w') as f:
                    json.dump(window_payload, f, indent=2)
                logger.info("Saved payload to last_payload.json")
            except Exception as e:
                logger.warning(f"Failed to save payload to file: {e}")
        
        # Send to backend
        success = await send_to_backend(window_payload)
        
        if success:
            success_count += 1
        
    if total_windows > 0:
        logger.info(f"Successfully sent {success_count} of {total_windows} time window aggregations to backend")
    else:
        logger.warning("No time windows to process")

def generate_window_payload(window_data, start_time, end_time):
    """Generate the payload for a specific time window"""
    if not window_data:
        logger.warning("No valid data to aggregate for this window")
        return None
    
    # Localize the timestamps to the specified timezone
    tz = pytz.timezone(TIMEZONE)
    start_time_local = tz.localize(start_time)
    end_time_local = tz.localize(end_time)
    
    # Format timestamps in ISO 8601 format with timezone
    start_time_str = start_time_local.isoformat()
    end_time_str = end_time_local.isoformat()
    
    # Aggregate the data for this window
    readings = aggregate_data(window_data)
    
    # Construct the payload
    payload = {
        "deviceId": DEVICE_ID,
        "startTime": start_time_str,
        "endTime": end_time_str,
        "metadata": {
            "aggregationType": f"{AGGREGATION_PERIOD_MINUTES}min",
            "sampleCount": len(window_data),
            "timezone": TIMEZONE
        },
        "readings": readings
    }
    
    return payload

async def run_periodic_aggregation():
    """Run the aggregation process at regular intervals"""
    while True:
        try:
            await process_and_send_data()
        except Exception as e:
            logger.error(f"Error in main processing loop: {e}")
        
        # Sleep until the next 5-minute boundary
        current_time = datetime.now()
        # Calculate time until next 5-minute boundary
        minutes_until_next = AGGREGATION_PERIOD_MINUTES - (current_time.minute % AGGREGATION_PERIOD_MINUTES)
        if minutes_until_next == 0:
            minutes_until_next = AGGREGATION_PERIOD_MINUTES
        
        seconds_until_next = minutes_until_next * 60 - current_time.second
        
        logger.info(f"Next aggregation in {minutes_until_next} minutes and {current_time.second} seconds")
        await asyncio.sleep(seconds_until_next)

if __name__ == "__main__":
    logger.info("Starting data aggregator service")
    asyncio.run(run_periodic_aggregation()) 
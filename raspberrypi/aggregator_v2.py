import sqlite3
import json
import math
import time
import asyncio
import aiohttp
import aiosqlite
from datetime import datetime, timedelta, timezone
import pytz
import os
import logging
import dateutil.parser
from contextlib import contextmanager, asynccontextmanager
from functools import lru_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('data_aggregator_sqlite')

# Constants
DB_PATH = "sensordata.db"  # Path to the SQLite database
DEVICE_ID = "SOLAR_01" # Should match sensor_main.py
AGGREGATION_PERIOD_MINUTES = 5
TIMEZONE = "Asia/Manila"
BACKEND_URL = "https://hayag.onrender.com"
BACKEND_API_URL = f"{BACKEND_URL}/api/readings"
AUTH_API_URL = f"{BACKEND_URL}/api/auth/login"
# Auth credentials
AUTH_EMAIL = "irahansdedicatoria@gmail.com"
AUTH_PASSWORD = "12345678"
# Auth token storage
AUTH_TOKEN = None

# Async DB pool - Initialize later
ASYNC_DB_POOL = None

# Batch processing settings
MAX_BATCH_SIZE = 10  # Maximum number of windows to process in a single batch

# --- New State Tracking Key ---
PROCESSING_STATE_KEY = "last_processed_timestamp"

# Define a configuration dict for sensor mappings - centralized config
SENSOR_MAPPING = {
    # Key: ('panelX_column_suffix', config_dict)
    'rain_1': ('panel1_rain', {'sensor_type': 'rain', 'sensor_name': None, 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': 100, 'unit': '%'}),
    'rain_2': ('panel2_rain', {'sensor_type': 'rain', 'sensor_name': None, 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': 100, 'unit': '%'}),
    'uv_1': ('panel1_uv', {'sensor_type': 'uv', 'sensor_name': None, 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': 15, 'unit': 'mW/cm2'}),
    'uv_2': ('panel2_uv', {'sensor_type': 'uv', 'sensor_name': None, 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': 15, 'unit': 'mW/cm2'}),
    'lux_1': ('panel1_lux', {'sensor_type': 'light', 'sensor_name': None, 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': 120000, 'unit': 'lux'}),
    'lux_2': ('panel2_lux', {'sensor_type': 'light', 'sensor_name': None, 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': 120000, 'unit': 'lux'}),
    'dht_temp_1': ('panel1_dht_temp', {'sensor_type': 'temperature', 'sensor_name': 'dht22', 'panel_id': 'Panel_1', 'min_val': 10, 'max_val': 60, 'unit': '°C'}),
    'dht_temp_2': ('panel2_dht_temp', {'sensor_type': 'temperature', 'sensor_name': 'dht22', 'panel_id': 'Panel_2', 'min_val': 10, 'max_val': 60, 'unit': '°C'}),
    'dht_humidity_1': ('panel1_dht_humidity', {'sensor_type': 'humidity', 'sensor_name': 'dht22', 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': 100, 'unit': '%'}),
    'dht_humidity_2': ('panel2_dht_humidity', {'sensor_type': 'humidity', 'sensor_name': 'dht22', 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': 100, 'unit': '%'}),
    'panel_temp_1': ('panel1_panel_temp', {'sensor_type': 'temperature', 'sensor_name': 'panel_temp', 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': None, 'unit': '°C'}),
    'panel_temp_2': ('panel2_panel_temp', {'sensor_type': 'temperature', 'sensor_name': 'panel_temp', 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': None, 'unit': '°C'}),
    'panel_voltage_1': ('panel1_voltage', {'sensor_type': 'voltage', 'sensor_name': 'ina226', 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': None, 'unit': 'V'}),
    'panel_voltage_2': ('panel2_voltage', {'sensor_type': 'voltage', 'sensor_name': 'ina226', 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': None, 'unit': 'V'}),
    'panel_current_1': ('panel1_current', {'sensor_type': 'current', 'sensor_name': 'ina226', 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': None, 'unit': 'mA'}),
    'panel_current_2': ('panel2_current', {'sensor_type': 'current', 'sensor_name': 'ina226', 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': None, 'unit': 'mA'}),
    'solar_irrad_1': ('panel1_solar_irrad', {'sensor_type': 'irradiance', 'sensor_name': 'solar', 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': 1800, 'unit': 'W/m2'}),
    'solar_irrad_2': ('panel2_solar_irrad', {'sensor_type': 'irradiance', 'sensor_name': 'solar', 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': 1800, 'unit': 'W/m2'}),
    'battery_voltage_1': ('panel1_battery_voltage', {'sensor_type': 'voltage', 'sensor_name': 'battery', 'panel_id': 'Panel_1', 'min_val': 0, 'max_val': None, 'unit': 'V'}),
    'battery_voltage_2': ('panel2_battery_voltage', {'sensor_type': 'voltage', 'sensor_name': 'battery', 'panel_id': 'Panel_2', 'min_val': 0, 'max_val': None, 'unit': 'V'}),
}

# Cache for prepared SQL statements (aiosqlite might handle this, but explicit can be clearer)
STATEMENT_CACHE = {}

# --- Database Helper Functions ---

# Remove synchronous DB helpers (get_db_connection, db_connection) - rely solely on async

# Async DB helpers
async def init_async_db_pool():
    """Initialize the async connection pool."""
    global ASYNC_DB_POOL
    if ASYNC_DB_POOL is None:
        logger.info("Initializing async database connection pool")
        ASYNC_DB_POOL = await aiosqlite.connect(DB_PATH)
        # Enable row factory to get dict-like rows
        ASYNC_DB_POOL.row_factory = aiosqlite.Row
        
        # Create necessary index and state table if they don't exist yet
        async with ASYNC_DB_POOL.cursor() as cursor:
            # Index for the new table
            await cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_readings2(timestamp)")
            # Table for tracking processing state
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS processing_state (
                    key TEXT PRIMARY KEY, 
                    value TEXT
                )""")
            await ASYNC_DB_POOL.commit()
            logger.info("Database index and state table created/verified")
    return ASYNC_DB_POOL

@asynccontextmanager
async def async_db_connection():
    """Async context manager for database connections."""
    pool = await init_async_db_pool()
    try:
        yield pool
    except Exception as e:
        logger.error(f"Error in async database operation: {e}")
        raise
    # Don't close the pool, it's reused

# Async versions of database functions
async def async_get_latest_reading_timestamp():
    """Async version to get the timestamp of the most recent reading from sensor_readings2."""
    async with async_db_connection() as conn:
        async with conn.cursor() as cursor:
            # Query the new table
            await cursor.execute("SELECT MAX(timestamp) as latest_ts FROM sensor_readings2")
            result = await cursor.fetchone()
            if result and result['latest_ts']:
                # Parse the timestamp string
                try:
                    # Use dateutil.parser for flexibility with ISO formats
                    ts = dateutil.parser.isoparse(result['latest_ts'])
                    return ts
                except (ValueError, TypeError) as e:
                    logger.error(f"Error parsing latest timestamp '{result['latest_ts']}': {e}")
                    return None
            return None

async def async_get_first_reading_timestamp():
    """Async version to get the timestamp of the first reading from sensor_readings2."""
    async with async_db_connection() as conn:
        async with conn.cursor() as cursor:
            # Query the new table
            await cursor.execute("SELECT MIN(timestamp) as earliest_ts FROM sensor_readings2")
            result = await cursor.fetchone()
            if result and result['earliest_ts']:
                 # Parse the timestamp string
                try:
                    # Use dateutil.parser for flexibility with ISO formats
                    ts = dateutil.parser.isoparse(result['earliest_ts'])
                    return ts
                except (ValueError, TypeError) as e:
                    logger.error(f"Error parsing earliest timestamp '{result['earliest_ts']}': {e}")
                    return None
            return None

async def async_get_readings_for_window(start_time, end_time):
    """
    Async version to fetch sensor readings within a time window from sensor_readings2.
    Transforms the wide row format into a list of dictionaries suitable for processing.
    """
    start_time_iso = start_time.isoformat()
    end_time_iso = end_time.isoformat()
    
    # Cache key for this particular window (less critical with simpler query)
    cache_key = f"readings_{start_time_iso}_{end_time_iso}"
    
    async with async_db_connection() as conn:
        query = """
        SELECT * 
        FROM sensor_readings2 
        WHERE timestamp >= ? AND timestamp < ?
        ORDER BY timestamp;
        """
        
        processed_rows = []
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(query, (start_time_iso, end_time_iso))
                rows = await cursor.fetchall() # Fetch all rows for the window
                
                # Transform each wide row into the format expected by clean_data
                for row in rows:
                    ts_str = row['timestamp']
                    ts = dateutil.parser.isoparse(ts_str)
                    
                    # Create the base dictionary for this timestamp
                    processed_row = {'timestamp': ts}
                    
                    # Map columns back to sensor keys using SENSOR_MAPPING
                    for key, (col_name, config) in SENSOR_MAPPING.items():
                        if col_name in row.keys():
                             processed_row[key] = row[col_name]
                        else:
                             # Should not happen if SENSOR_MAPPING is correct, but handle defensively
                             processed_row[key] = None 
                             logger.warning(f"Column {col_name} not found in row for timestamp {ts_str}")

                    processed_rows.append(processed_row)

        except sqlite3.Error as e:
            logger.error(f"Database error fetching window {start_time_iso}-{end_time_iso}: {e}")
            return [] # Return empty list on error
        except Exception as e:
             logger.error(f"Unexpected error fetching window {start_time_iso}-{end_time_iso}: {e}")
             return []

        logger.debug(f"Fetched and processed {len(processed_rows)} reading sets for window {start_time_iso} to {end_time_iso}")
        return processed_rows

async def async_get_processing_state(key: str):
    """Gets a value from the processing_state table."""
    async with async_db_connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT value FROM processing_state WHERE key = ?", (key,))
            result = await cursor.fetchone()
            if result:
                return result['value']
            return None

async def async_update_processing_state(key: str, value: str):
    """Updates or inserts a value into the processing_state table."""
    async with async_db_connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "INSERT OR REPLACE INTO processing_state (key, value) VALUES (?, ?)",
                (key, value)
            )
            await conn.commit()
            logger.debug(f"Updated processing state for key '{key}'")
            return True

async def get_start_processing_timestamp():
    """
    Determines the timestamp from where processing should begin.
    Reads the last processed timestamp from the state table,
    or defaults to the earliest reading if no state is found.
    """
    last_processed_ts_str = await async_get_processing_state(PROCESSING_STATE_KEY)
    
    if last_processed_ts_str:
        try:
            last_ts = dateutil.parser.isoparse(last_processed_ts_str)
            # Ensure it's timezone-naive UTC for calculations
            if last_ts.tzinfo is not None:
                last_ts = last_ts.astimezone(pytz.utc).replace(tzinfo=None)
            logger.info(f"Resuming aggregation process from saved state: {last_ts.isoformat()}Z")
            return last_ts
        except (ValueError, TypeError) as e:
            logger.warning(f"Could not parse saved processing state '{last_processed_ts_str}': {e}. Starting from beginning.")
            
    # If no valid state, find the first reading timestamp
    first_ts = await async_get_first_reading_timestamp()
    if first_ts:
         # Ensure it's timezone-naive UTC
        if first_ts.tzinfo is not None:
            first_ts = first_ts.astimezone(pytz.utc).replace(tzinfo=None)
        logger.info(f"No valid processing state found. Starting from first reading: {first_ts.isoformat()}Z")
        return first_ts
    else:
        logger.info("No previous processing state and no readings found in database.")
        return None # Indicate nothing to process

# Cache for historical values to avoid repeated DB lookups
LAST_VALID_VALUES_CACHE = {}
CACHE_EXPIRY = 600  # seconds

# --- Modified function to initialize forward-fill values from sensor_readings2 ---
async def initialize_last_valid_values_async(start_time):
    """
    Query the database asynchronously to find the most recent valid values 
    for each sensor prior to the given start_time using the new schema.
    
    Uses a cache to avoid repeated database lookups for the same values.
    """
    # Cache key based on the start time (rounded to nearest minute)
    cache_key = start_time.replace(second=0, microsecond=0).isoformat()
    current_time = time.time()
    
    # Check cache
    if cache_key in LAST_VALID_VALUES_CACHE:
        cache_entry, timestamp = LAST_VALID_VALUES_CACHE[cache_key]
        if current_time - timestamp < CACHE_EXPIRY:
            logger.debug(f"Using cached forward-fill values for {cache_key}")
            return cache_entry.copy() # Return a copy
    
    # Initialize with None
    last_valid_values = {key: None for key in SENSOR_MAPPING}
    
    start_time_iso = start_time.isoformat()
    
    async with async_db_connection() as conn:
        try:
            # Query the latest row before the start_time
            query = "SELECT * FROM sensor_readings2 WHERE timestamp < ? ORDER BY timestamp DESC LIMIT 1"
            async with conn.cursor() as cursor:
                await cursor.execute(query, (start_time_iso,))
                latest_row = await cursor.fetchone()

                if latest_row:
                    logger.debug(f"Initializing forward-fill from row at timestamp: {latest_row['timestamp']}")
                    # Iterate through SENSOR_MAPPING to extract and validate values
                    for key, (col_name, config) in SENSOR_MAPPING.items():
                        if col_name in latest_row.keys():
                            value = latest_row[col_name]
                            # Validate the value using existing logic
                            validated_value = validate_and_convert_sqlite(value, config['min_val'], config['max_val'])
                            if validated_value is not None:
                                last_valid_values[key] = validated_value
                                # logger.debug(f"Found historical value for {key} ({col_name}): {validated_value}")
                        else:
                             logger.warning(f"Column {col_name} for key {key} not found in historical row.")
                else:
                     logger.info(f"No historical data found before {start_time_iso} for forward-fill init.")

            filled_count = sum(1 for v in last_valid_values.values() if v is not None)
            logger.info(f"Initialized {filled_count}/{len(last_valid_values)} sensors with historical values for forward-fill")
            
            # Update cache
            LAST_VALID_VALUES_CACHE[cache_key] = (last_valid_values.copy(), current_time)
            
        except sqlite3.Error as e:
            logger.error(f"Error retrieving historical values from database: {e}")
        except Exception as e:
            logger.error(f"Unexpected error retrieving historical values: {e}")
            
    return last_valid_values


async def clean_data_async(rows_from_db):
    """
    Clean the data fetched from the database (async version).
    Handles None values, applies forward fill based on historical values 
    and values within the current batch. Preserves original validity status.
    """
    if not rows_from_db:
        return []
        
    cleaned_rows = []
    
    # Get the earliest timestamp in this batch to initialize historical values
    # Ensure timestamps are datetime objects
    timestamps = [row['timestamp'] for row in rows_from_db if isinstance(row.get('timestamp'), datetime)]
    if not timestamps:
        logger.warning("No valid timestamps found in data batch for cleaning.")
        return []
    earliest_timestamp = min(timestamps)
    
    # Initialize last valid values from DB history (before this batch) - Use async version
    last_valid_values = await initialize_last_valid_values_async(earliest_timestamp)
    
    # Process each row in the current batch
    for row_dict in rows_from_db:
        # Ensure timestamp is a datetime object before proceeding
        if not isinstance(row_dict.get('timestamp'), datetime):
            logger.warning(f"Skipping row due to invalid timestamp: {row_dict.get('timestamp')}")
            continue

        cleaned_row = {'timestamp': row_dict['timestamp']} 
        validity_flags = {} # Track original validity

        # Process each sensor defined in our mapping
        # The input row_dict already has keys like 'rain_1', 'uv_1' etc. from async_get_readings_for_window
        for key, (_, config) in SENSOR_MAPPING.items():
            value = row_dict.get(key)
            
            # Validate the value
            validated_value = validate_and_convert_sqlite(value, config['min_val'], config['max_val'])
            
            # Store original validity flag
            validity_flags[key] = validated_value is not None
            
            if validated_value is not None:
                cleaned_row[key] = validated_value
                last_valid_values[key] = validated_value # Update for next step's forward fill
            else:
                # Apply forward fill if available
                if last_valid_values.get(key) is not None:
                    cleaned_row[key] = last_valid_values[key]
                    # logger.debug(f"Forward filling {key} with value {last_valid_values[key]} at {row_dict['timestamp']}")
                else:
                    # No historical or current valid value, use default (e.g., 0.0)
                    cleaned_row[key] = 0.0 # Assign a default, maybe make configurable?
                    # logger.debug(f"No historical/current data for {key}, using 0.0 at {row_dict['timestamp']}")
        
        cleaned_row['_validity_flags'] = validity_flags
        cleaned_rows.append(cleaned_row)

    return cleaned_rows

def validate_and_convert_sqlite(value, min_val=None, max_val=None):
    """
    Validates and converts a value fetched from SQLite.
    Returns None for invalid values to track health accurately,
    but these will be forward-filled later.
    """
    # Retain NULL values from database for health tracking
    if value is None:
        return None

    try:
        # Convert to float and validate range
        float_val = float(value)

        # Check for NaN or infinite values
        if math.isnan(float_val) or math.isinf(float_val):
            logger.warning(f"Encountered NaN/Inf value from DB: {value}")
            return None  # Return None for health tracking

        # Validate minimum if specified
        if min_val is not None and float_val < min_val:
            # logger.debug(f"Value {float_val} is below min {min_val}")
            return None  # Return None for health tracking

        # Validate maximum if specified
        if max_val is not None and float_val > max_val:
            # logger.debug(f"Value {float_val} is above max {max_val}")
            return None  # Return None for health tracking

        return float_val
    except (ValueError, TypeError):
        # logger.warning(f"Could not convert value '{value}' to float.")
        return None  # Return None for health tracking


def calculate_stat(rows, key):
    """
    Calculate statistics (average, min, max) for a specific sensor across all rows.
    Uses validity flags for accurate health calculation based on pre-forward-fill data.
    
    Args:
        rows: List of data rows (dictionaries)
        key: The sensor key to calculate stats for (e.g., 'rain_1')
        
    Returns:
        Dictionary with average, min, max and health statistics
    """
    # Extract values for this sensor
    values = [row.get(key) for row in rows]
    
    # Get original validity flags (before forward filling)
    validity = [row.get('_validity_flags', {}).get(key, False) for row in rows]
    
    # Calculate health based on original validity, not forward-filled values
    total_count = len(values)
    valid_count = sum(1 for v in validity if v)
    health = int((valid_count / total_count) * 100) if total_count > 0 else 0
    
    # For actual min/max/avg calculations, filter out any remaining None values
    # (shouldn't happen with forward fill, but just in case)
    valid_values = [v for v in values if v is not None and isinstance(v, (int, float))]
    
    if not valid_values:
        # Always return zeros instead of nulls in final output
        return {
            "average": 0.0, 
            "min": 0.0, 
            "max": 0.0, 
            "health": health
        }

    # Round the average to avoid excessive decimals
    avg = round(sum(valid_values) / len(valid_values), 4)

    return {
        "average": avg,
        "min": min(valid_values),
        "max": max(valid_values),
        "health": health
    }


def aggregate_data(cleaned_data):
    """Aggregate the cleaned data into the required format."""
    if not cleaned_data:
        logger.warning("No cleaned data available for aggregation")
        return {}
    
    # Calculate statistics using the modified calculate_stat directly on cleaned data
    rain_1_stats = calculate_stat(cleaned_data, 'rain_1')
    rain_2_stats = calculate_stat(cleaned_data, 'rain_2')
    uv_1_stats = calculate_stat(cleaned_data, 'uv_1')
    uv_2_stats = calculate_stat(cleaned_data, 'uv_2')
    lux_1_stats = calculate_stat(cleaned_data, 'lux_1')
    lux_2_stats = calculate_stat(cleaned_data, 'lux_2')
    dht_temp_1_stats = calculate_stat(cleaned_data, 'dht_temp_1')
    dht_humidity_1_stats = calculate_stat(cleaned_data, 'dht_humidity_1')
    dht_temp_2_stats = calculate_stat(cleaned_data, 'dht_temp_2')
    dht_humidity_2_stats = calculate_stat(cleaned_data, 'dht_humidity_2')
    panel_temp_1_stats = calculate_stat(cleaned_data, 'panel_temp_1')
    panel_temp_2_stats = calculate_stat(cleaned_data, 'panel_temp_2')
    panel_voltage_1_stats = calculate_stat(cleaned_data, 'panel_voltage_1')
    panel_current_1_stats = calculate_stat(cleaned_data, 'panel_current_1')
    panel_voltage_2_stats = calculate_stat(cleaned_data, 'panel_voltage_2')
    panel_current_2_stats = calculate_stat(cleaned_data, 'panel_current_2')
    solar_irrad_1_stats = calculate_stat(cleaned_data, 'solar_irrad_1')
    solar_irrad_2_stats = calculate_stat(cleaned_data, 'solar_irrad_2')
    battery_voltage_1_stats = calculate_stat(cleaned_data, 'battery_voltage_1')
    battery_voltage_2_stats = calculate_stat(cleaned_data, 'battery_voltage_2')

    # Create the aggregated data structure (identical structure to CSV version)
    readings = {
        "rain": [
            {"panelId": "Panel_1", **rain_1_stats, "unit": "%"},
            {"panelId": "Panel_2", **rain_2_stats, "unit": "%"}],
        "uv": [
            {"panelId": "Panel_1", **uv_1_stats, "unit": "mW/cm2"},
            {"panelId": "Panel_2", **uv_2_stats, "unit": "mW/cm2"}],
        "light": [
            {"panelId": "Panel_1", **lux_1_stats, "unit": "lux"},
            {"panelId": "Panel_2", **lux_2_stats, "unit": "lux"}],
        "dht22": [
            {"panelId": "Panel_1",
             "temperature": {"average": dht_temp_1_stats["average"], "min": dht_temp_1_stats["min"], "max": dht_temp_1_stats["max"], "unit": "°C", "health": dht_temp_1_stats["health"]},
             "humidity": {"average": dht_humidity_1_stats["average"], "min": dht_humidity_1_stats["min"], "max": dht_humidity_1_stats["max"], "unit": "%", "health": dht_humidity_1_stats["health"]}},
            {"panelId": "Panel_2",
             "temperature": {"average": dht_temp_2_stats["average"], "min": dht_temp_2_stats["min"], "max": dht_temp_2_stats["max"], "unit": "°C", "health": dht_temp_2_stats["health"]},
             "humidity": {"average": dht_humidity_2_stats["average"], "min": dht_humidity_2_stats["min"], "max": dht_humidity_2_stats["max"], "unit": "%", "health": dht_humidity_2_stats["health"]}}],
        "panel_temp": [
            {"panelId": "Panel_1", **panel_temp_1_stats, "unit": "°C"},
            {"panelId": "Panel_2", **panel_temp_2_stats, "unit": "°C"}],
        "ina226": [
            {"panelId": "Panel_1",
             "voltage": {"average": panel_voltage_1_stats["average"], "min": panel_voltage_1_stats["min"], "max": panel_voltage_1_stats["max"], "unit": "V", "health": panel_voltage_1_stats["health"]},
             "current": {"average": panel_current_1_stats["average"], "min": panel_current_1_stats["min"], "max": panel_current_1_stats["max"], "unit": "mA", "health": panel_current_1_stats["health"]}},
            {"panelId": "Panel_2",
             "voltage": {"average": panel_voltage_2_stats["average"], "min": panel_voltage_2_stats["min"], "max": panel_voltage_2_stats["max"], "unit": "V", "health": panel_voltage_2_stats["health"]},
             "current": {"average": panel_current_2_stats["average"], "min": panel_current_2_stats["min"], "max": panel_current_2_stats["max"], "unit": "mA", "health": panel_current_2_stats["health"]}}],
        "solar": [
            {"panelId": "Panel_1", **solar_irrad_1_stats, "unit": "W/m2"},
            {"panelId": "Panel_2", **solar_irrad_2_stats, "unit": "W/m2"}],
        "battery": [
            {"panelId": "Panel_1", **battery_voltage_1_stats, "unit": "V"},
            {"panelId": "Panel_2", **battery_voltage_2_stats, "unit": "V"}],
        "battery_capacity": 12000 # Static value
    }
    return readings

# --- Backend Communication (Small change in send_to_backend) ---

async def login():
    """Login to get JWT token for authentication"""
    global AUTH_TOKEN
    # Clear previous token attempt if any
    AUTH_TOKEN = None
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                AUTH_API_URL,
                json={"email": AUTH_EMAIL, "password": AUTH_PASSWORD},
                headers={'Content-Type': 'application/json'},
                timeout=10 # Add a timeout
            ) as response:
                if response.status == 200:
                    cookies = response.headers.getall('Set-Cookie', [])
                    logger.debug(f"Auth response headers: {response.headers}")
                    for cookie in cookies:
                        if 'token=' in cookie:
                            token_part = cookie.split('token=')[1].split(';')[0]
                            AUTH_TOKEN = token_part
                            logger.info("Authentication successful, token extracted.")
                            return True
                    # If token not found in Set-Cookie, check response body (less common)
                    try:
                        resp_json = await response.json()
                        if 'token' in resp_json:
                             AUTH_TOKEN = resp_json['token']
                             logger.info("Authentication successful, token extracted from body.")
                             return True
                    except Exception:
                        pass # Ignore if body isn't JSON or doesn't contain token

                    logger.warning("Authentication successful but no token found in headers or body.")
                    # Proceed cautiously - maybe backend uses session cookies implicitly?
                    # Or maybe the endpoint changed. For now, we'll assume it works without explicit token.
                    AUTH_TOKEN = "implicit_session" # Indicate we didn't get an explicit token
                    return True
                else:
                    response_text = await response.text()
                    logger.error(f"Authentication failed: {response.status} - {response_text}")
                    return False
    except aiohttp.ClientConnectorError as e:
         logger.error(f"Connection error during authentication: {e}")
         return False
    except asyncio.TimeoutError:
        logger.error("Timeout during authentication.")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {e}")
        return False

async def send_to_backend(data_payload, window_start_time, window_end_time):
    """
    Send the aggregated data payload to the backend service asynchronously.
    No longer needs period_id. Returns True on success, False on failure.
    """
    global AUTH_TOKEN
    window_label = f"{window_start_time.isoformat()}Z to {window_end_time.isoformat()}Z" # For logging

    if not AUTH_TOKEN:
        logger.info(f"No auth token for window {window_label}, attempting login first.")
        auth_success = await login()
        if not auth_success:
            logger.error(f"Failed to authenticate, cannot send data for window {window_label}")
            return False # Indicate failure

    headers = {'Content-Type': 'application/json'}
    cookies = {'token': AUTH_TOKEN} if AUTH_TOKEN and AUTH_TOKEN != "implicit_session" else None

    try:
        async with aiohttp.ClientSession(cookies=cookies) as session: 
            async with session.post(
                BACKEND_API_URL,
                json=data_payload,
                headers=headers,
                timeout=30 # Add timeout for sending data
            ) as response:
                if response.status == 200 or response.status == 201:
                    logger.info(f"Data for window {window_label} successfully sent. Response: {response.status}")
                    # No DB update needed here anymore for marking as sent
                    return True # Indicate success
                elif response.status == 401: # Unauthorized
                    logger.warning(f"Authentication failed for window {window_label} (401). Token might be invalid/expired.")
                    AUTH_TOKEN = None # Clear token to force re-login on next attempt
                    return False # Indicate failure
                else:
                    response_text = await response.text()
                    logger.error(f"Error response from backend for window {window_label}: {response.status} - {response_text}")
                    return False # Indicate failure
    except aiohttp.ClientConnectorError as e:
         logger.error(f"Connection error sending data for window {window_label}: {e}")
         return False
    except asyncio.TimeoutError:
        logger.error(f"Timeout sending data for window {window_label}.")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending data for window {window_label}: {e}")
        return False

# --- Main Processing Logic ---

def generate_window_payload(window_data, start_time, end_time):
    """Generate the payload for a specific time window. (Identical to CSV version)."""
    if not window_data:
        logger.warning("No valid data to aggregate for this window")
        return None

    # Make sure timestamps are timezone-aware for ISO formatting
    tz = pytz.timezone(TIMEZONE)
    start_time_local = tz.localize(start_time) if start_time.tzinfo is None else start_time.astimezone(tz)
    end_time_local = tz.localize(end_time) if end_time.tzinfo is None else end_time.astimezone(tz)

    start_time_str = start_time_local.isoformat()
    end_time_str = end_time_local.isoformat()

    readings = aggregate_data(window_data)

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

async def process_pending_aggregations():
    """Processes data for aggregation periods based on the new schema and state tracking."""
    logger.info("Checking for data to aggregate and send...")

    # Determine the timestamp to start processing from using the new state mechanism
    start_processing_ts = await get_start_processing_timestamp()
    if start_processing_ts is None:
        logger.info("No starting timestamp determined (no readings or state). Nothing to process.")
        return # Nothing to process

    # Ensure start_processing_ts is naive UTC
    if start_processing_ts.tzinfo is not None:
        start_processing_ts = start_processing_ts.astimezone(pytz.utc).replace(tzinfo=None)
    
    logger.info(f"Starting aggregation process from: {start_processing_ts.isoformat()}Z")

    # Find the latest reading timestamp available
    latest_reading_ts = await async_get_latest_reading_timestamp()
    if latest_reading_ts is None:
        logger.info("No latest reading timestamp found.")
        return
        
    # Ensure latest_reading_ts is naive UTC
    if latest_reading_ts.tzinfo is not None:
         latest_reading_ts = latest_reading_ts.astimezone(pytz.utc).replace(tzinfo=None)

    if latest_reading_ts <= start_processing_ts:
        logger.info("No new readings found since the last processed timestamp.")
        return

    # Calculate the time windows to process
    current_window_start = start_processing_ts
    # Align the start time to the beginning of its aggregation window if needed
    # This ensures we don't re-process partial windows if the last run failed mid-window
    current_window_start = current_window_start.replace(
        minute=(current_window_start.minute // AGGREGATION_PERIOD_MINUTES) * AGGREGATION_PERIOD_MINUTES,
        second=0,
        microsecond=0
    )
    # If alignment moved start time earlier than the actual state, reset to state
    if current_window_start < start_processing_ts:
         current_window_start = start_processing_ts


    windows_to_process = []
    while True:
        # Ensure we don't start processing before the actual start point
        if current_window_start < start_processing_ts:
             current_window_start = start_processing_ts
             # Re-align again if needed after skipping forward
             current_window_start = current_window_start.replace(
                 minute=(current_window_start.minute // AGGREGATION_PERIOD_MINUTES) * AGGREGATION_PERIOD_MINUTES,
                 second=0,
                 microsecond=0
             )
             # And check again if alignment pushed it back
             if current_window_start < start_processing_ts:
                 current_window_start += timedelta(minutes=AGGREGATION_PERIOD_MINUTES) # Move to next full window after start
                 continue # Recalculate end time

        window_end = current_window_start + timedelta(minutes=AGGREGATION_PERIOD_MINUTES)
        
        # Stop if the window end goes beyond the latest available data timestamp
        # Add a small buffer (e.g., 1 second) to ensure we only process *complete* windows
        if window_end > latest_reading_ts + timedelta(seconds=1): 
             logger.debug(f"Stopping window generation. End {window_end.isoformat()}Z > Latest {latest_reading_ts.isoformat()}Z")
             break
        
        # Add the window if its start time is at or after the processing start time
        if current_window_start >= start_processing_ts:
            windows_to_process.append((current_window_start, window_end))
        
        current_window_start = window_end # Move to the next potential window start

    if not windows_to_process:
        logger.info("No complete aggregation windows found with new data.")
        return

    logger.info(f"Identified {len(windows_to_process)} time windows to process.")

    # Process windows sequentially for now, updating state after each success
    total_windows = len(windows_to_process)
    success_count = 0
    last_successful_end_time = None

    for i, (start_time, end_time) in enumerate(windows_to_process):
        logger.info(f"Processing window {i+1}/{total_windows}: {start_time.isoformat()}Z to {end_time.isoformat()}Z")

        # Fetch raw data for this window
        raw_data = await async_get_readings_for_window(start_time, end_time)
        if not raw_data:
            logger.warning(f"No raw data found for window {start_time.isoformat()}Z. Skipping.")
            # If no data, we can potentially still advance the state if desired,
            # but for now, let's only advance on successful processing/sending.
            continue

        # Clean the data - use async version
        cleaned_data = await clean_data_async(raw_data)
        if not cleaned_data:
            logger.warning(f"No valid data after cleaning for window {start_time.isoformat()}Z. Skipping.")
            continue

        # Generate payload
        payload = generate_window_payload(cleaned_data, start_time, end_time)
        if not payload:
            logger.error(f"Failed to generate payload for window {start_time.isoformat()}Z. Skipping.")
            continue
        
        # Send payload to backend
        send_success = await send_to_backend(payload, start_time, end_time)
        
        if send_success:
            success_count += 1
            last_successful_end_time = end_time # Track the end time of the last successful window
            # Update the processing state in the database immediately
            await async_update_processing_state(PROCESSING_STATE_KEY, end_time.isoformat())
            logger.info(f"Successfully processed and sent window ending {end_time.isoformat()}Z. State updated.")
        else:
            logger.error(f"Failed to send data for window {start_time.isoformat()}Z to {end_time.isoformat()}Z. Stopping processing for this run.")
            # Stop processing further windows in this run if one fails, to ensure order
            break 
            
        # Optional: Add a small delay between processing windows
        await asyncio.sleep(0.1) 


    if total_windows > 0:
        processed_message = f"Successfully processed and sent {success_count} of {total_windows} identified windows."
        if last_successful_end_time:
             processed_message += f" Last successful window ended at {last_successful_end_time.isoformat()}Z."
        logger.info(processed_message)
    else:
        logger.info("No windows required processing in this run.")


# run_periodic_aggregation remains mostly the same, but calls the modified process_pending_aggregations
# ... existing code ...
async def run_periodic_aggregation():
    """Run the aggregation process at regular intervals."""
    try:
        # Initialize the async DB pool at startup (creates state table if needed)
        await init_async_db_pool()
        
        # Initial check immediately on start
        try:
            await process_pending_aggregations()
        except Exception as e:
            logger.error(f"Error during initial aggregation check: {e}", exc_info=True)

        while True:
            # Calculate sleep time until the *next* minute boundary past the aggregation interval
            now = datetime.now(pytz.timezone(TIMEZONE)) # Use local timezone for scheduling
            
            minutes_past_interval = now.minute % AGGREGATION_PERIOD_MINUTES
            minutes_to_next_interval = AGGREGATION_PERIOD_MINUTES - minutes_past_interval
            
            # Calculate the exact time of the next run (e.g., 5 seconds past the interval boundary)
            next_run_time = now.replace(second=5, microsecond=0) + timedelta(minutes=minutes_to_next_interval)
            
            sleep_seconds = (next_run_time - now).total_seconds()

            # Ensure sleep time is positive (handles case where calculated time is in the past)
            if sleep_seconds <= 0:
                 # If it's already past the calculated next run time for this cycle,
                 # schedule for the *following* interval.
                 sleep_seconds += AGGREGATION_PERIOD_MINUTES * 60 
                 next_run_time += timedelta(minutes=AGGREGATION_PERIOD_MINUTES)


            logger.info(f"Next aggregation check scheduled for {next_run_time.isoformat()}. Sleeping for {sleep_seconds:.1f} seconds.")
            await asyncio.sleep(sleep_seconds)

            try:
                # Ensure pool is initialized before processing (in case of restart/connection loss)
                await init_async_db_pool() 
                await process_pending_aggregations()
            except Exception as e:
                logger.error(f"Error in periodic aggregation loop: {e}", exc_info=True)
                # Add a short sleep after an error to prevent rapid failing loops
                await asyncio.sleep(60)
    finally:
        # Clean up DB pool when exiting
        global ASYNC_DB_POOL
        if ASYNC_DB_POOL is not None:
            try:
                await ASYNC_DB_POOL.close()
                logger.info("Closed async database pool")
            except Exception as e:
                 logger.error(f"Error closing database pool: {e}")


# main function needs to initialize the state table and remove old index creation
async def main():
    """Main entry point with setup and cleanup."""
    # Basic check for database existence
    if not os.path.exists(DB_PATH):
         logger.error(f"Database file not found at {DB_PATH}. Please ensure the main sensor script has run and created the database with the new schema.")
         return
    else:
         logger.info(f"Using database: {DB_PATH}")

    logger.info("Starting SQLite data aggregator service (Schema v2)")
    
    # Initialize the DB pool and create tables/indexes defined within init_async_db_pool
    try:
         await init_async_db_pool()
         logger.info("Async DB Pool initialized and schema checked/updated.")
    except Exception as e:
         logger.error(f"Fatal error initializing database pool: {e}", exc_info=True)
         return # Cannot proceed without DB pool
    
    # --- Remove synchronous index creation for old tables ---
    # try:
    #     conn = sqlite3.connect(DB_PATH)
    #     cursor = conn.cursor()
    #     # Remove old index creation
    #     # cursor.execute("CREATE INDEX IF NOT EXISTS idx_reading_sessions_timestamp ON reading_sessions(timestamp)")
    #     # cursor.execute("CREATE INDEX IF NOT EXISTS idx_aggregation_periods_device_time ON aggregation_periods(device_id, start_time, end_time)")
    #     conn.commit()
    #     conn.close()
    #     # logger.info("Removed old synchronous index creation logic") # Or just remove silently
    # except Exception as e:
    #     logger.warning(f"Could not connect synchronously to remove old index logic (may not be necessary): {e}")
    
    # Run the aggregation process
    await run_periodic_aggregation()

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())

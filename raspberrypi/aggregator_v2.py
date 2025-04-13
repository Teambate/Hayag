import sqlite3
import json
import math
import time
import asyncio
import aiohttp
from datetime import datetime, timedelta, timezone
import pytz
import os
import logging
import dateutil.parser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('data_aggregator_sqlite')

# Constants
DB_PATH = "sensor_data_new.db"  # Path to the SQLite database
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

# --- Database Helper Functions ---

def get_db_connection():
    """Establish connection to the SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
        conn.row_factory = sqlite3.Row # Return rows as dictionary-like objects
        return conn
    except sqlite3.Error as e:
        logger.error(f"Error connecting to database {DB_PATH}: {e}")
        return None

def check_database_tables():
    """Check if required tables exist in the database and create them if needed."""
    conn = get_db_connection()
    if not conn:
        logger.error("Could not connect to database to check/create tables")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if aggregation_periods table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='aggregation_periods'")
        if not cursor.fetchone():
            logger.info("Creating aggregation_periods table")
            cursor.execute("""
            CREATE TABLE aggregation_periods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                aggregation_type TEXT NOT NULL,
                sample_count INTEGER NOT NULL,
                sent_to_backend INTEGER DEFAULT 0,
                sent_timestamp TEXT,
                payload TEXT
            )
            """)
            
            # Create indexes
            cursor.execute("CREATE INDEX idx_aggregation_periods_time ON aggregation_periods(end_time)")
            cursor.execute("CREATE INDEX idx_aggregation_periods_sent ON aggregation_periods(sent_to_backend)")
            
            conn.commit()
            logger.info("Created aggregation_periods table and indexes")
        
        return True
    
    except sqlite3.Error as e:
        logger.error(f"Error checking/creating database tables: {e}")
        return False
    finally:
        conn.close()

def get_latest_reading_timestamp():
    """Get the timestamp of the most recent reading in the database."""
    conn = get_db_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(timestamp) as latest_ts FROM sensor_readings2")
        result = cursor.fetchone()
        if result and result['latest_ts']:
            # Parse the ISO string timestamp (stored as TEXT)
            return dateutil.parser.isoparse(result['latest_ts'])
        else:
            return None # No readings yet
    except Exception as e:
        logger.error(f"Error getting latest reading timestamp: {e}")
        return None
    finally:
        conn.close()

def get_first_reading_timestamp():
    """Get the timestamp of the first reading in the database."""
    conn = get_db_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MIN(timestamp) as earliest_ts FROM sensor_readings2")
        result = cursor.fetchone()
        if result and result['earliest_ts']:
             # Parse the ISO string timestamp (stored as TEXT)
            return dateutil.parser.isoparse(result['earliest_ts'])
        else:
            return None # No readings yet
    except Exception as e:
        logger.error(f"Error getting first reading timestamp: {e}")
        return None
    finally:
        conn.close()

def get_readings_for_window(start_time, end_time):
    """Fetch sensor readings from the database within a specific time window."""
    conn = get_db_connection()
    if not conn:
        return []

    # Convert times to ISO strings for querying the TEXT column
    start_time_iso = start_time.isoformat()
    end_time_iso = end_time.isoformat()

    readings = []
    try:
        cursor = conn.cursor()
        # Query directly from the denormalized sensor_readings2 table
        query = """
        SELECT
            timestamp,
            device_id,
            panel1_rain,
            panel1_uv,
            panel1_lux,
            panel1_dht_temp,
            panel1_dht_humidity,
            panel1_panel_temp,
            panel1_voltage,
            panel1_current,
            panel1_solar_irrad,
            panel1_battery_voltage,
            panel2_rain,
            panel2_uv,
            panel2_lux,
            panel2_dht_temp,
            panel2_dht_humidity,
            panel2_panel_temp,
            panel2_voltage,
            panel2_current,
            panel2_solar_irrad,
            panel2_battery_voltage
        FROM sensor_readings2
        WHERE timestamp >= ? AND timestamp < ?
        ORDER BY timestamp;
        """
        cursor.execute(query, (start_time_iso, end_time_iso))
        
        for row in cursor.fetchall():
            # Map the denormalized schema to our expected data structure
            reading = {
                'timestamp': dateutil.parser.isoparse(row['timestamp']),
                'rain_1': row['panel1_rain'],
                'rain_2': row['panel2_rain'],
                'uv_1': row['panel1_uv'],
                'uv_2': row['panel2_uv'],
                'lux_1': row['panel1_lux'],
                'lux_2': row['panel2_lux'],
                'dht_temp_1': row['panel1_dht_temp'],
                'dht_humidity_1': row['panel1_dht_humidity'],
                'dht_temp_2': row['panel2_dht_temp'],
                'dht_humidity_2': row['panel2_dht_humidity'],
                'panel_temp_1': row['panel1_panel_temp'],
                'panel_temp_2': row['panel2_panel_temp'],
                'panel_voltage_1': row['panel1_voltage'],
                'panel_current_1': row['panel1_current'],
                'panel_voltage_2': row['panel2_voltage'],
                'panel_current_2': row['panel2_current'],
                'solar_irrad_1': row['panel1_solar_irrad'],
                'solar_irrad_2': row['panel2_solar_irrad'],
                'battery_voltage_1': row['panel1_battery_voltage'],
                'battery_voltage_2': row['panel2_battery_voltage']
            }
            readings.append(reading)

        logger.debug(f"Fetched {len(readings)} reading sets for window {start_time_iso} to {end_time_iso}")
        return readings

    except sqlite3.Error as e:
        logger.error(f"Error fetching readings for window {start_time_iso} - {end_time_iso}: {e}")
        return []
    finally:
        conn.close()

def get_or_create_aggregation_period(start_time, end_time, sample_count):
    """Get existing or create a new aggregation period entry in the database."""
    conn = get_db_connection()
    if not conn:
        return None

    start_time_iso = start_time.isoformat()
    end_time_iso = end_time.isoformat()
    agg_type = f"{AGGREGATION_PERIOD_MINUTES}min"

    try:
        cursor = conn.cursor()
        # Check if this period already exists
        cursor.execute(
            "SELECT id, sent_to_backend FROM aggregation_periods WHERE device_id = ? AND start_time = ? AND end_time = ? AND aggregation_type = ?",
            (DEVICE_ID, start_time_iso, end_time_iso, agg_type)
        )
        result = cursor.fetchone()

        if result:
            logger.debug(f"Found existing aggregation period ID: {result['id']} for window {start_time_iso}")
            return result['id'], bool(result['sent_to_backend']) # Return ID and sent status
        else:
            # Create a new entry
            cursor.execute(
                """INSERT INTO aggregation_periods
                   (device_id, start_time, end_time, aggregation_type, sample_count, sent_to_backend)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (DEVICE_ID, start_time_iso, end_time_iso, agg_type, sample_count, 0)
            )
            conn.commit()
            new_id = cursor.lastrowid
            logger.info(f"Created new aggregation period ID: {new_id} for window {start_time_iso}")
            return new_id, False # Return new ID and sent status (False)

    except sqlite3.Error as e:
        logger.error(f"Error getting/creating aggregation period for {start_time_iso}: {e}")
        return None, False
    finally:
        conn.close()

def mark_period_as_sent(period_id, payload_json):
    """Update the aggregation period entry to mark it as sent."""
    conn = get_db_connection()
    if not conn:
        return False

    sent_timestamp_iso = datetime.now(timezone.utc).isoformat()

    try:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE aggregation_periods
               SET sent_to_backend = 1, sent_timestamp = ?, payload = ?
               WHERE id = ?""",
            (sent_timestamp_iso, payload_json, period_id)
        )
        conn.commit()
        logger.info(f"Marked aggregation period ID: {period_id} as sent at {sent_timestamp_iso}")
        return True
    except sqlite3.Error as e:
        logger.error(f"Error marking aggregation period ID: {period_id} as sent: {e}")
        return False
    finally:
        conn.close()

def get_last_aggregated_timestamp():
    """Get the end_time of the latest successfully processed aggregation period."""
    conn = get_db_connection()
    if not conn:
        # Fallback if DB isn't available - start from scratch or a recent time
        return get_first_reading_timestamp() or (datetime.now(timezone.utc) - timedelta(days=1))

    try:
        cursor = conn.cursor()
        # Find the latest end_time from aggregation_periods table
        cursor.execute(
            "SELECT MAX(end_time) as last_agg_ts FROM aggregation_periods WHERE device_id = ?",
             (DEVICE_ID,)
        )
        result = cursor.fetchone()
        if result and result['last_agg_ts']:
            # Parse the ISO string timestamp
            last_ts = dateutil.parser.isoparse(result['last_agg_ts'])
            # Ensure it's timezone-aware (UTC, as stored by send time)
            if last_ts.tzinfo is None:
                 last_ts = pytz.utc.localize(last_ts)
            logger.info(f"Last successfully aggregated timestamp found: {last_ts.isoformat()}")
            return last_ts
        else:
            # No aggregation periods found, start from the beginning
            logger.info("No previous aggregation periods found. Starting from the first reading.")
            return get_first_reading_timestamp() # Start from the very first reading

    except Exception as e:
        logger.error(f"Error getting last aggregated timestamp: {e}")
        # Fallback to first reading timestamp if error occurs
        return get_first_reading_timestamp()
    finally:
        conn.close()

# --- Data Processing Functions (Mostly similar to CSV version, adapt input/output) ---

def initialize_last_valid_values(start_time):
    """
    Query the database to find the most recent valid values for each sensor 
    prior to the given start_time, to use for forward filling.
    
    This ensures we have historical values to forward fill from, which prevents
    null values in the output and provides data continuity across aggregation windows.
    """
    last_valid_values = {
        'rain_1': None, 'rain_2': None, 'uv_1': None, 'uv_2': None,
        'lux_1': None, 'lux_2': None, 'dht_temp_1': None, 'dht_humidity_1': None,
        'dht_temp_2': None, 'dht_humidity_2': None, 'panel_temp_1': None, 'panel_temp_2': None,
        'panel_voltage_1': None, 'panel_current_1': None, 'panel_voltage_2': None, 'panel_current_2': None,
        'solar_irrad_1': None, 'solar_irrad_2': None, 'battery_voltage_1': None, 'battery_voltage_2': None
    }
    
    # Convert start_time to ISO format for database query
    start_time_iso = start_time.isoformat()
    
    conn = get_db_connection()
    if not conn:
        logger.warning("Could not connect to database for initializing forward-fill values")
        return last_valid_values
    
    try:
        cursor = conn.cursor()
        
        # Query the most recent row before start_time
        query = """
        SELECT 
            panel1_rain, panel2_rain,
            panel1_uv, panel2_uv,
            panel1_lux, panel2_lux,
            panel1_dht_temp, panel1_dht_humidity,
            panel2_dht_temp, panel2_dht_humidity,
            panel1_panel_temp, panel2_panel_temp,
            panel1_voltage, panel1_current,
            panel2_voltage, panel2_current,
            panel1_solar_irrad, panel2_solar_irrad,
            panel1_battery_voltage, panel2_battery_voltage
        FROM sensor_readings2
        WHERE timestamp < ?
        ORDER BY timestamp DESC
        LIMIT 1
        """
        
        cursor.execute(query, (start_time_iso,))
        result = cursor.fetchone()
        
        if result:
            # Map column values to our keys with validation
            mappings = [
                ('rain_1', result['panel1_rain'], 0, 100),
                ('rain_2', result['panel2_rain'], 0, 100),
                ('uv_1', result['panel1_uv'], 0, 15),
                ('uv_2', result['panel2_uv'], 0, 15),
                ('lux_1', result['panel1_lux'], 0, 120000),
                ('lux_2', result['panel2_lux'], 0, 120000),
                ('dht_temp_1', result['panel1_dht_temp'], 10, 60),
                ('dht_temp_2', result['panel2_dht_temp'], 10, 60),
                ('dht_humidity_1', result['panel1_dht_humidity'], 0, 100),
                ('dht_humidity_2', result['panel2_dht_humidity'], 0, 100),
                ('panel_temp_1', result['panel1_panel_temp'], 0, None),
                ('panel_temp_2', result['panel2_panel_temp'], 0, None),
                ('panel_voltage_1', result['panel1_voltage'], 0, None),
                ('panel_voltage_2', result['panel2_voltage'], 0, None),
                ('panel_current_1', result['panel1_current'], 0, None),
                ('panel_current_2', result['panel2_current'], 0, None),
                ('solar_irrad_1', result['panel1_solar_irrad'], 0, 1800),
                ('solar_irrad_2', result['panel2_solar_irrad'], 0, 1800),
                ('battery_voltage_1', result['panel1_battery_voltage'], 0, None),
                ('battery_voltage_2', result['panel2_battery_voltage'], 0, None)
            ]
            
            for key, value, min_val, max_val in mappings:
                validated_value = validate_and_convert_sqlite(value, min_val, max_val)
                if validated_value is not None:
                    last_valid_values[key] = validated_value
                    logger.debug(f"Found historical value for {key}: {validated_value}")
        
        # Log how many sensors we were able to find valid historical values for
        filled_count = sum(1 for v in last_valid_values.values() if v is not None)
        logger.info(f"Initialized {filled_count}/{len(last_valid_values)} sensors with historical values from database")
        
    except sqlite3.Error as e:
        logger.error(f"Error retrieving historical values from database: {e}")
    finally:
        conn.close()
    
    return last_valid_values

def clean_data(rows_from_db):
    """
    Clean the data fetched from the database.
    Handles None values (SQLite NULLs) appropriately.
    Applies forward fill based on historical values and values within the current batch.
    Preserves original validity status for health calculation.
    """
    if not rows_from_db:
        return []
        
    cleaned_rows = []
    
    # Get the earliest timestamp in this batch to initialize historical values
    earliest_timestamp = min(row['timestamp'] for row in rows_from_db)
    
    # Initialize last valid values from DB history (before this batch)
    last_valid_values = initialize_last_valid_values(earliest_timestamp)
    
    # Now process each row in the current batch
    for row_dict in rows_from_db:
        cleaned_row = {'timestamp': row_dict['timestamp']} # Keep the datetime object
        # Also track which values were originally valid (for accurate health calculation)
        validity_flags = {}

        # Define sensor mappings and validation ranges (similar to CSV version)
        # Use row_dict.get(key) to handle potentially missing keys in sparse rows
        sensor_mappings = [
            ('rain_1', row_dict.get('rain_1'), 0, 100),
            ('rain_2', row_dict.get('rain_2'), 0, 100),
            ('uv_1', row_dict.get('uv_1'), 0, 15),
            ('uv_2', row_dict.get('uv_2'), 0, 15),
            ('lux_1', row_dict.get('lux_1'), 0, 120000),
            ('lux_2', row_dict.get('lux_2'), 0, 120000),
            ('dht_temp_1', row_dict.get('dht_temp_1'), 10, 60),
            ('dht_temp_2', row_dict.get('dht_temp_2'), 10, 60),
            ('dht_humidity_1', row_dict.get('dht_humidity_1'), 0, 100),
            ('dht_humidity_2', row_dict.get('dht_humidity_2'), 0, 100),
            ('panel_temp_1', row_dict.get('panel_temp_1'), 0, None),
            ('panel_temp_2', row_dict.get('panel_temp_2'), 0, None),
            ('panel_voltage_1', row_dict.get('panel_voltage_1'), 0, None),
            ('panel_voltage_2', row_dict.get('panel_voltage_2'), 0, None),
            ('panel_current_1', row_dict.get('panel_current_1'), 0, None),
            ('panel_current_2', row_dict.get('panel_current_2'), 0, None),
            ('solar_irrad_1', row_dict.get('solar_irrad_1'), 0, 1800),
            ('solar_irrad_2', row_dict.get('solar_irrad_2'), 0, 1800),
            ('battery_voltage_1', row_dict.get('battery_voltage_1'), 0, None),
            ('battery_voltage_2', row_dict.get('battery_voltage_2'), 0, None)
        ]

        # First pass: validate and track validity
        for key, value, min_val, max_val in sensor_mappings:
            # Store original validity before any forward fill
            validated_value = validate_and_convert_sqlite(value, min_val, max_val)
            # Track if this reading was originally valid (not null)
            validity_flags[key] = validated_value is not None
            
            if validated_value is not None:
                # Valid value, update the last valid value for this key
                last_valid_values[key] = validated_value
                cleaned_row[key] = validated_value
            else:
                # Invalid or missing value, use forward fill from the last known valid value
                if last_valid_values[key] is not None:
                    cleaned_row[key] = last_valid_values[key]
                    logger.debug(f"Forward filling {key} with value {last_valid_values[key]} at {row_dict['timestamp']}")
                else:
                    # Edge case: no valid reading has ever been recorded for this sensor
                    cleaned_row[key] = 0.0
                    logger.debug(f"No historical data ever found for {key}, using 0.0 at {row_dict['timestamp']}")
        
        # Store validity flags for health calculation
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

# --- Backend Communication (Identical to CSV version) ---

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

async def send_to_backend(period_id, data_payload):
    """Send the aggregated data payload to the backend service asynchronously."""
    global AUTH_TOKEN

    if not AUTH_TOKEN:
        logger.info("No auth token, attempting login first.")
        auth_success = await login()
        if not auth_success:
            logger.error("Failed to authenticate, cannot send data for period {period_id}")
            return False

    headers = {'Content-Type': 'application/json'}
    # Use the stored token if available and not the placeholder
    cookies = {'token': AUTH_TOKEN} if AUTH_TOKEN and AUTH_TOKEN != "implicit_session" else None

    try:
        async with aiohttp.ClientSession(cookies=cookies) as session: # Pass cookies to session if we have them
            async with session.post(
                BACKEND_API_URL,
                json=data_payload,
                headers=headers,
                timeout=30 # Add timeout for sending data
                # Cookies automatically handled by session if passed during creation
            ) as response:
                if response.status == 200 or response.status == 201:
                    logger.info(f"Data for period {period_id} successfully sent. Response: {response.status}")
                    # Mark as sent in DB
                    payload_str = json.dumps(data_payload) # Store the sent payload
                    if mark_period_as_sent(period_id, payload_str):
                        return True
                    else:
                        logger.error(f"Data sent for period {period_id}, but failed to mark as sent in DB!")
                        return False # Treat as failure if DB update fails
                elif response.status == 401: # Unauthorized
                    logger.warning(f"Authentication failed for period {period_id} (401). Token might be invalid/expired.")
                    AUTH_TOKEN = None # Clear token to force re-login on next attempt
                    # Don't retry immediately within this function, let the main loop handle retry logic
                    return False
                else:
                    response_text = await response.text()
                    logger.error(f"Error response from backend for period {period_id}: {response.status} - {response_text}")
                    return False
    except aiohttp.ClientConnectorError as e:
         logger.error(f"Connection error sending data for period {period_id}: {e}")
         return False
    except asyncio.TimeoutError:
        logger.error(f"Timeout sending data for period {period_id}.")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending data for period {period_id}: {e}")
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
    """Processes data for aggregation periods based on DB records."""
    logger.info("Checking for data to aggregate and send...")

    # Determine the timestamp to start processing from
    last_processed_ts = get_last_aggregated_timestamp()
    if last_processed_ts is None:
        logger.info("No readings found in the database yet.")
        return # Nothing to process if DB is empty

    # Ensure last_processed_ts is naive UTC for comparison/calculation
    # (pytz localize might make it specific, we want generic UTC)
    if last_processed_ts.tzinfo is not None:
        last_processed_ts = last_processed_ts.astimezone(pytz.utc).replace(tzinfo=None)
    
    logger.info(f"Starting aggregation process from: {last_processed_ts.isoformat()}Z")

    # Find the latest reading timestamp available
    latest_reading_ts = get_latest_reading_timestamp()
    if latest_reading_ts is None or latest_reading_ts <= last_processed_ts:
        logger.info("No new readings found since the last aggregation.")
        return

    # Ensure latest_reading_ts is naive UTC
    if latest_reading_ts.tzinfo is not None:
        latest_reading_ts = latest_reading_ts.astimezone(pytz.utc).replace(tzinfo=None)

    # Calculate the time windows to process
    current_window_start = last_processed_ts
    # Align the start time to the beginning of its aggregation window
    current_window_start = current_window_start.replace(
        minute=(current_window_start.minute // AGGREGATION_PERIOD_MINUTES) * AGGREGATION_PERIOD_MINUTES,
        second=0,
        microsecond=0
    )

    windows_to_process = []
    while True:
        window_end = current_window_start + timedelta(minutes=AGGREGATION_PERIOD_MINUTES)
        # Stop if the window end goes beyond the latest available data
        if window_end > latest_reading_ts + timedelta(seconds=1): # Add a small buffer
             break
        windows_to_process.append((current_window_start, window_end))
        current_window_start = window_end # Move to the next window

    if not windows_to_process:
        logger.info("No complete aggregation windows found with new data.")
        return

    logger.info(f"Identified {len(windows_to_process)} time windows to process.")

    # Process each identified window
    success_count = 0
    total_windows = len(windows_to_process)
    
    # Use connection pooling by reusing the same connection for the entire batch
    conn = get_db_connection()
    if not conn:
        logger.error("Failed to connect to database for batch processing")
        return
    
    try:
        # Process each identified window using the same connection
        for start_time, end_time in windows_to_process:
            logger.info(f"Processing window: {start_time.isoformat()}Z to {end_time.isoformat()}Z")

            # Fetch raw data for this window (using the same connection)
            start_time_iso = start_time.isoformat()
            end_time_iso = end_time.isoformat()
            
            try:
                cursor = conn.cursor()
                query = """
                SELECT
                    timestamp,
                    device_id,
                    panel1_rain,
                    panel1_uv,
                    panel1_lux,
                    panel1_dht_temp,
                    panel1_dht_humidity,
                    panel1_panel_temp,
                    panel1_voltage,
                    panel1_current,
                    panel1_solar_irrad,
                    panel1_battery_voltage,
                    panel2_rain,
                    panel2_uv,
                    panel2_lux,
                    panel2_dht_temp,
                    panel2_dht_humidity,
                    panel2_panel_temp,
                    panel2_voltage,
                    panel2_current,
                    panel2_solar_irrad,
                    panel2_battery_voltage
                FROM sensor_readings2
                WHERE timestamp >= ? AND timestamp < ?
                ORDER BY timestamp;
                """
                cursor.execute(query, (start_time_iso, end_time_iso))
                
                raw_data = []
                for row in cursor.fetchall():
                    # Map the denormalized schema to our expected data structure
                    reading = {
                        'timestamp': dateutil.parser.isoparse(row['timestamp']),
                        'rain_1': row['panel1_rain'],
                        'rain_2': row['panel2_rain'],
                        'uv_1': row['panel1_uv'],
                        'uv_2': row['panel2_uv'],
                        'lux_1': row['panel1_lux'],
                        'lux_2': row['panel2_lux'],
                        'dht_temp_1': row['panel1_dht_temp'],
                        'dht_humidity_1': row['panel1_dht_humidity'],
                        'dht_temp_2': row['panel2_dht_temp'],
                        'dht_humidity_2': row['panel2_dht_humidity'],
                        'panel_temp_1': row['panel1_panel_temp'],
                        'panel_temp_2': row['panel2_panel_temp'],
                        'panel_voltage_1': row['panel1_voltage'],
                        'panel_current_1': row['panel1_current'],
                        'panel_voltage_2': row['panel2_voltage'],
                        'panel_current_2': row['panel2_current'],
                        'solar_irrad_1': row['panel1_solar_irrad'],
                        'solar_irrad_2': row['panel2_solar_irrad'],
                        'battery_voltage_1': row['panel1_battery_voltage'],
                        'battery_voltage_2': row['panel2_battery_voltage']
                    }
                    raw_data.append(reading)
            except sqlite3.Error as e:
                logger.error(f"Error fetching readings for window {start_time_iso} - {end_time_iso}: {e}")
                raw_data = []
            
            if not raw_data:
                logger.warning(f"No raw data found for window {start_time.isoformat()}Z. Skipping.")
                continue

            logger.info(f"Fetched {len(raw_data)} reading sets for this window.")

            # Clean the data
            cleaned_data = clean_data(raw_data)
            if not cleaned_data:
                logger.warning(f"No valid data after cleaning for window {start_time.isoformat()}Z. Skipping.")
                continue

            logger.info(f"Successfully cleaned {len(cleaned_data)} rows for this window.")

            # Generate payload
            payload = generate_window_payload(cleaned_data, start_time, end_time)
            if not payload:
                logger.error(f"Failed to generate payload for window {start_time.isoformat()}Z.")
                continue

            # Get or create the aggregation period entry in DB
            # This uses the same connection from earlier for better performance
            try:
                cursor = conn.cursor()
                agg_type = f"{AGGREGATION_PERIOD_MINUTES}min"
                
                # Check if this period already exists
                cursor.execute(
                    "SELECT id, sent_to_backend FROM aggregation_periods WHERE device_id = ? AND start_time = ? AND end_time = ? AND aggregation_type = ?",
                    (DEVICE_ID, start_time_iso, end_time_iso, agg_type)
                )
                result = cursor.fetchone()
                
                if result:
                    period_id = result['id']
                    already_sent = bool(result['sent_to_backend']) 
                    logger.debug(f"Found existing aggregation period ID: {period_id} for window {start_time_iso}")
                else:
                    # Create a new entry
                    cursor.execute(
                        """INSERT INTO aggregation_periods
                           (device_id, start_time, end_time, aggregation_type, sample_count, sent_to_backend)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (DEVICE_ID, start_time_iso, end_time_iso, agg_type, len(cleaned_data), 0)
                    )
                    conn.commit()
                    period_id = cursor.lastrowid
                    already_sent = False
                    logger.info(f"Created new aggregation period ID: {period_id} for window {start_time_iso}")
            except sqlite3.Error as e:
                logger.error(f"Error getting/creating aggregation period for {start_time_iso}: {e}")
                continue
            
            # If it was already sent successfully, skip sending again
            if already_sent:
                logger.info(f"Window {start_time.isoformat()}Z (ID: {period_id}) was already sent. Skipping.")
                success_count += 1 # Count it as success for progress tracking
                continue

            # Send to backend
            send_success = await send_to_backend(period_id, payload)

            if send_success:
                success_count += 1
                # Mark as sent in DB using the same connection
                try:
                    sent_timestamp_iso = datetime.now(timezone.utc).isoformat()
                    payload_str = json.dumps(payload)
                    
                    cursor = conn.cursor()
                    cursor.execute(
                        """UPDATE aggregation_periods
                           SET sent_to_backend = 1, sent_timestamp = ?, payload = ?
                           WHERE id = ?""",
                        (sent_timestamp_iso, payload_str, period_id)
                    )
                    conn.commit()
                    logger.info(f"Marked aggregation period ID: {period_id} as sent at {sent_timestamp_iso}")
                except sqlite3.Error as e:
                    logger.error(f"Error marking aggregation period ID: {period_id} as sent: {e}")
            else:
                logger.error(f"Failed to send data for window {start_time.isoformat()}Z (ID: {period_id}). Will retry later.")
    
    finally:
        # Close the connection when done with all windows
        conn.close()

    if total_windows > 0:
        logger.info(f"Processing complete. Successfully sent/confirmed {success_count} of {total_windows} identified windows.")
    else:
        logger.info("No windows required processing in this run.")


async def run_periodic_aggregation():
    """Run the aggregation process at regular intervals."""
    # Initial check immediately on start
    try:
        await process_pending_aggregations()
    except Exception as e:
        logger.error(f"Error during initial aggregation check: {e}", exc_info=True)

    while True:
        # Calculate sleep time until the *next* minute boundary past the aggregation interval
        # e.g., if interval is 5 min, run at :05, :10, :15, etc.
        now = datetime.now(pytz.timezone(TIMEZONE)) # Use local timezone for scheduling
        
        # How many minutes past the last interval?
        minutes_past_interval = now.minute % AGGREGATION_PERIOD_MINUTES
        
        # How many minutes until the next interval starts?
        minutes_to_next_interval = AGGREGATION_PERIOD_MINUTES - minutes_past_interval
        
        # Calculate the exact time of the next run
        next_run_time = now.replace(second=5, microsecond=0) + timedelta(minutes=minutes_to_next_interval)
        # Add a small buffer (5 seconds) past the minute mark
        
        sleep_seconds = (next_run_time - now).total_seconds()

        # Ensure sleep time is positive
        if sleep_seconds <= 0:
             sleep_seconds = (next_run_time + timedelta(minutes=AGGREGATION_PERIOD_MINUTES) - now).total_seconds()

        logger.info(f"Next aggregation check scheduled for {next_run_time.isoformat()}. Sleeping for {sleep_seconds:.1f} seconds.")
        await asyncio.sleep(sleep_seconds)

        try:
            await process_pending_aggregations()
        except Exception as e:
            logger.error(f"Error in periodic aggregation loop: {e}", exc_info=True)
            # Add a short sleep after an error to prevent rapid failing loops
            await asyncio.sleep(60)


if __name__ == "__main__":
    # Basic check for database existence
    if not os.path.exists(DB_PATH):
         logger.error(f"Database file not found at {DB_PATH}. Please ensure sensor_main.py has run and created the database.")
         # Exit or wait? For now, log error and continue, maybe it gets created.
    else:
         logger.info(f"Using database: {DB_PATH}")
         # Check and initialize tables if needed
         if not check_database_tables():
             logger.error("Failed to initialize database tables. Aggregation may not work correctly.")

    logger.info("Starting SQLite data aggregator service with improved denormalized schema")
    
    # Add database performance optimizations
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            # Enable WAL mode for better concurrency and performance
            cursor.execute("PRAGMA journal_mode=WAL")
            # Set synchronous level to NORMAL for better performance
            cursor.execute("PRAGMA synchronous=NORMAL")
            # Set cache size to 10000 pages (about 40MB with default page size)
            cursor.execute("PRAGMA cache_size=10000")
            logger.info("Applied database performance optimizations")
            conn.close()
        except Exception as e:
            logger.error(f"Failed to apply database optimizations: {e}")
            if conn:
                conn.close()
    
    # Start the aggregation process
    asyncio.run(run_periodic_aggregation())

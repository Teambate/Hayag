import csv
import sqlite3
import os
import sys
from datetime import datetime
import dateutil.parser

# Constants
DB_PATH = "sensor_data_new.db"  # Updated to match the new database path
DEVICE_ID = "SOLAR_01"  # Should match aggregator_sqlite.py and sensor_main.py

def get_db_connection():
    """Establish connection to the SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
        conn.row_factory = sqlite3.Row  # Return rows as dictionary-like objects
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database {DB_PATH}: {e}")
        return None

def parse_csv_datetime(date_str, time_str):
    """Convert CSV date and time to ISO format timestamp."""
    # Parse the date (MM/DD/YY) and time (12-hour format)
    try:
        # Combine date and time for parsing
        datetime_str = f"{date_str} {time_str}"
        # Parse using dateutil for flexibility
        dt = dateutil.parser.parse(datetime_str)
        # Return ISO format timestamp with timezone information
        return dt.isoformat()
    except Exception as e:
        print(f"Error parsing datetime '{date_str} {time_str}': {e}")
        return None

def import_csv_to_sqlite(csv_file):
    """Import sensor data from CSV to SQLite database using the new schema."""
    if not os.path.exists(csv_file):
        print(f"CSV file not found: {csv_file}")
        return False
    
    conn = get_db_connection()
    if not conn:
        return False
    
    # Define the mapping from CSV column to database fields
    # Format: csv_column: database_column
    column_mapping = {
        "Rain Readings 1 (%)": "panel1_rain",
        "UV 1 (mW/cm²)": "panel1_uv",
        "Lux 1 (lux)": "panel1_lux",
        "DHT Temperature 1 (°C)": "panel1_dht_temp",
        "DHT Humidity 1 (%)": "panel1_dht_humidity",
        "Panel Temperature 1 (°C)": "panel1_panel_temp",
        "Panel Voltage 1 (V)": "panel1_voltage",
        "Panel Current 1 (mA)": "panel1_current",
        "Irradiance 1 (W/m²)": "panel1_solar_irrad",
        "Battery Voltage 1 (V)": "panel1_battery_voltage",
        "Rain Readings 2 (%)": "panel2_rain",
        "UV 2 (mW/cm²)": "panel2_uv",
        "Lux 2 (lux)": "panel2_lux",
        "DHT Temperature 2 (°C)": "panel2_dht_temp",
        "DHT Humidity 2 (%)": "panel2_dht_humidity",
        "Panel Temperature 2 (°C)": "panel2_panel_temp",
        "Panel Voltage 2 (V)": "panel2_voltage",
        "Panel Current 2 (mA)": "panel2_current",
        "Irradiance 2 (W/m²)": "panel2_solar_irrad",
        "Battery Voltage 2 (V)": "panel2_battery_voltage"
    }
    
    try:
        # Process the CSV file in chunks to avoid memory issues
        print(f"Processing CSV file in chunks to reduce memory usage...")
        
        # Get header row first to initialize the CSV reader
        with open(csv_file, 'r', errors='replace') as f:
            # Read just the header line
            header = f.readline().strip().split(',')
        
        # Initialize counters
        rows_processed = 0
        chunk_size = 1000
        cursor = conn.cursor()
        
        # Open file for reading in chunks
        with open(csv_file, 'r', errors='replace') as f:
            # Skip header row since we already read it
            next(f)
            
            # Process file in chunks
            while True:
                chunk_data = []
                # Read chunk_size lines
                for _ in range(chunk_size):
                    line = f.readline()
                    if not line:
                        break
                    # Clean NULL bytes from lines instead of skipping
                    if '\0' in line:
                        line = line.replace('\0', '')
                    chunk_data.append(line)
                
                # If no data was read, we're done
                if not chunk_data:
                    break
                
                # Process this chunk
                for line in chunk_data:
                    # Parse CSV row (handle quotes and commas properly)
                    row_values = next(csv.reader([line]))
                    
                    # Create a dictionary mapping column names to values
                    row = dict(zip(header, row_values))
                    
                    # Parse timestamp
                    timestamp = parse_csv_datetime(row.get('Date', ''), row.get('Time (12-hr format)', ''))
                    if not timestamp:
                        print(f"Skipping row with invalid datetime")
                        continue
                    
                    # Prepare the data for insertion
                    data = {"timestamp": timestamp, "device_id": DEVICE_ID}
                    
                    # Add all sensor readings to the data dictionary
                    for csv_column, db_column in column_mapping.items():
                        if csv_column in row:
                            value = row[csv_column]
                            # Convert empty strings to None for SQLite
                            data[db_column] = None if value == '' else value
                    
                    # Build the SQL INSERT statement dynamically
                    columns = list(data.keys())
                    placeholders = ["?"] * len(columns)
                    values = [data[col] for col in columns]
                    
                    sql = f"INSERT INTO sensor_readings2 ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                    
                    # Execute the INSERT
                    cursor.execute(sql, values)
                    
                    rows_processed += 1
                    if rows_processed % 10 == 0:
                        print(f"Processed {rows_processed} rows...")
                
                # Commit after each chunk
                conn.commit()
                print(f"Committed {rows_processed} rows to database")
            
            # Final commit
            conn.commit()
            print(f"Successfully imported {rows_processed} records from CSV to SQLite")
            return True
            
    except Exception as e:
        print(f"Error importing CSV: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    # Check if CSV file is provided as argument
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        csv_file = "sensor_data.csv"  # Default filename
    
    # Check if the database exists
    if not os.path.exists(DB_PATH):
        print(f"Database file {DB_PATH} not found. Creating it...")
        try:
            # Connect to create the database
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Read and execute the schema SQL file
            with open('new_schema.sql', 'r') as schema_file:
                schema_sql = schema_file.read()
                cursor.executescript(schema_sql)
            
            conn.commit()
            conn.close()
            print(f"Created new database with schema from new_schema.sql")
        except Exception as e:
            print(f"Error creating database: {e}")
            sys.exit(1)
    
    print(f"Importing data from {csv_file} to {DB_PATH}...")
    if import_csv_to_sqlite(csv_file):
        print("Import completed successfully.")
    else:
        print("Import failed.") 
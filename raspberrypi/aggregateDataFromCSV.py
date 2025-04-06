import pandas as pd
import numpy as np
import json
from datetime import datetime
import io
import sys
import os
import signal
import pytz  # For timezone handling

# Handle pipe errors gracefully
signal.signal(signal.SIGPIPE, signal.SIG_DFL)

# Define Manila timezone
MANILA_TZ = pytz.timezone('Asia/Manila')

def aggregate_solar_data(csv_filepath, device_id="SOLAR_01"):
    # Read the CSV data
    df = pd.read_csv(csv_filepath)
    
    # Print column names for debugging
    print("Available columns in CSV file:", df.columns.tolist())
    
    # Convert Date and Time columns to a datetime column
    df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time(12-hrformat)'], format='%m/%d/%y %I:%M:%S %p')
    
    # Apply Manila timezone
    df['datetime'] = df['datetime'].dt.tz_localize(MANILA_TZ)
    
    # Create a new column for 5-minute groups
    df['5min_group'] = df['datetime'].dt.floor('5min')
    
    # Group by the 5-minute intervals
    grouped = df.groupby('5min_group')
    
    # Initialize the result array
    result = []
    
    for group_time, group_data in grouped:
        # Calculate the startTime and endTime
        start_time = group_time
        end_time = start_time + pd.Timedelta(minutes=5)
        
        # Count the number of samples in this group
        sample_count = len(group_data)
        
        # Initialize the result object for this group
        group_result = {
            "deviceId": device_id,
            "startTime": start_time.isoformat(),
            "endTime": end_time.isoformat(),
            "metadata": {
                "aggregationType": "5min",
                "sampleCount": sample_count,
                "timezone": "Asia/Manila"
            },
            "readings": {
                "rain": [],
                "uv": [],
                "light": [],
                "dht22": [],
                "panel_temp": [],
                "ina226": [],
                "solar": [],
                "battery": [],
                "battery_capacity": 0
            }
        }
        
        # Helper function to calculate stats safely
        def calculate_stats(series):
            series = series.dropna()
            if len(series) == 0:
                return {"average": None, "min": None, "max": None}
            return {
                "average": float(series.mean()),
                "min": float(series.min()),
                "max": float(series.max())
            }
        
        # Process Panel_1 rain data - using the correct column name 'RainReadings1(%)'
        if 'RainReadings1(%)' in group_data.columns:
            panel1_rain_stats = calculate_stats(group_data['RainReadings1(%)'])
            if panel1_rain_stats["average"] is not None:
                panel1_rain = {
                    "panelId": "Panel_1",
                    **panel1_rain_stats,
                    "unit": "%"
                }
                group_result["readings"]["rain"].append(panel1_rain)
        
        # Process Panel_2 rain data
        if 'RainReadings2(%)' in group_data.columns:
            panel2_rain_stats = calculate_stats(group_data['RainReadings2(%)'])
            if panel2_rain_stats["average"] is not None:
                panel2_rain = {
                    "panelId": "Panel_2",
                    **panel2_rain_stats,
                    "unit": "%"
                }
                group_result["readings"]["rain"].append(panel2_rain)
        
        # UV readings
        if 'UV1(mW/cm²)' in group_data.columns:
            panel1_uv_stats = calculate_stats(group_data['UV1(mW/cm²)'])
            if panel1_uv_stats["average"] is not None:
                panel1_uv = {
                    "panelId": "Panel_1",
                    **panel1_uv_stats,
                    "unit": "mW/cm2"
                }
                group_result["readings"]["uv"].append(panel1_uv)
        
        if 'UV2(mW/cm²)' in group_data.columns:
            panel2_uv_stats = calculate_stats(group_data['UV2(mW/cm²)'])
            if panel2_uv_stats["average"] is not None:
                panel2_uv = {
                    "panelId": "Panel_2",
                    **panel2_uv_stats,
                    "unit": "mW/cm2"
                }
                group_result["readings"]["uv"].append(panel2_uv)
        
        # Light readings
        if 'Lux1(lux)' in group_data.columns:
            panel1_light_stats = calculate_stats(group_data['Lux1(lux)'])
            if panel1_light_stats["average"] is not None:
                panel1_light = {
                    "panelId": "Panel_1",
                    **panel1_light_stats,
                    "unit": "lux"
                }
                group_result["readings"]["light"].append(panel1_light)
        
        if 'Lux2(lux)' in group_data.columns:
            panel2_light_stats = calculate_stats(group_data['Lux2(lux)'])
            if panel2_light_stats["average"] is not None:
                panel2_light = {
                    "panelId": "Panel_2",
                    **panel2_light_stats,
                    "unit": "lux"
                }
                group_result["readings"]["light"].append(panel2_light)
        
        # DHT22 readings
        # Panel 1
        temp1_col = 'DHTTemperature1(°C)' if 'DHTTemperature1(°C)' in group_data.columns else None
        humidity1_col = 'DHTHumidity1(%)' if 'DHTHumidity1(%)' in group_data.columns else None
        
        if temp1_col or humidity1_col:
            panel1_dht22 = {"panelId": "Panel_1"}
            
            if temp1_col:
                temp1_stats = calculate_stats(group_data[temp1_col])
                panel1_dht22["temperature"] = {**temp1_stats, "unit": "°C"}
                
            if humidity1_col:
                humidity1_stats = calculate_stats(group_data[humidity1_col])
                panel1_dht22["humidity"] = {**humidity1_stats, "unit": "%"}
                
            group_result["readings"]["dht22"].append(panel1_dht22)
        
        # Panel 2
        temp2_col = 'DHTTemperature2(°C)' if 'DHTTemperature2(°C)' in group_data.columns else None
        humidity2_col = 'DHTHumidity2(%)' if 'DHTHumidity2(%)' in group_data.columns else None
        
        if temp2_col or humidity2_col:
            panel2_dht22 = {"panelId": "Panel_2"}
            
            if temp2_col:
                temp2_stats = calculate_stats(group_data[temp2_col])
                panel2_dht22["temperature"] = {**temp2_stats, "unit": "°C"}
                
            if humidity2_col:
                humidity2_stats = calculate_stats(group_data[humidity2_col])
                panel2_dht22["humidity"] = {**humidity2_stats, "unit": "%"}
                
            group_result["readings"]["dht22"].append(panel2_dht22)
        
        # Panel Temperature
        temp1_col = 'PanelTemperature1(°C)' if 'PanelTemperature1(°C)' in group_data.columns else None
        if temp1_col:
            panel1_temp_stats = calculate_stats(group_data[temp1_col])
            if panel1_temp_stats["average"] is not None:
                panel1_temp = {
                    "panelId": "Panel_1",
                    **panel1_temp_stats,
                    "unit": "°C"
                }
                group_result["readings"]["panel_temp"].append(panel1_temp)
        
        temp2_col = 'PanelTemperature2(°C)' if 'PanelTemperature2(°C)' in group_data.columns else None
        if temp2_col:
            panel2_temp_stats = calculate_stats(group_data[temp2_col])
            if panel2_temp_stats["average"] is not None:
                panel2_temp = {
                    "panelId": "Panel_2",
                    **panel2_temp_stats,
                    "unit": "°C"
                }
                group_result["readings"]["panel_temp"].append(panel2_temp)
        
        # INA226 (Panel Voltage and Current)
        voltage1_col = 'PanelVoltage1(V)' if 'PanelVoltage1(V)' in group_data.columns else None
        current1_col = 'PanelCurrent1(mA)' if 'PanelCurrent1(mA)' in group_data.columns else None
        
        if voltage1_col or current1_col:
            panel1_ina226 = {"panelId": "Panel_1"}
            
            if voltage1_col:
                voltage1_stats = calculate_stats(group_data[voltage1_col])
                panel1_ina226["voltage"] = {**voltage1_stats, "unit": "V"}
                
            if current1_col:
                current1_stats = calculate_stats(group_data[current1_col])
                panel1_ina226["current"] = {**current1_stats, "unit": "mA"}
                
            group_result["readings"]["ina226"].append(panel1_ina226)
        
        voltage2_col = 'PanelVoltage2(V)' if 'PanelVoltage2(V)' in group_data.columns else None
        current2_col = 'PanelCurrent2(mA)' if 'PanelCurrent2(mA)' in group_data.columns else None
        
        if voltage2_col or current2_col:
            panel2_ina226 = {"panelId": "Panel_2"}
            
            if voltage2_col:
                voltage2_stats = calculate_stats(group_data[voltage2_col])
                panel2_ina226["voltage"] = {**voltage2_stats, "unit": "V"}
                
            if current2_col:
                current2_stats = calculate_stats(group_data[current2_col])
                panel2_ina226["current"] = {**current2_stats, "unit": "mA"}
                
            group_result["readings"]["ina226"].append(panel2_ina226)
        
        # Solar irradiance
        irradiance1_col = 'Irradiance1(W/m²)' if 'Irradiance1(W/m²)' in group_data.columns else None
        if irradiance1_col:
            irradiance1_stats = calculate_stats(group_data[irradiance1_col])
            if irradiance1_stats["average"] is not None:
                panel1_solar = {
                    "panelId": "Panel_1",
                    **irradiance1_stats,
                    "unit": "W/m2"
                }
                group_result["readings"]["solar"].append(panel1_solar)
        
        irradiance2_col = 'Irradiance2(W/m²)' if 'Irradiance2(W/m²)' in group_data.columns else None
        if irradiance2_col:
            irradiance2_stats = calculate_stats(group_data[irradiance2_col])
            if irradiance2_stats["average"] is not None:
                panel2_solar = {
                    "panelId": "Panel_2",
                    **irradiance2_stats,
                    "unit": "W/m2"
                }
                group_result["readings"]["solar"].append(panel2_solar)
        
        # Battery voltage
        battery1_col = 'BatteryVoltage1(V)' if 'BatteryVoltage1(V)' in group_data.columns else None
        if battery1_col:
            battery1_stats = calculate_stats(group_data[battery1_col])
            if battery1_stats["average"] is not None:
                panel1_battery = {
                    "panelId": "Panel_1",
                    **battery1_stats,
                    "unit": "V"
                }
                group_result["readings"]["battery"].append(panel1_battery)
        
        battery2_col = 'BatteryVoltage2(V)' if 'BatteryVoltage2(V)' in group_data.columns else None
        if battery2_col:
            battery2_stats = calculate_stats(group_data[battery2_col])
            if battery2_stats["average"] is not None:
                panel2_battery = {
                    "panelId": "Panel_2",
                    **battery2_stats,
                    "unit": "V"
                }
                group_result["readings"]["battery"].append(panel2_battery)
        
        # Add the result to the array
        result.append(group_result)
    
    return result

def save_to_json(data, output_filepath):
    """Save the data to a JSON file"""
    with open(output_filepath, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Data successfully saved to {output_filepath}")

# Example usage
if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Usage: python aggregateDataFromCSV.py <input_csv_file> [output_json_file]")
        print("If output_json_file is not provided, it will use the input filename with .json extension")
        
        # Default example with sample data if no arguments provided
        print("\nRunning with sample data...")
        csv_data = """Date,Time(12-hrformat),RainReadings1(%),UV1(mW/cm²),Lux1(lux),DHTTemperature1(°C),DHTHumidity1(%),PanelTemperature1(°C),PanelVoltage1(V),PanelCurrent1(mA),Irradiance1(W/m²),BatteryVoltage1(V),RainReadings2(%),UV2(mW/cm²),Lux2(lux),DHTTemperature2(°C),DHTHumidity2(%),PanelTemperature2(°C),PanelVoltage2(V),PanelCurrent2(mA),Irradiance2(W/m²),BatteryVoltage2(V)
3/14/25,10:05:21 AM,2.696969697,1.715469613,18019.2768,27.10000038,99.90000153,31.1875,14.06625,2703.5,,12.808125,2.257575758,0.901243094,10628.8896,30.39999962,99.90000153,29.3125,13.27875,1727.5,,14.108125
3/14/25,10:05:23 AM,2.912878788,1.708218232,18008.5248,31.79999924,99.90000153,31.1875,14.7225,2703,574,12.7925,2.386363636,0.893991713,10648.2432,30.39999962,99.90000153,29.3125,13.27875,1728,416,14.0975
"""
        # Save the CSV data to a temporary file
        with open("solar_data.csv", "w") as f:
            f.write(csv_data)
        
        # Process the data with default file
        result = aggregate_solar_data("solar_data.csv")
        save_to_json(result, "solar_data_output.json")
        sys.exit(0)
    
    # Get input and output file paths
    input_csv = sys.argv[1]
    
    # If output file is not provided, create one based on input filename
    if len(sys.argv) > 2:
        output_json = sys.argv[2]
    else:
        # Extract the base filename without extension and add .json
        base_filename = os.path.splitext(os.path.basename(input_csv))[0]
        output_json = f"{base_filename}_processed.json"
    
    try:
        # Process the data
        result = aggregate_solar_data(input_csv)
        
        # Save the result to a JSON file
        save_to_json(result, output_json)
        
        # Print confirmation
        print(f"Successfully processed {input_csv}")
        print(f"Output saved to {output_json}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
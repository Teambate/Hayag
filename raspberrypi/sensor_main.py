from smbus2 import SMBus
import time
import serial
import struct
from RPi import GPIO
import board
import Adafruit_DHT
import busio
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from w1thermsensor import W1ThermSensor
import adafruit_veml7700
from adafruit_extended_bus import ExtendedI2C
import math  # For isnan checking if needed
#For Flask and HTML webpage rendering
import threading
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
import eventlet
import csv
import math
from datetime import datetime
import os
import sqlite3
import json
import traceback

# SQLite database configuration
DB_PATH = "sensor_data_new.db"
DEVICE_ID = "SOLAR_01"  # Match the device ID used in data_aggregator.py

def init_database():
    """Initialize SQLite database if it doesn't exist and create required tables"""
    try:
        # Check if database file already exists
        db_exists = os.path.exists(DB_PATH)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if tables exist by querying sqlite_master
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sensor_readings2'")
        tables_exist = cursor.fetchone() is not None
        
        if not db_exists or not tables_exist:
            print(f"Creating tables in SQLite database at {DB_PATH}")
            
            # Read and execute the schema SQL file
            with open('new_schema.sql', 'r') as schema_file:
                schema_sql = schema_file.read()
                cursor.executescript(schema_sql)
                
            print("Database schema initialized with new schema")
        else:
            print(f"Using existing database at {DB_PATH} with existing tables")
        
        conn.close()
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        traceback.print_exc()
        return False

def store_sensor_readings_in_db(timestamp, data):
    """Store sensor readings in SQLite database using the new schema"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Insert data into the new flat table structure
        cursor.execute(
            """
            INSERT INTO sensor_readings2 (
                timestamp, device_id,
                panel1_rain, panel1_uv, panel1_lux, panel1_dht_temp, panel1_dht_humidity, 
                panel1_panel_temp, panel1_voltage, panel1_current, panel1_solar_irrad, panel1_battery_voltage,
                panel2_rain, panel2_uv, panel2_lux, panel2_dht_temp, panel2_dht_humidity, 
                panel2_panel_temp, panel2_voltage, panel2_current, panel2_solar_irrad, panel2_battery_voltage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp.isoformat(), DEVICE_ID,
                data.get("rain1"), data.get("uv1"), data.get("lux1"), 
                data.get("temp1"), data.get("hum1"), data.get("panel_temp_1"),
                data.get("panel_voltage1"), data.get("panel_current1"), 
                data.get("irrad1"), data.get("battery_voltage1"),
                data.get("rain2"), data.get("uv2"), data.get("lux2"), 
                data.get("temp2"), data.get("hum2"), data.get("panel_temp_2"),
                data.get("panel_voltage2"), data.get("panel_current2"), 
                data.get("irrad2"), data.get("battery_voltage2")
            )
        )
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error storing sensor readings in database: {e}")
        traceback.print_exc()
        return False

# Initialize database on module import
init_database()

# Pre-initialize sensor variables for global access
# 1 - System Panel 1
# 2 - System Panel 2

rain_readings_1 = float('nan')
rain_readings_2 = float('nan')

#For DHT
dht_humidity1, dht_temp1 = float('nan'), float('nan')
dht_humidity2, dht_temp2 = float('nan'), float('nan')
    
uv_values_1 = float('nan')
uv_values_2 = float('nan')
    
lux_1 = float('nan')
lux_2 = float('nan')
    
ds18b20_temps_1 = float('nan')
ds18b20_temps_2 = float('nan')
battery_voltages_1 = float('nan')
battery_voltages_2 = float('nan')
    
#For INA226
panel_voltage1 = float('nan')
panel_voltage2 = float('nan')
current1 = float('nan')
current2 = float('nan')
    
#For Irradiance
solar_irrad1= float('nan')
solar_irrad2 = float('nan')

#############################################
# Flask Web Page Code: START
#############################################

app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*", logger=True)

CSV_FILENAME = "sensor_data.csv"

def record_data():
    # Prepare header row
    header = [
        "Date", 
        "Time (12-hr format)",
        "Rain Readings 1 (%)", 
        "UV 1 (mW/cm²)", 
        "Lux 1 (lux)", 
        "DHT Temperature 1 (°C)", 
        "DHT Humidity 1 (%)", 
        "Panel Temperature 1 (°C)", 
        "Panel Voltage 1 (V)", 
        "Panel Current 1 (mA)", 
        "Irradiance 1 (W/m²)", 
        "Battery Voltage 1 (V)",
        "Rain Readings 2 (%)", 
        "UV 2 (mW/cm²)", 
        "Lux 2 (lux)", 
        "DHT Temperature 2 (°C)", 
        "DHT Humidity 2 (%)", 
        "Panel Temperature 2 (°C)", 
        "Panel Voltage 2 (V)", 
        "Panel Current 2 (mA)", 
        "Irradiance 2 (W/m²)", 
        "Battery Voltage 2 (V)"
    ]

    # Check if file exists (we try to read it; if not found, we know we need to write header)
    file_exists = os.path.exists(CSV_FILENAME) and os.path.getsize(CSV_FILENAME) > 0

    # Gather current time in date and 12-hour time format
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%I:%M:%S %p")  # 12-hour format with AM/PM

    # Create a list of sensor readings (global variables from your main loop)
    # (Make sure these global variables are updated before calling record_data())
    row = [
        date_str, time_str,
        rain_readings_1, uv_values_1, lux_1, dht_temp1, dht_humidity1, ds18b20_temps_1, panel_voltage1, current1, solar_irrad1, battery_voltages_1,
        rain_readings_2, uv_values_2, lux_2, dht_temp2, dht_humidity2, ds18b20_temps_2, panel_voltage2, current2, solar_irrad2, battery_voltages_2
    ]
    
    # Replace NaN values with an empty string (or with "null" if preferred)
    row = [x if not (isinstance(x, float) and math.isnan(x)) else "" for x in row]

    # Append the data to the CSV file
    with open(CSV_FILENAME, mode="a", newline="") as csvfile:
        writer = csv.writer(csvfile)
        # If file did not exist, write header first
        if not file_exists:
            writer.writerow(header)
        writer.writerow(row)
    
    # Also store the data in SQLite
    sensor_data = {
        "rain1": rain_readings_1, "rain2": rain_readings_2,
        "uv1": uv_values_1, "uv2": uv_values_2,
        "lux1": lux_1, "lux2": lux_2,
        "temp1": dht_temp1, "hum1": dht_humidity1,
        "temp2": dht_temp2, "hum2": dht_humidity2,
        "panel_temp_1": ds18b20_temps_1, "panel_temp_2": ds18b20_temps_2, 
        "panel_voltage1": panel_voltage1, "panel_current1": current1,
        "panel_voltage2": panel_voltage2, "panel_current2": current2,
        "irrad1": solar_irrad1, "irrad2": solar_irrad2,
        "battery_voltage1": battery_voltages_1, "battery_voltage2": battery_voltages_2
    }
    
    # Convert NaN values to None for SQLite
    for key, value in sensor_data.items():
        if isinstance(value, float) and math.isnan(value):
            sensor_data[key] = None
    
    # Store in SQLite database
    store_result = store_sensor_readings_in_db(now, sensor_data)
    if not store_result:
        print("Warning: Failed to store sensor readings in SQLite database")

@app.route("/data")
def data():
    sensor_data = {
        "rain1": rain_readings_1, "rain2": rain_readings_2,
        "uv1": uv_values_1, "uv2": uv_values_2,
        "lux1": lux_1, "lux2": lux_2,
        "temp1": dht_temp1, "hum1": dht_humidity1,
        "temp2": dht_temp2, "hum2": dht_humidity2,
        "panel_temp_1": ds18b20_temps_1, "panel_temp_2": ds18b20_temps_2, 
        "panel_voltage1": panel_voltage1, "panel_current1": current1,
        "panel_voltage2": panel_voltage2, "panel_current2": current2,
        "irrad1": solar_irrad1, "irrad2": solar_irrad2,
        "battery_voltage1": battery_voltages_1, "battery_voltage2": battery_voltages_2
        }
        
    # Convert NaN values to None
    for key, value in sensor_data.items():
        if isinstance(value, float) and math.isnan(value):
            sensor_data[key] = None
            
    return jsonify(sensor_data)


@app.route("/")
def index():
    return render_template("index.html")
    
#############################################
# Flask Web Page Code: END
#############################################

#############################################
# PCF8574 Helper Class for LED control
#############################################
class PCF8574:
    def __init__(self, bus, address, max_retries=5, retry_delay=0.5):
        self.bus = bus
        self.address = address
        self.state = 0xFF  # All pins HIGH initially (LEDs off)
        self.connected = True  # Assume initially connected
        self.max_retries = max_retries  # Max retries for reconnection
        self.retry_delay = retry_delay  # Delay between retries (seconds)

        self.write_state()  # Try writing initial state

    def set_pin(self, pin, value):
        """
        Set an individual pin.
        value=True sets output HIGH (LED off),
        value=False sets output LOW (LED on).
        """
        if value:
            self.state |= (1 << pin)
        else:
            self.state &= ~(1 << pin)
        self.write_state()

    def write_state(self):
        retries = 0
        while retries < self.max_retries:
            try:
                self.bus.write_byte(self.address, self.state)
                if not self.connected:
                    print(f"PCF8574 at 0x{self.address:02X} reconnected.")
                    self.connected = True  # Mark as reconnected
                return  # Success, exit function
            except OSError as e:
                if e.errno == 121:  # Remote I/O error (Device not found)
                    print(f"PCF8574 at 0x{self.address:02X} not found. Retrying ({retries+1}/{self.max_retries})...")
                    self.connected = False  # Mark as disconnected
                    time.sleep(self.retry_delay)  # Wait before retrying
                    retries += 1
                else:
                    print(f"Error writing to PCF8574 at address 0x{self.address:02X}: {e}")
                    break  # Stop if it's another type of error

        print(f"Failed to communicate with PCF8574 at 0x{self.address:02X} after {self.max_retries} attempts.")

    def check_connection(self):
        """
        Check if the PCF8574 is available by attempting a read.
        If disconnected, try to reset the I2C bus.
        """
        try:
            self.bus.read_byte(self.address)  # Try reading a byte
            if not self.connected:
                print(f"PCF8574 at 0x{self.address:02X} reconnected.")
                self.connected = True
            return True
        except OSError:
            print(f"PCF8574 at 0x{self.address:02X} is not detected. Trying to reset I2C bus...")
            self.connected = False
            self.reset_i2c_bus()  # Reset I2C bus
            return False

    def reset_i2c_bus(self):
        """
        Force reinitialization of the I2C bus by closing and reopening it.
        This can help recover the device after reattachment.
        """
        try:
            self.bus.close()
            time.sleep(0.5)  # Small delay before reopening
            self.bus = smbus2.SMBus(1)  # Reopen the I2C bus
            print("I2C bus reset complete.")
        except Exception as e:
            print(f"Failed to reset I2C bus: {e}")

# class PCF8574:
    # def __init__(self, bus, address):
        # self.bus = bus
        # self.address = address
        # # All pins HIGH initially (LEDs off because wiring is reversed)
        # self.state = 0xFF  
        # self.write_state()

    # def set_pin(self, pin, value):
        # """
        # Set an individual pin.
        # value=True sets output HIGH (LED off),
        # value=False sets output LOW (LED on).
        # """
        # if value:
            # self.state |= (1 << pin)
        # else:
            # self.state &= ~(1 << pin)
        # self.write_state()

    # def write_state(self):
        # try:
            # self.bus.write_byte(self.address, self.state)
        # except Exception as e:
            # print(f"Error writing to PCF8574 at address 0x{self.address:02X}: {e}")


# -----------------------------
# DHT22 Sensor Class
# -----------------------------
class DHT22Sensor:
    def __init__(self, sensor_type, pin):
        self.sensor_type = sensor_type
        self.pin = pin

    def read(self):
        """Read temperature and humidity from the DHT22 sensor.
           Returns (humidity, temperature) or (NaN, NaN) on failure."""
        try:
            humidity, temperature = Adafruit_DHT.read_retry(self.sensor_type, self.pin, retries=5, delay_seconds=1)
            if humidity is None or temperature is None:
                return float('nan'), float('nan')
            return humidity, temperature
        except Exception as e:
            print(f"DHT22 read error: {e}")
            return float('nan'), float('nan')

# -----------------------------
# INA226 Current Monitoring Sensor Class
# -----------------------------
# class INA226:
    # CONFIG_REG = 0x00
    # SHUNT_VOLTAGE_REG = 0x01
    # BUS_VOLTAGE_REG = 0x02
    # POWER_REG = 0x03
    # CURRENT_REG = 0x04
    # CALIBRATION_REG = 0x05
    # DIE_ID_REG = 0xFE

    # def __init__(self, bus_number, address, shunt_resistor=0.005):
        # self.bus = SMBus(bus_number)
        # self.address = address
        # self.current_lsb = None
        # self.shunt_resistor = shunt_resistor  # store for later reinitialization
        # self.sensor_connected = True  # Assume sensor is connected initially

        # self.reset()
        # time.sleep(0.1)

        # die_id = self.read_register(self.DIE_ID_REG)
        # if die_id is None or die_id != 0x5449:
            # print(f"Sensor at address 0x{self.address:02X} not detected during init. Marking as disconnected.")
            # self.sensor_connected = False
        # else:
            # self._configure_sensor()

    # def _configure_sensor(self):
        # config = (0x0 << 12) | (0x3 << 9) | (0x3 << 6) | (0x3 << 3) | 0x7
        # self.write_register(self.CONFIG_REG, config)
        # self.set_calibration(self.shunt_resistor)

    # def reset(self):
        # self.write_register(self.CONFIG_REG, 0x8000)

    # def write_register(self, register, value):
        # data = [(value >> 8) & 0xFF, value & 0xFF]
        # try:
            # self.bus.write_i2c_block_data(self.address, register, data)
        # except OSError as e:
            # print(f"Error writing to INA226 at address 0x{self.address:02X}: {e}")

    # def read_register(self, register):
        # try:
            # data = self.bus.read_i2c_block_data(self.address, register, 2)
            # return (data[0] << 8) | data[1]
        # except OSError as e:
            # print(f"Error reading from INA226 at address 0x{self.address:02X}: {e}")
            # return None

    # def set_calibration(self, shunt_ohms):
        # current_lsb = 0.0001
        # cal_value = int(0.00512 / (current_lsb * shunt_ohms))
        # self.current_lsb = current_lsb
        # self.write_register(self.CALIBRATION_REG, cal_value)

    # def check_connection(self):
        # """
        # Attempts to read the DIE_ID register. If the correct value is returned,
        # reinitialize the sensor. Returns True if connected.
        # """
        # die_id = self.read_register(self.DIE_ID_REG)
        # if die_id == 0x5449:
            # if not self.sensor_connected:
                # print(f"Sensor at address 0x{self.address:02X} reconnected. Reinitializing sensor.")
                # self.sensor_connected = True
                # self._configure_sensor()
            # return True
        # else:
            # self.sensor_connected = False
            # return False

    # def read_bus_voltage(self):
        # # Optionally, check connection before reading.
        # if not self.sensor_connected:
            # # Try to reconnect
            # self.check_connection()
            # if not self.sensor_connected:
                # return float('nan')
        # raw = self.read_register(self.BUS_VOLTAGE_REG)
        # if raw is None:
            # return float('nan')
        # return raw * 1.25 / 1000.0

    # def read_shunt_voltage(self):
        # if not self.sensor_connected:
            # self.check_connection()
            # if not self.sensor_connected:
                # return float('nan')
        # raw = self.read_register(self.SHUNT_VOLTAGE_REG)
        # if raw is None:
            # return float('nan')
        # if raw > 32767:
            # raw -= 65536
        # return raw * 2.5

    # def read_current(self):
        # if not self.sensor_connected:
            # self.check_connection()
            # if not self.sensor_connected:
                # return float('nan')
        # raw = self.read_register(self.CURRENT_REG)
        # if raw is None:
            # return float('nan')
        # if raw > 32767:
            # raw -= 65536
        # return raw * self.current_lsb

    # def read_power(self):
        # """Read the power register of the INA226."""
        # if not self.sensor_connected:
            # self.check_connection()
            # if not self.sensor_connected:
                # return float('nan')
        # raw = self.read_register(self.POWER_REG)
        # if raw is None:
            # return float('nan')
        # # Power LSB is 25 times the current LSB
        # return raw * (self.current_lsb * 25)  # In watts

    # def read_current_from_power(self):
        # """Calculate current from power and bus voltage."""
        # power = self.read_power()
        # voltage = self.read_bus_voltage()
        
        # if math.isnan(power) or math.isnan(voltage) or voltage < 0.1:
            # # Avoid division by zero or using invalid readings
            # # return float('nan')
            # # Return zero instead of NaN when conditions aren't valid for calculation
            # return 0.0
        
        # # I = P/V
        # current = power / voltage  # In amperes
        # return current


class INA226:
    CONFIG_REG = 0x00
    SHUNT_VOLTAGE_REG = 0x01
    BUS_VOLTAGE_REG = 0x02
    POWER_REG = 0x03
    CURRENT_REG = 0x04
    CALIBRATION_REG = 0x05
    DIE_ID_REG = 0xFE

    def __init__(self, bus_number, address, shunt_resistor=0.005, current_offset=0.0):
        self.bus = SMBus(bus_number)
        self.address = address
        self.current_lsb = None
        self.shunt_resistor = shunt_resistor
        self.current_offset = current_offset  # Store the current offset
        self.sensor_connected = True  # Assume sensor is connected initially

        self.reset()
        time.sleep(0.1)

        die_id = self.read_register(self.DIE_ID_REG)
        if die_id is None or die_id != 0x5449:
            print(f"Sensor at address 0x{self.address:02X} not detected during init. Marking as disconnected.")
            self.sensor_connected = False
        else:
            self._configure_sensor()

    def _configure_sensor(self):
        config = (0x0 << 12) | (0x3 << 9) | (0x3 << 6) | (0x3 << 3) | 0x7
        self.write_register(self.CONFIG_REG, config)
        self.set_calibration(self.shunt_resistor)

    def reset(self):
        self.write_register(self.CONFIG_REG, 0x8000)

    def write_register(self, register, value):
        data = [(value >> 8) & 0xFF, value & 0xFF]
        try:
            self.bus.write_i2c_block_data(self.address, register, data)
        except OSError as e:
            print(f"Error writing to INA226 at address 0x{self.address:02X}: {e}")

    def read_register(self, register):
        try:
            data = self.bus.read_i2c_block_data(self.address, register, 2)
            return (data[0] << 8) | data[1]
        except OSError as e:
            print(f"Error reading from INA226 at address 0x{self.address:02X}: {e}")
            return None

    #def set_calibration(self, shunt_ohms):
    #    current_lsb = 0.0001
    #    cal_value = int(0.00512 / (current_lsb * shunt_ohms))
    #    self.current_lsb = current_lsb
    #    self.write_register(self.CALIBRATION_REG, cal_value)
        
    def set_calibration(self, shunt_ohms):
        self.current_lsb = 10 / 32768  # Correct LSB for max current 16.384A
        #self.current_lsb = 0.0005
        cal_value = int(0.00512 / (self.current_lsb * shunt_ohms))  # Compute CAL
        self.write_register(self.CALIBRATION_REG, cal_value)  # Write CAL to INA226

    def check_connection(self):
        die_id = self.read_register(self.DIE_ID_REG)
        if die_id == 0x5449:
            if not self.sensor_connected:
                print(f"Sensor at address 0x{self.address:02X} reconnected. Reinitializing sensor.")
                self.sensor_connected = True
                self._configure_sensor()
            return True
        else:
            self.sensor_connected = False
            return False

    def read_bus_voltage(self):
        if not self.sensor_connected:
            self.check_connection()
            if not self.sensor_connected:
                return float('nan')
        raw = self.read_register(self.BUS_VOLTAGE_REG)
        if raw is None:
            return float('nan')
        return raw * 1.25 / 1000.0

    def read_shunt_voltage(self):
        if not self.sensor_connected:
            self.check_connection()
            if not self.sensor_connected:
                return float('nan')
        raw = self.read_register(self.SHUNT_VOLTAGE_REG)
        if raw is None:
            return float('nan')
        if raw > 32767:
            raw -= 65536
        return raw * 2.5

    def read_current(self):
        """Reads current from INA226 and applies offset correction (in mA)."""
        if not self.sensor_connected:
            self.check_connection()
            if not self.sensor_connected:
                return float('nan')
        raw = self.read_register(self.CURRENT_REG)
        if raw is None:
            return float('nan')
        if raw > 32767:
            raw -= 65536
        
        # Convert current to milliamps (mA) before applying offset
        current_mA = (raw * self.current_lsb * 1000) - self.current_offset
        return current_mA

    def read_power(self):
        """Read the power register of the INA226 with offset correction."""
        if not self.sensor_connected:
            self.check_connection()
            if not self.sensor_connected:
                return float('nan')
        
        raw = self.read_register(self.POWER_REG)
        if raw is None:
            return float('nan')
        
        power = raw * (self.current_lsb * 25)  # Convert raw value to power in watts

        # Adjust power based on the current offset (current_offset is in mA, convert to A)
        corrected_power = power + ((self.current_offset / 1000) * self.read_bus_voltage())
        
        return corrected_power

    def read_current_from_power(self):
        """Calculate current from power and bus voltage, considering current offset."""
        power = self.read_power()
        voltage = self.read_bus_voltage()
        
        if math.isnan(power) or math.isnan(voltage) or voltage < 0.1:
            return 0.0  # Return zero instead of NaN to avoid division errors
        
        # Calculate current (I = P / V) and apply current offset (convert from mA to A)
        current = (power / voltage) - (self.current_offset / 1000)
        
        return current


# -----------------------------
# Solar Irradiance Sensor Class
# -----------------------------
class SolarRadiationSensor:
    def __init__(self, serial_port='/dev/serial0', de_re_pin=17):
        self.de_re_pin = de_re_pin
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.de_re_pin, GPIO.OUT)
        GPIO.output(self.de_re_pin, GPIO.LOW)

        try:
            self.serial = serial.Serial(
                port=serial_port,
                baudrate=9600,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                xonxoff=False,
                rtscts=False,
                dsrdtr=True,
                timeout=1 #default to 1
            )
        except Exception as e:
            print(f"Error initializing serial port {serial_port}: {e}")
            self.serial = None

    def _send_receive(self, command):
        if self.serial is None:
            return None
        try:
            GPIO.output(self.de_re_pin, GPIO.HIGH)
            #time.sleep(0.05)  # Increased delay before sending command
            time.sleep(0.01) #default to 0.01
            self.serial.write(command)
            #self.serial.flush()  # Ensures transmission completes before switching
            #time.sleep(0.02)  # Slightly reduced delay after sending command
            time.sleep(0.01) #default to 0.01
            GPIO.output(self.de_re_pin, GPIO.LOW)
            return self.serial.readlines()
        except Exception as e:
            print(f"Communication error (SolarRadiationSensor): {e}")
            return None

    def read_solar_radiation(self, command):
        response = self._send_receive(command)
        if response and len(response) > 0:
            response_bytes = response[0]
            if len(response_bytes) >= 7:
                solar_value = (response_bytes[3] << 8) | response_bytes[4]
                return solar_value
        return float('nan')

    def close(self):
        if self.serial:
            self.serial.close()
        GPIO.cleanup()

# -----------------------------
# Rain Sensor Class
# -----------------------------
class RainSensor:
    def __init__(self, ads, channel, v_ref=3.3, invert_logic=True):
        """
        :param ads: ADS1115 instance
        :param channel: ADS1115 channel (ADS.P0, ADS.P1, etc.)
        :param v_ref: Reference voltage (3.3V or 5V depending on setup)
        :param invert_logic: If True, 100% means fully submerged (raining), 0% means dry.
        """
        self.channel = AnalogIn(ads, channel)
        self.v_ref = v_ref
        self.invert_logic = invert_logic

    def read_value(self):
        """
        Reads the sensor value and converts it to a percentage (0% - 100% based on voltage).
        Clips negative voltage to 0V.
        Returns (raw_adc_value, voltage, percentage).
        """
        try:
            raw_value = self.channel.value  # 16-bit ADC raw value
            voltage = max(0, self.channel.voltage)  # Ensure voltage is never negative
            
            # Normalize the percentage (0% = v_ref, 100% = 0V if inverted)
            percentage = (voltage / self.v_ref) * 100
            percentage = max(0, min(100, percentage))  # Clamp between 0-100%

            # Invert logic if enabled (0% at v_ref, 100% at 0V)
            if self.invert_logic:
                percentage = 100 - percentage

            return raw_value, voltage, percentage

        except Exception as e:
            print(f"RainSensor error: {e}")
            return float('nan'), float('nan'), float('nan')

    def read_value_raw(self):
        """Returns only the raw ADC value."""
        return self.read_value()[0]

    def read_value_voltage(self):
        """Returns only the voltage."""
        return self.read_value()[1]

    def read_value_percentage(self):
        """Returns only the percentage value."""
        return self.read_value()[2]


# -----------------------------
# UV Sensor Class (ML8511)
# -----------------------------
class UVSensor:
    def __init__(self, ads, channel):
        self.channel = AnalogIn(ads, channel)

    def read_value(self):
        try:
            return self.channel.value, self.channel.voltage
        except Exception as e:
            print(f"UVSensor error: {e}")
            return float('nan'), float('nan')

    def read_uv_intensity(self):
        try:
            voltage = self.channel.voltage
            if voltage < 0.99:
                return 0.0
            uv_intensity = (voltage - 0.99) * 15.0 / (2.8 - 0.99)
            return uv_intensity
        except Exception as e:
            print(f"UVSensor intensity error: {e}")
            return float('nan')

# -----------------------------
# Battery Sensor Class
# -----------------------------
class BatterySensor:
    def __init__(self, ads, channel):
        self.channel = AnalogIn(ads, channel)
        self.voltage_divider_ratio = (30 + 7.5) / 7.5  # 5.0

    def read_voltage(self):
        try:
            measured_voltage = self.channel.voltage
            actual_voltage = measured_voltage * self.voltage_divider_ratio
            # Ensure voltage is not negative
            actual_voltage = max(0, actual_voltage)
            if actual_voltage > 16.5:
                print("Warning: Battery voltage exceeds the measurable range!")
            return actual_voltage
        except Exception as e:
            print(f"BatterySensor error: {e}")
            return float('nan')


class VEML7700Wrapper:
    def __init__(self, i2c, sensor_number=1):
        """
        Initialize the wrapper with the given I2C bus.
        sensor_number is optional if you need to differentiate multiple sensors.
        """
        self.i2c = i2c
        self.sensor_number = sensor_number
        self.sensor = None
        self.sensor_connected = False
        self.initialize_sensor()

    def initialize_sensor(self):
        """
        Try to create a new VEML7700 instance. If successful,
        configure it and mark it as connected.
        """
        try:
            self.sensor = adafruit_veml7700.VEML7700(self.i2c)
            # Configure settings if desired:
            self.sensor.light_gain = self.sensor.ALS_GAIN_1_8
            # Use the appropriate integration time; here we use ALS_25MS for example
            self.sensor.integration_time = self.sensor.ALS_25MS
            self.sensor_connected = True
            print(f"VEML7700 sensor {self.sensor_number} initialized.")
        except Exception as e:
            print(f"VEML7700 sensor {self.sensor_number} initialization error: {e}")
            self.sensor = None
            self.sensor_connected = False

    @property
    def lux(self):
        """
        Returns the lux reading from the sensor.
        If the sensor is not connected, attempts to reinitialize it.
        Returns NaN if reading fails.
        """
        if not self.sensor_connected:
            self.initialize_sensor()
            if not self.sensor_connected:
                return float('nan')
        try:
            return self.sensor.lux
        except Exception as e:
            print(f"Error reading lux from VEML7700 sensor {self.sensor_number}: {e}")
            self.sensor_connected = False
            return float('nan')



# -----------------------------
# Main Function to Run Sensors
# -----------------------------
def main():
    
    global rain_readings_1, rain_readings_2, uv_values_1, uv_values_2
    global lux_1, lux_2, dht_temp1, dht_humidity1, dht_temp2, dht_humidity2
    global ds18b20_temps_1, ds18b20_temps_2, panel_voltage1, panel_voltage2
    global current1, current2, solar_irrad1, solar_irrad2, battery_voltages_1, battery_voltages_2

    
    GPIO.setmode(GPIO.BCM)  # Use BCM numbering
    GPIO.setup(21, GPIO.OUT)  # PV System 1 Status LED
    GPIO.setup(20, GPIO.OUT)  # PV System 2 Status LED
    GPIO.setup(26, GPIO.OUT)  # Panel 2 Rain Sensor
    GPIO.setup(19, GPIO.OUT)  # Panel 1 Rain Sensor
    
    # Mapping for panel temperature sensors (W1ThermSensor)
    panel_temp_mapping = {
        "000000577683": "Panel 2 Temp",
        "000000377aa3": "Panel 1 Temp",
    }

    # Initialize I2C buses as before
    i2c_1 = busio.I2C(board.SCL, board.SDA)      # for sensor 1
    i2c_2 = ExtendedI2C(3)                        # for sensor 2 (if on a different bus)

    # Use the wrapper for both sensors
    veml7700_1 = VEML7700Wrapper(i2c_1, sensor_number=1) # bus1
    veml7700_2 = VEML7700Wrapper(i2c_2, sensor_number=2) # bus3
    
    # Initialize PCF8574 GPIO expanders for LED indicators
    # We'll use the same I2C bus 1 for the expanders.
    pcf_bus = SMBus(1)
    pcf1 = PCF8574(pcf_bus, 0x20)  # For PV system 1 LEDs
    pcf2 = PCF8574(pcf_bus, 0x24)  # For PV system 2 LEDs


    try:
        print("Initializing sensors...")

        # INA226 Sensors
        ina226_1 = INA226(bus_number=1, address=0x40, shunt_resistor=0.005)
        ina226_2 = INA226(bus_number=1, address=0x41, shunt_resistor=0.005, current_offset=-0.50)  # Offset of -0.50mA
        #ina226_2 = INA226(bus_number=1, address=0x41, shunt_resistor=0.005)

        # Solar Radiation Sensor
        solar_sensor = SolarRadiationSensor()

        # DHT22 Sensors
        dht22_1 = DHT22Sensor(Adafruit_DHT.DHT22, pin=24) 
        dht22_2 = DHT22Sensor(Adafruit_DHT.DHT22, pin=23) 

        # Initialize I2C for ADS1115 Modules
        ads_i2c = busio.I2C(board.SCL, board.SDA)

        # ADS1115 Module 1 (address 0x48) - Rain & UV Sensors
        ads1 = ADS.ADS1115(ads_i2c, address=0x48)
        rain_sensor_1 = RainSensor(ads1, ADS.P0)
        rain_sensor_2 = RainSensor(ads1, ADS.P1)
        uv_sensor_1 = UVSensor(ads1, ADS.P2)
        uv_sensor_2 = UVSensor(ads1, ADS.P3)

        # ADS1115 Module 2 (address 0x49) - Battery Voltage Sensors
        ads2 = ADS.ADS1115(ads_i2c, address=0x49)
        battery_sensor_1 = BatterySensor(ads2, ADS.P0)
        battery_sensor_2 = BatterySensor(ads2, ADS.P1)

        print("Sensors initialized. Reading data...\n")

        while True:
            print("\n===== SENSOR READINGS =====")
            
            #Turn on sensor
            GPIO.output(26, GPIO.HIGH)  # Panel 2 Rain Sensor
            GPIO.output(19, GPIO.HIGH)  # Panel 1 Rain Sensor

            # Rain Sensor Readings
            rain_readings_1 = rain_sensor_1.read_value_percentage()
            rain_readings_2 = rain_sensor_2.read_value_percentage()

            #Turn off sensor
            GPIO.output(26, GPIO.LOW)  # Panel 2 Rain Sensor
            GPIO.output(19, GPIO.LOW)  # Panel 1 Rain Sensor

            print(f"Rain Sensor-1: {rain_readings_1:.2f} %")
            print(f"Rain Sensor-2: {rain_readings_2:.2f} %")

            # UV Sensor Readings
            uv_values_1 = uv_sensor_1.read_uv_intensity()
            uv_values_2 = uv_sensor_2.read_uv_intensity()

            print(f"UV Sensor-1: {uv_values_1:.2f} mW/cm2")
            print(f"UV Sensor-2: {uv_values_2:.2f} mW/cm2")

            # VEML Sensor Readings
            try:
                lux_1 = veml7700_1.lux
            except Exception:
                lux_1 = float('nan')
            try:
                lux_2 = veml7700_2.lux
            except Exception:
                lux_2 = float('nan')
                
            print(f"VEML7700-1: {lux_1:.2f} lux")
            print(f"VEML7700-2: {lux_2:.2f} lux")
            
            # DHT22 Sensor Readings
            dht_humidity1, dht_temp1= dht22_1.read()
            dht_humidity2, dht_temp2 = dht22_2.read()

            print(f"DHT22-1: Temp: {dht_temp1:.2f} °C, {dht_humidity1:.2f} %")
            print(f"DHT22-2: Temp: {dht_temp2:.2f} °C, {dht_humidity2:.2f} %")
            
            # Initialize sensor status dictionary
            panel_temp_status = {key: float('nan') for key in panel_temp_mapping}

            # Read DS18B20 temperatures
            for sensor in W1ThermSensor.get_available_sensors():
                sensor_id = sensor.id
                if sensor_id in panel_temp_mapping:
                    try:
                        panel_temp_status[sensor_id] = sensor.get_temperature()
                    except Exception:
                        panel_temp_status[sensor_id] = float('nan')
            ds18b20_temps_1 = panel_temp_status["000000377aa3"]
            ds18b20_temps_2 = panel_temp_status["000000577683"]

            # Print sensor values for debugging
            for sensor_id, temp in panel_temp_status.items():
                print(f"{panel_temp_mapping[sensor_id]} (ID: {sensor_id}): {temp:.2f}°C")

            # INA226 Sensor Readings
            panel_voltage1 = ina226_1.read_bus_voltage()
            current1 = ina226_1.read_current()
            #current1 = ina226_1.read_current_from_power() * 1000
            panel_voltage2 = ina226_2.read_bus_voltage()
            current2 = ina226_2.read_current()
            #current2 = ina226_2.read_current_from_power()* 1000

            print(f"INA226-1: Voltage={panel_voltage1:.2f} V, Current={current1:.2f}mA")
            print(f"INA226-2: Voltage={panel_voltage2:.2f} V, Current={current2:.2f}mA")

            # Solar Radiation Sensor Readings
            # Irradiance Panel address are based on the positioning of the panel system (on current setup they are interchanged)
            solar_irrad1 = solar_sensor.read_solar_radiation(b'\x02\x03\x00\x00\x00\x01\x84\x39')
            solar_irrad2 = solar_sensor.read_solar_radiation(b'\x01\x03\x00\x00\x00\x01\x84\x0A')

            print(f"Solar Sensor-1: {solar_irrad1:.2f} W/m2")
            print(f"Solar Sensor-2: {solar_irrad2:.2f} W/m2")
        
            # Battery Voltage Sensor Readings
            battery_voltages_1 = battery_sensor_1.read_voltage()
            battery_voltages_2 = battery_sensor_2.read_voltage()

            print(f"Battery Sensor-1: {battery_voltages_1:.2f} V")
            print(f"Battery Sensor-2: {battery_voltages_2:.2f} V")

            print("-" * 50)  # Separator for readability
            
            # -------------------------
            # Update LED Indicators based on sensor statuses
            # -------------------------
            
            #The mappinging of pins of PCF1 is the following
            #1) Rain - P7
            #2) UV - P6
            #3) VEML - P5
            #4) DHT - P4
            #5) Panel Temp - P3
            #6) INA226 - P2
            #7) Irrad - P1
            #8) Battery - P0
            
            #The mappinging of pins of PCF2 is the following
            #1) Rain - P0
            #2) UV - P1
            #3) VEML - P2
            #4) DHT - P3
            #5) Panel Temp - P4
            #6) INA226 - P5
            #7) Irrad - P6
            #8) Battery - P7

            # Rain Sensor LED
            rain_error_1 = any(math.isnan(val) or val > 10 for val in [rain_readings_1])
            pcf1.set_pin(0, rain_error_1)  #if heavy rain or no reading the LED turns off

            rain_error_2 = any(math.isnan(val) or val > 10 for val in [rain_readings_2])
            pcf2.set_pin(7, rain_error_2)  

            # UV Sensor LED
            uv_error_1 = any(math.isnan(val) for val in [uv_values_1]) or uv_values_1 < 0.05
            pcf1.set_pin(1, uv_error_1)

            uv_error_2 = any(math.isnan(val) for val in [uv_values_2]) or uv_values_2 < 0.05
            pcf2.set_pin(6, uv_error_2)

            # VEML Sensor LED
            # Position are interchanged based on the positioning of the LED indicator
            veml_error_1 = math.isnan(lux_1)
            #print(f"VEML error 1: {veml_error_1}")
            pcf1.set_pin(2, veml_error_1)
            
            veml_error_2 = math.isnan(lux_2)
            #print(f"VEML error 2: {veml_error_2}")
            pcf2.set_pin(5, veml_error_2)

            # DHT Sensor LED
            dht_error_1 = any([math.isnan(dht_humidity1), math.isnan(dht_temp1)])
            pcf1.set_pin(3,  dht_error_1)

            dht_error_2 = any([math.isnan(dht_humidity2), math.isnan(dht_temp2)])
            pcf2.set_pin(4, dht_error_2)

            # DS18B20 Sensor LED
            ds18b20_error_panel1 = math.isnan(panel_temp_status["000000577683"])  # Panel 1 Temp
            ds18b20_error_panel2 = math.isnan(panel_temp_status["000000377aa3"])  # Panel 2 Temp

            pcf1.set_pin(4, ds18b20_error_panel1)  # LED for Panel 1 Temp
            pcf2.set_pin(3, ds18b20_error_panel2)  # LED for Panel 2 Temp

            # INA226 ELD
            ina226_error_1 = any([math.isnan(panel_voltage1) or math.isnan(current1)])
            pcf1.set_pin(5, ina226_error_1)
            
            ina226_error_2 = any([math.isnan(panel_voltage2) or math.isnan(current2)])
            pcf2.set_pin(2, ina226_error_2)
            
            # Irradiance Sensor LED
            irradiance_error_1 = math.isnan(solar_irrad1)
            pcf1.set_pin(6, irradiance_error_1)

            irradiance_error_2 = math.isnan(solar_irrad2)
            pcf2.set_pin(1, irradiance_error_2)
            
            # Battery Voltage Sensor LED
            battery_error_1 = any(math.isnan(v) or v < 1 for v in [battery_voltages_1])
            pcf1.set_pin(7, battery_error_1)

            battery_error_2 = any(math.isnan(v) or v < 1 for v in [battery_voltages_2])
            pcf2.set_pin(0, battery_error_2)
            
            # ---- CHECK IF ALL SENSORS IN A SYSTEM HAVE ERRORS ----
            pv1_any_errors = any([
                rain_error_1, uv_error_1, veml_error_1, dht_error_1, 
                ds18b20_error_panel1, ina226_error_1, irradiance_error_1, battery_error_1
            ])

            pv2_any_errors = any([
                rain_error_2, uv_error_2, veml_error_2, dht_error_2, 
                ds18b20_error_panel2, ina226_error_2, irradiance_error_2, battery_error_2
            ])

            # ---- CONTROL GPIO OUTPUT ----
            GPIO.output(21, GPIO.LOW if pv1_any_errors else GPIO.HIGH)  # GND = LOW -> LED ON
            GPIO.output(20, GPIO.LOW if pv2_any_errors else GPIO.HIGH)  # GND = LOW -> LED ON
            
            print(f"PV1 ANY ERRORS: {pv1_any_errors}, GPIO 20 -> {'ON' if pv1_any_errors else 'OFF'}")
            print(f"PV2 ANY ERRORS: {pv2_any_errors}, GPIO 21 -> {'ON' if pv2_any_errors else 'OFF'}")
            
            # Record the sensor data to CSV
            record_data()
            
            #Update HTML page content
            #data = read_sensors()
            #socketio.emit("sensor_update", data)
            
            #time.sleep(0.1)

            
    except KeyboardInterrupt:
        print("\nStopping sensors...")

    finally:
        # Safely close the I2C buses and serial port if they were initialized
        if ina226_1 is not None:
            ina226_1.bus.close()
        if ina226_2 is not None:
            ina226_2.bus.close()
        if solar_sensor is not None:
            solar_sensor.close()


def send_updates():
    while True:
        data = read_sensors()
        socketio.emit('sensor_update', data)
        eventlet.sleep(1)  # Send updates every second

if __name__ == "__main__":
    threading.Thread(target=main, daemon=True).start()
    app.run(host="0.0.0.0", port=5000, debug=True)
    #socketio.start_background_task(send_updates)
    #socketio.run(app, host="0.0.0.0", port=5000, debug=True)
    

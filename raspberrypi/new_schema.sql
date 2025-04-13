CREATE TABLE sensor_readings2 (
    id INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    device_id TEXT NOT NULL,
    
    -- Panel 1 sensors
    panel1_rain REAL,
    panel1_uv REAL,
    panel1_lux REAL,
    panel1_dht_temp REAL,
    panel1_dht_humidity REAL,
    panel1_panel_temp REAL,
    panel1_voltage REAL,
    panel1_current REAL,
    panel1_solar_irrad REAL,
    panel1_battery_voltage REAL,
    
    -- Panel 2 sensors
    panel2_rain REAL,
    panel2_uv REAL,
    panel2_lux REAL,
    panel2_dht_temp REAL,
    panel2_dht_humidity REAL,
    panel2_panel_temp REAL,
    panel2_voltage REAL,
    panel2_current REAL,
    panel2_solar_irrad REAL,
    panel2_battery_voltage REAL
);

CREATE INDEX idx_timestamp ON sensor_readings2(timestamp);
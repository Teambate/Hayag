-- Store panel information
CREATE TABLE panels (
    panel_id TEXT PRIMARY KEY,  -- e.g., "Panel_1", "Panel_3", etc.
    installation_date TEXT,
    active INTEGER DEFAULT 1    -- Boolean flag (1=active, 0=inactive)
);

-- Store reading timestamps and metadata
CREATE TABLE reading_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,   -- ISO8601 format
    device_id TEXT NOT NULL    -- e.g., "SOLAR_01"
);

-- Store individual sensor readings
CREATE TABLE sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    panel_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,  -- 'rain', 'uv', 'lux', etc.
    sensor_name TEXT, -- 'dht22', 'ina226'
    value REAL,
    unit TEXT,
    
    FOREIGN KEY (session_id) REFERENCES reading_sessions(id),
    FOREIGN KEY (panel_id) REFERENCES panels(panel_id)
);


CREATE INDEX idx_readings_timestamp ON reading_sessions(timestamp);
CREATE INDEX idx_sensor_readings_session ON sensor_readings(session_id);

-- Store aggregated data periods
CREATE TABLE aggregation_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    start_time TEXT NOT NULL,   -- ISO8601 format
    end_time TEXT NOT NULL,     -- ISO8601 format
    aggregation_type TEXT NOT NULL, -- e.g., "5min"
    sample_count INTEGER NOT NULL,
    sent_to_backend INTEGER DEFAULT 0, -- Boolean flag (0=not sent, 1=sent)
    sent_timestamp TEXT,        -- When it was successfully sent
    payload TEXT                 -- Complete JSON payload as sent to backend
);

-- Indexes for efficient querying
CREATE INDEX idx_aggregation_periods_time ON aggregation_periods(end_time);
CREATE INDEX idx_aggregation_periods_sent ON aggregation_periods(sent_to_backend);
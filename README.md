# 🌞 IoT Solar PV Data Logger with Interactive Dashboard

**An IoT-enabled Solar PV Data Logger with an Interactive Dashboard designed for real-time monitoring and analysis of solar energy systems.**

## 📌 About the Project
This project is a **companion app for a solar PV system** that allows users to **log and visualize real-time sensor data** collected from a **Raspberry Pi-powered system**. The **data is stored in MongoDB** and displayed on an **interactive dashboard** to track performance, optimize efficiency, and support research efforts.

## ⚡ Key Features
- **Real-time Data Monitoring** – View live power output, voltage, and current from solar panels.
- **Cloud-Connected** – Data is collected via IoT sensors and stored in a cloud database.
- **Modern UI/UX** – Built with **React & Vite** for a seamless, interactive experience.
- **IoT Integration** – Uses **Raspberry Pi & sensors** to capture real-time solar panel metrics.
- **Alerts & Notifications** – Get notified about anomalies, inefficiencies, or faults.
- **Historical Data & Trends** – Analyze past performance with easy-to-read graphs.

## 💻 Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **IoT Hardware:** Raspberry Pi
- **Database:** MongoDB
- **Visualization:** Chart.js, Shadcn
- **Deployment:** Vercel / Firebase Hosting

## 🔢 Sensors Used
| Sensor | Description |
|---------|------------|
| Rain | Detects rainfall presence and intensity |
| Irradiance | Measures solar radiation intensity |
| Humidity | Tracks atmospheric moisture levels |
| Temperature | Measures ambient temperature |
| Panel Temperature | Monitors solar panel surface temperature |
| UV | Detects ultraviolet radiation levels |
| Lux | Measures brightness and light intensity |
| Panel Voltage | Tracks the voltage output of the solar panel |
| Panel Current | Measures the electrical current produced by the solar panel |
| Battery Voltage | Monitors battery charge levels |

## 🛠 Web App Features
- **Interactive Dashboard** – Displays real-time and historical solar data.
- **Graphs & Charts** – Visual representation of energy trends and sensor readings.
- **Sort & Filter by Date** – View data for specific timeframes.
- **Smart Insights** – AI-driven analysis for performance trends.
- **Customizable Dashboard** – Personalize widgets and display options.
- **Advanced Filters** – Filter specific data points for detailed analysis.
- 👤 **Export Data** – Download reports in CSV or PDF format.

## 📅 Project Timeline
- Research & Planning
- System Architecture & Prototyping
- IoT Sensor Integration
- Web Dashboard Development
- Testing & Optimization
- Final Deployment & Documentation

## 🎡 Project Goal
To develop and implement an **IoT Solar PV Data Logger with Interactive Dashboard** for real-time monitoring and collection of data from environmental sensors and power output data of a PV system. The project aims to **optimize efficiency, track long-term and peak performance, and support future research efforts** by enabling **correlation studies and predictive modeling**.

## 🔍 Objectives
1. **Design and build an IoT Solar PV Data Logger** with integrated sensors (**irradiance, power output measurement, temperature, humidity, precipitation, and UV sensors, etc**).
2. **Develop a real-time interactive dashboard** for visualizing and analyzing sensor data to identify trends, patterns, peak performance, and critical data points.
3. **Analyze trends and correlations** between sensor data to better understand solar PV performance.
4. **[Future Scope]** Develop regression models, conduct correlation studies, and determine feature importance for each sensor data input considered during modeling.

## 👤 Contributors
- **John William Embate** – Lead Hardware Engineer & System Architect
- **Ira Hans Dedicatoria** – Lead Software Developer & Backend Engineer
- **Courtney Viola** – UI/UX Designer & Frontend Developer
- **John Embate's Father** – Technical Consultant & Assembly Lead

## Dashboard Implementation

### Real-Time Dashboard Features

The dashboard implementation provides a dual-approach strategy:
- Current sensor values: Uses WebSockets for real-time updates
- Chart data: Uses a combination of REST API for initial loading + WebSocket for incremental updates

### Backend API Endpoints

#### Current Sensor Values
- `GET /api/readings/current`: Get the latest sensor readings for a device
  - Query parameters: `deviceId` (required), `panelIds` (optional, comma-separated)

#### Chart Data
- `GET /api/readings/chart`: Get chart data for a specific chart type
  - Query parameters: 
    - `deviceId` (required)
    - `panelIds` (optional, comma-separated)
    - `startDateTime` (required, ISO format)
    - `endDateTime` (required, ISO format)
    - `timeInterval` (optional, default '15min')
    - `chartType` (required, one of: 'energy', 'battery', 'panel_temp', 'irradiance')

- `GET /api/readings/dashboard/chart`: Get data for multiple chart types with time-based aggregation
  - Query parameters:
    - `deviceId` (required)
    - `panelIds` (optional, comma-separated)
    - `startDateTime` (required, ISO format)
    - `endDateTime` (required, ISO format)
    - `timeInterval` (optional, one of: '5min', '10min', '15min', '30min', 'hourly', 'daily', default '15min')
    - `chartTypes` (optional, comma-separated, default is all types: 'energy', 'battery', 'panel_temp', 'irradiance')

### WebSocket Events

The dashboard uses Socket.io for real-time updates. The following events are available:

#### Client to Server
- `subscribe`: Subscribe to current sensor updates for a device
  - Parameter: `deviceId` (string)
- `unsubscribe`: Unsubscribe from current sensor updates
  - Parameter: `deviceId` (string)
- `subscribeChart`: Subscribe to chart updates for a device and chart type
  - Parameter: Object with `deviceId` (string) and `chartType` (string)
- `unsubscribeChart`: Unsubscribe from chart updates
  - Parameter: Object with `deviceId` (string) and `chartType` (string)

#### Server to Client
- `sensorUpdate`: Sent when new sensor data is available
  - Data: Object containing current sensor values
- `chartUpdate`: Sent when new chart data is available
  - Data: Object with `chartType` and `dataPoint`

### Time-Based Aggregation

The dashboard supports multiple time intervals for chart data aggregation:
- 5 minutes (5min)
- 10 minutes (10min)
- 15 minutes (15min)
- 30 minutes (30min)
- Hourly (hourly)
- Daily (daily)

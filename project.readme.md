Project name: IoT Solar PV Data Logger with Interactive Dashboard

Summary: This is a companion app for a solar PV system. It allows you to log data from the solar PV system and view it on an interactive dashboard. The solar PV system is handled by a raspberry PI which then logs data onto the MongoDB database.



Core functionalities:
- Log data from the solar PV system
- View data on an interactive dashboard

Technologies:
- React
- Vite
- Shadcn ui library
- Node.js   
- Express
- MongoDB
- Chart.js

Sensor Readings Data to be logged with sample values:

Rain Sensor-1: 1.12 %
Rain Sensor-2: 1.03 %
UV Sensor-1: 0.03 mW/cm2
UV Sensor-2: 0.06 mW/cm2
VEML7700-1: 0.54 lux
VEML7700-2: nan lux
DHT22-1: Temp: 27.00 °C, Humidity: 99.90 %
DHT22-2: Temp: 26.90 °C, Humidity: 99.90 %
Panel 2 Temp (ID: 000000577683): 26.75°C
Panel 1 Temp (ID: 000000377aa3): 27.12°C
INA226-1: Voltage=0.00 V, Current=0.00mA
INA226-2: Voltage=0.00 V, Current=0.00mA
Solar Sensor-1: 0.00 W/m2
Solar Sensor-2: 0.00 W/m2
Battery Sensor-1: 12.23 V
Battery Sensor-2: 12.32 V

Project Goal
To develop and implement an IoT Solar PV Data Logger with Interactive Dashboard for real-time monitoring and collection of data from environmental sensors and power output data of a PV system, aimed at optimizing efficiency, tracking long-term and peak performance of a system, and enabling future research for correlation studies and modeling.

Objectives
1. Design and build an IoT Solar PV Data Logger system with integrated sensors (irradiance, power output measurement, temperature, humidity, precipitation, and UV sensors, etc).
2. Develop a real-time interactive dashboard for visualizing and analyzing sensor data to identify trends, patterns, peak performance, and critical data points.
3. Analyze trends and correlations between sensor data.
4. [Future]Develop regression models, conduct correlation studies, and identify the feature importance for each sensor data input considered during the modeling process.

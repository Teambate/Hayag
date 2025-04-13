import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SensorDataType } from '../types/dashboardTypes';
import { ChartDataPoint, DashboardChartData } from './useDashboardCharts';

export const useSocketConnection = (
  deviceId: string, 
  setSensorData: React.Dispatch<React.SetStateAction<SensorDataType | null>>,
  chartData?: DashboardChartData | null,
  setChartData?: React.Dispatch<React.SetStateAction<DashboardChartData | null>>
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if a deviceId is available
    if (!deviceId) return;
    
    // Initialize Socket.io connection with the server URL
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    socketRef.current = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    // Setup event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server');
      
      // Subscribe to updates for the current device
      socketRef.current?.emit('subscribe', deviceId);
      
      // Subscribe to all chart types for this device
      ['energy', 'battery', 'panel_temp', 'irradiance'].forEach(chartType => {
        socketRef.current?.emit('subscribeChart', { 
          deviceId: deviceId, 
          chartType: chartType 
        });
      });
    });
    
    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    // Handle sensor updates
    socketRef.current.on('sensorUpdate', (data) => {
      console.log('Received sensor update:', data);
      
      // Update sensor data state with the new API structure
      if (data) {
        // The socket might send just the data part or the full response
        const sensorData = data.data || data;
        
        // Make sure we have a valid data structure before updating
        if (sensorData.deviceId && sensorData.timestamp) {
          // Transform the data structure to match the expected SensorDataType format
          const transformedData: SensorDataType = {
            deviceId: sensorData.deviceId,
            timestamp: sensorData.timestamp,
            sensors: {
              solar: { value: 0, unit: '' },
              rain: { value: 0, unit: '' },
              uv: { value: 0, unit: '' },
              light: { value: 0, unit: '' },
              humidity: { value: 0, unit: '' },
              temperature: { value: 0, unit: '' }
            },
            health: 0,
            sensor_health: {}
          };
          
          // Process each sensor type
          const sensorKeys = ['solar', 'rain', 'uv', 'light', 'humidity', 'temperature'];
          
          sensorKeys.forEach(key => {
            if (Array.isArray(sensorData.sensors[key])) {
              // Calculate average value for the sensor type
              const values = sensorData.sensors[key].map((panel: any) => panel.value);
              const avgValue = values.length > 0 
                ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length 
                : 0;
              
              // Get unit from the first panel (assuming all panels have the same unit)
              const unit = sensorData.sensors[key]?.[0]?.unit || '';
              
              // Create SensorType structure
              transformedData.sensors[key] = {
                value: avgValue,
                unit: unit,
                panelCount: sensorData.sensors[key].length,
                panels: sensorData.sensors[key]
              };
            } else {
              // If already in the correct format, use as is
              transformedData.sensors[key] = sensorData.sensors[key] || { value: 0, unit: '' };
            }
          });
          
          // Handle any other sensor types not explicitly listed
          Object.keys(sensorData.sensors).forEach(key => {
            if (!sensorKeys.includes(key) && Array.isArray(sensorData.sensors[key])) {
              const values = sensorData.sensors[key].map((panel: any) => panel.value);
              const avgValue = values.length > 0 
                ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length 
                : 0;
              
              const unit = sensorData.sensors[key]?.[0]?.unit || '';
              
              transformedData.sensors[key] = {
                value: avgValue,
                unit: unit,
                panelCount: sensorData.sensors[key].length,
                panels: sensorData.sensors[key]
              };
            }
          });
          
          // In the sensorUpdate handler, add handling for power_accumulation
          if (sensorData.power_accumulation) {
            transformedData.power_accumulation = sensorData.power_accumulation;
          }
          
          console.log('Transformed sensor data:', transformedData);
          setSensorData(transformedData);
        } else {
          console.error('Invalid sensor data structure received from socket:', sensorData);
        }
      }
    });
    
    // Handle chart updates
    socketRef.current.on('chartUpdate', (data) => {
      console.log('Received chart update:', data);
      
      // Skip if we don't have setChartData or chart data
      if (!setChartData || !chartData) return;
      
      const { chartType, dataPoint } = data;
      
      // Make sure we have a valid data structure
      if (!chartType || !dataPoint || !Array.isArray(dataPoint)) {
        console.error('Invalid chart data structure:', data);
        return;
      }
      
      // Update the chart data by adding the new data point
      setChartData(prevChartData => {
        if (!prevChartData) return prevChartData;
        
        // Deep clone the previous chart data
        const newChartData = JSON.parse(JSON.stringify(prevChartData));
        
        // Format the new data point as needed for each chart type
        if (chartType === 'energy') {
          // Group data by panel ID
          const panelGroups: Record<string, any> = {};
          
          // Process each panel's data point
          dataPoint.forEach((panelData: any) => {
            panelGroups[panelData.panelId] = {
              panelId: panelData.panelId,
              energy: panelData.energy || 0,
              unit: panelData.energyUnit || 'kWh'
            };
          });
          
          // Create a new chart data point
          const newPoint: ChartDataPoint = {
            timestamp: new Date(dataPoint[0].timestamp), // Use timestamp from first panel
            panels: Object.values(panelGroups),
            average: {
              value: Object.values(panelGroups).reduce((sum: number, panel: any) => sum + panel.energy, 0),
              unit: 'kWh'
            }
          };
          
          // Add new point to the chart data
          // Limit array to 30 points to avoid memory issues
          const updatedData = [...newChartData[chartType], newPoint].slice(-30);
          newChartData[chartType] = updatedData;
        } else {
          // Process other chart types (battery, panel_temp, irradiance)
          // Group data by panel ID
          const panelGroups: Record<string, any> = {};
          
          // Process each panel's data point
          dataPoint.forEach((panelData: any) => {
            // The key difference: Now we need to match the data structure expected by the charts
            // The charts look for panel.value, so we need to ensure it's there
            panelGroups[panelData.panelId] = {
              panelId: panelData.panelId,
              value: panelData.value, // This is the important property for other charts
              unit: panelData.unit
            };
          });
          
          // Calculate average value
          const avgValue = Object.values(panelGroups).length > 0 
            ? Object.values(panelGroups).reduce((sum: number, panel: any) => sum + panel.value, 0) / Object.values(panelGroups).length
            : 0;
          
          // Create a new chart data point
          const newPoint: ChartDataPoint = {
            timestamp: new Date(dataPoint[0].timestamp), // Use timestamp from first panel
            panels: Object.values(panelGroups),
            average: {
              value: avgValue,
              unit: dataPoint[0]?.unit || ''
            }
          };
          
          // Log the specific format for chart type to help debug
          console.log(`Creating ${chartType} chart point:`, {
            timestamp: new Date(dataPoint[0].timestamp),
            panels: Object.values(panelGroups),
            average: { value: avgValue, unit: dataPoint[0]?.unit || '' }
          });
          
          // Add new point to the chart data
          // Limit array to 30 points to avoid memory issues
          const updatedData = [...newChartData[chartType], newPoint].slice(-30);
          newChartData[chartType] = updatedData;
          
          // Debug log for chart update
          console.log(`Updated ${chartType} chart data - now has ${updatedData.length} points`);
        }
        
        return newChartData;
      });
    });
    
    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        // Unsubscribe from device updates
        socketRef.current.emit('unsubscribe', deviceId);
        
        // Unsubscribe from all chart types
        ['energy', 'battery', 'panel_temp', 'irradiance'].forEach(chartType => {
          socketRef.current?.emit('unsubscribeChart', { 
            deviceId: deviceId, 
            chartType: chartType 
          });
        });
        
        // Disconnect socket
        socketRef.current.disconnect();
      }
    };
  }, [deviceId, setSensorData, chartData, setChartData]); // Re-connect if deviceId changes or setter changes

  return socketRef;
}; 
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SensorDataType, SensorType } from '../types/dashboardTypes';

export const useSocketConnection = (
  deviceId: string, 
  setSensorData: React.Dispatch<React.SetStateAction<SensorDataType | null>>
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
            }
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
      // Will implement chart data updates in the next iteration
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
  }, [deviceId, setSensorData]); // Re-connect if deviceId changes or setter changes

  return socketRef;
}; 
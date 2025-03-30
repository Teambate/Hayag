import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SensorDataType } from '../types/dashboardTypes';

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
      
      // Update sensor data state
      if (data.sensors) {
        // Extract the first item from each sensor array or use default value if not available
        const updatedSensorData: SensorDataType = {
          irradiance: { 
            value: data.sensors.solar?.length ? data.sensors.solar[0].value : 0, 
            unit: data.sensors.solar?.length ? data.sensors.solar[0].unit : 'W/m²' 
          },
          rain: { 
            value: data.sensors.rain?.length ? data.sensors.rain[0].value : 0, 
            unit: data.sensors.rain?.length ? data.sensors.rain[0].unit : '%' 
          },
          uvIndex: { 
            value: data.sensors.uv?.length ? data.sensors.uv[0].value : 0, 
            unit: data.sensors.uv?.length ? data.sensors.uv[0].unit : 'mW/cm²' 
          },
          light: { 
            value: data.sensors.light?.length ? data.sensors.light[0].value : 0, 
            unit: data.sensors.light?.length ? data.sensors.light[0].unit : 'lx' 
          },
          humidity: { 
            value: data.sensors.humidity?.length ? data.sensors.humidity[0].value : 0, 
            unit: data.sensors.humidity?.length ? data.sensors.humidity[0].unit : '%' 
          },
          temperature: { 
            value: data.sensors.temperature?.length ? data.sensors.temperature[0].value : 0, 
            unit: data.sensors.temperature?.length ? data.sensors.temperature[0].unit : '°C' 
          }
        };
        
        setSensorData(updatedSensorData);
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
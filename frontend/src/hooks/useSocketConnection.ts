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
    
    // Initialize Socket.io connection
    socketRef.current = io();
    
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
    
    // Handle sensor updates
    socketRef.current.on('sensorUpdate', (data) => {
      console.log('Received sensor update:', data);
      
      // Update sensor data state
      if (data.sensors) {
        const updatedSensorData: SensorDataType = {
          irradiance: { 
            value: data.sensors.solar?.[0]?.value || 0, 
            unit: data.sensors.solar?.[0]?.unit || 'W/m²' 
          },
          rain: { 
            value: data.sensors.rain?.[0]?.value || 0, 
            unit: data.sensors.rain?.[0]?.unit || '%' 
          },
          uvIndex: { 
            value: data.sensors.uv?.[0]?.value || 0, 
            unit: data.sensors.uv?.[0]?.unit || 'mW/cm²' 
          },
          light: { 
            value: data.sensors.light?.[0]?.value || 0, 
            unit: data.sensors.light?.[0]?.unit || 'lx' 
          },
          humidity: { 
            value: data.sensors.humidity?.[0]?.value || 0, 
            unit: data.sensors.humidity?.[0]?.unit || '%' 
          },
          temperature: { 
            value: data.sensors.temperature?.[0]?.value || 0, 
            unit: data.sensors.temperature?.[0]?.unit || '°C' 
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
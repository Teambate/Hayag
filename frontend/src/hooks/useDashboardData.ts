import { useState, useEffect } from 'react';
import { SensorDataType } from '../types/dashboardTypes';
import { fetchSensorData } from '../services/apiService';

export const useDashboardData = (deviceId: string, _selectedPanel: string) => {
  const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    // Only fetch data if a deviceId is available
    if (!deviceId) return;
    
    try {
      setIsLoading(true);
      
      const sensors = await fetchSensorData(deviceId);
      setSensorData(sensors);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data only when deviceId changes
  useEffect(() => {
    fetchDashboardData();
  }, [deviceId]);

  return {
    sensorData,
    isLoading,
    fetchDashboardData,
    setSensorData
  };
}; 
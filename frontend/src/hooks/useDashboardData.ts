import { useState, useEffect } from 'react';
import { SensorDataType, PanelDataType, SystemStatusType } from '../types/dashboardTypes';
import { fetchSensorData, fetchPanelData, fetchSystemStatus } from '../services/apiService';

export const useDashboardData = (deviceId: string, selectedPanel: string) => {
  const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
  const [panelData, setPanelData] = useState<PanelDataType[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    // Only fetch data if a deviceId is available
    if (!deviceId) return;
    
    try {
      setIsLoading(true);
      
      // Get panel IDs for filtering if a specific panel is selected
      const panelIdsFilter = selectedPanel !== "All Panels" 
        ? [selectedPanel.split(" ")[1]] 
        : undefined;
      
      const [sensors, panels, status] = await Promise.all([
        fetchSensorData(deviceId, panelIdsFilter),
        fetchPanelData(),
        fetchSystemStatus()
      ]);
      
      setSensorData(sensors);
      setPanelData(panels);
      setSystemStatus(status);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when deviceId or selectedPanel changes
  useEffect(() => {
    fetchDashboardData();
  }, [deviceId, selectedPanel]);

  return {
    sensorData,
    panelData,
    systemStatus,
    isLoading,
    fetchDashboardData,
    setSensorData
  };
}; 
import { useDevice } from "../context/DeviceContext";
import { useDashboardData } from "./useDashboardData";
import { useSocketConnection } from "./useSocketConnection";

/**
 * Custom hook that combines device context with dashboard data
 * for simplified access to device and panel data across the app.
 */
export const useDeviceData = () => {
  const { deviceId, selectedPanel, setDeviceId, setSelectedPanel } = useDevice();
  
  // Get dashboard data using the selected device and panel
  const { 
    sensorData, 
    isLoading, 
    setSensorData,
    fetchDashboardData
  } = useDashboardData(deviceId, selectedPanel);
  
  // Set up socket connection
  const socketRef = useSocketConnection(deviceId, setSensorData);
  
  
  return {
    // Device context
    deviceId,
    selectedPanel,
    setDeviceId,
    setSelectedPanel,
    
    // Dashboard data
    sensorData,
    isLoading,
    
    // Helper methods
    refreshData: fetchDashboardData,
    socketRef
  };
}; 
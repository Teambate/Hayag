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
    panelData, 
    systemStatus, 
    isLoading, 
    setSensorData,
    fetchDashboardData
  } = useDashboardData(deviceId, selectedPanel);
  
  // Set up socket connection
  const socketRef = useSocketConnection(deviceId, setSensorData);
  
  // Get filtered panel data based on selection
  const getFilteredPanelData = () => {
    if (selectedPanel === "All Panels") {
      return panelData;
    } else {
      const panelId = parseInt(selectedPanel.split(" ")[1]);
      return panelData.filter(panel => panel.id === panelId);
    }
  };
  
  const filteredPanelData = getFilteredPanelData();
  
  return {
    // Device context
    deviceId,
    selectedPanel,
    setDeviceId,
    setSelectedPanel,
    
    // Dashboard data
    sensorData,
    panelData,
    filteredPanelData,
    systemStatus,
    isLoading,
    
    // Helper methods
    refreshData: fetchDashboardData,
    socketRef
  };
}; 
import { useDevice } from "../context/DeviceContext";
import { useDashboardData } from "./useDashboardData";
import { useSocketConnection } from "./useSocketConnection";
import { useDashboardCharts } from "./useDashboardCharts";

/**
 * Custom hook that combines device context with dashboard data
 * for simplified access to device and panel data across the app.
 */
export const useDeviceData = () => {
  const { deviceId, selectedPanel, setDeviceId, setSelectedPanel } = useDevice();
  
  // Get dashboard data using the selected device and panel
  const { 
    sensorData, 
    isLoading: isLoadingSensorData, 
    setSensorData,
    fetchDashboardData
  } = useDashboardData(deviceId, selectedPanel);
  
  // Get chart data
  const {
    chartData,
    isLoading: isLoadingChartData,
    error: chartError,
    refreshChartData,
    setChartData
  } = useDashboardCharts(deviceId);
  
  // Set up socket connection with both sensor and chart data setters
  const socketRef = useSocketConnection(deviceId, setSensorData, chartData, setChartData);
  
  
  return {
    // Device context
    deviceId,
    selectedPanel,
    setDeviceId,
    setSelectedPanel,
    
    // Dashboard data
    sensorData,
    isLoadingSensorData,
    
    // Chart data
    chartData,
    isLoadingChartData,
    chartError,
    
    // Helper methods
    refreshSensorData: fetchDashboardData,
    refreshChartData,
    socketRef
  };
}; 
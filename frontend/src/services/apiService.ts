// API service for dashboard data
export const fetchSensorData = async (deviceId: string) => {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('deviceId', deviceId);
    
    const response = await fetch(`/api/readings/current?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sensor data');
    }
    
    const result = await response.json();
    
    // Return the API response data directly
    return result.data;
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    // Return fallback values on error
    return {
      deviceId: "",
      timestamp: new Date().toISOString(),
      sensors: {
        solar: { value: 0, unit: "W/m²" },
        rain: { value: 0, unit: "%" },
        uv: { value: 0, unit: "mW/cm²" },
        light: { value: 0, unit: "lux" },
        humidity: { value: 0, unit: "%" },
        temperature: { value: 0, unit: "°C" }
      }
    };
  }
};

import api from '../utils/api'; // Import the configured axios instance

// Fetch dashboard chart data for all graphs
export const fetchDashboardChartData = async (deviceId: string, timeInterval: string = '10min') => {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('deviceId', deviceId);
    params.append('timeInterval', timeInterval);
    
    // Use the axios instance which includes auth cookies
    const response = await api.get(`/readings/dashboard/chart?${params.toString()}`);
    
    // Axios automatically throws for non-2xx responses, 
    // so we check the success flag in the data
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch dashboard chart data');
    }
    
    // Return the API response data
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dashboard chart data:", error);
    // Return fallback empty data structure on error
    return {
      energy: [],
      battery: [],
      panel_temp: [],
      irradiance: []
    };
  }
};

export const addDevice = async (deviceData: { deviceId: string; name: string; location: string }) => {
  try {
    // This would be an actual API call in a real implementation
    console.log("Adding device:", deviceData);
    // Mock successful response
    return { success: true, data: deviceData };
  } catch (error) {
    console.error("Error adding device:", error);
    throw error;
  }
}; 
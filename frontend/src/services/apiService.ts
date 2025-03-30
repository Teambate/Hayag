import { SensorDataType, PanelDataType, SystemStatusType } from "../types/dashboardTypes";

// API service for dashboard data
export const fetchSensorData = async (deviceId: string): Promise<SensorDataType> => {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('deviceId', deviceId);
    
    const response = await fetch(`/api/readings/current?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sensor data');
    }
    
    const result = await response.json();
    
    // Transform API response to match our SensorDataType
    return {
      irradiance: { 
        value: result.data.sensors.solar?.value || 0, 
        unit: result.data.sensors.solar?.unit || 'W/m²' 
      },
      rain: { 
        value: result.data.sensors.rain?.value || 0, 
        unit: result.data.sensors.rain?.unit || '%' 
      },
      uvIndex: { 
        value: result.data.sensors.uv?.value || 0, 
        unit: result.data.sensors.uv?.unit || 'mW/cm²' 
      },
      light: { 
        value: result.data.sensors.light?.value || 0, 
        unit: result.data.sensors.light?.unit || 'lx' 
      },
      humidity: { 
        value: result.data.sensors.humidity?.value || 0, 
        unit: result.data.sensors.humidity?.unit || '%' 
      },
      temperature: { 
        value: result.data.sensors.temperature?.value || 0, 
        unit: result.data.sensors.temperature?.unit || '°C' 
      }
    };
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    // Return fallback values on error
    return {
      irradiance: { value: 0, unit: "W/m²" },
      rain: { value: 0, unit: "%" },
      uvIndex: { value: 0, unit: "mW/cm²" },
      light: { value: 0, unit: "lx" },
      humidity: { value: 0, unit: "%" },
      temperature: { value: 0, unit: "°C" },
    };
  }
};

export const fetchPanelData = async (): Promise<PanelDataType[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: 1, status: 'inactive', energy: 90.88, voltage: 12.8, current: 3.5 },
    { id: 2, status: 'active', energy: 90.88, voltage: 12.8, current: 3.5 }
  ];
};

export const fetchSystemStatus = async (): Promise<SystemStatusType> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    temperature: 32,
    batteryLevel: 75
  };
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
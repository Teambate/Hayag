// Types for structured data
export interface SensorDataType {
  irradiance: { value: number; unit: string };
  rain: { value: number; unit: string };
  uvIndex: { value: number; unit: string };
  light: { value: number; unit: string };
  humidity: { value: number; unit: string };
  temperature: { value: number; unit: string };
}

export interface PanelDataType {
  id: number;
  status: 'active' | 'inactive' | 'warning';
  energy: number;
  voltage: number;
  current: number;
}

export interface SystemStatusType {
  temperature: number;
  batteryLevel: number;
} 
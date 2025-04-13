// Types for structured data
export interface SensorPanel {
  panelId: string;
  value: number;
  unit: string;
  health?: number;
}

export interface SensorType {
  value: number;
  unit: string;
  panelCount?: number;
  panels?: SensorPanel[];
  health?: number;
}

export interface SensorDataType {
  deviceId: string;
  timestamp: string;
  sensors: {
    solar: SensorType;
    rain: SensorType;
    uv: SensorType;
    light: SensorType;
    humidity: SensorType;
    temperature: SensorType;
    [key: string]: SensorType;
  };
  power_accumulation?: {
    panels: Array<{
      panelId: string;
      energy: number;
      unit: string;
    }>;
    total: number;
    average: number;
    period: string;
    unit: string;
  };
  health: number;
  sensor_health: {
    [key: string]: number;
  };
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
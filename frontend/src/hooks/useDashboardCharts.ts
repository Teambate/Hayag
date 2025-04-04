import { useState, useEffect } from 'react';
import { fetchDashboardChartData } from '../services/apiService';

// Types for chart data
export interface PanelData {
  panelId: string;
  energy?: number;
  value?: number;
  unit: string;
}

export interface ChartDataPoint {
  timestamp: string | object;
  panels: PanelData[];
  average: {
    value: number;
    unit: string;
  };
}

export interface DashboardChartData {
  energy: ChartDataPoint[];
  battery: ChartDataPoint[];
  panel_temp: ChartDataPoint[];
  irradiance: ChartDataPoint[];
}

export const useDashboardCharts = (deviceId: string) => {
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch chart data
  const fetchChartData = async () => {
    // Only fetch data if a deviceId is available
    if (!deviceId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchDashboardChartData(deviceId);
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard chart data:", err);
      setError("Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when deviceId changes
  useEffect(() => {
    fetchChartData();
  }, [deviceId]);

  return {
    chartData,
    isLoading,
    error,
    refreshChartData: fetchChartData
  };
}; 
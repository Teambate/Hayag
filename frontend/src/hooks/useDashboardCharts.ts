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

export const useDashboardCharts = (deviceId: string, timeInterval: string = '10min') => {
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeInterval, setCurrentTimeInterval] = useState(timeInterval);

  // Update timeInterval when prop changes
  useEffect(() => {
    setCurrentTimeInterval(timeInterval);
  }, [timeInterval]);

  // Function to fetch chart data
  const fetchChartData = async (interval?: string) => {
    // Only fetch data if a deviceId is available
    if (!deviceId) {
      setIsLoading(false);
      return;
    }
    
    // Use provided interval or current state
    const intervalToUse = interval || currentTimeInterval;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchDashboardChartData(deviceId, intervalToUse);
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard chart data:", err);
      setError("Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when deviceId or timeInterval changes
  useEffect(() => {
    fetchChartData();
  }, [deviceId, currentTimeInterval]);

  return {
    chartData,
    setChartData,
    isLoading,
    error,
    timeInterval: currentTimeInterval,
    setTimeInterval: setCurrentTimeInterval,
    refreshChartData: fetchChartData
  };
}; 
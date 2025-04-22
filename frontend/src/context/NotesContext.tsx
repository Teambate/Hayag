import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import api from '../utils/api'; // Import the configured axios instance
import { useDevice } from './DeviceContext';
import { useAuth } from './AuthContext';

export interface Report {
  id: string;
  date: string;
  time: string;
  performance_report: {
    title: string;
    sub_title: string;
    content: string;
  };
  sensorhealth_report: {
    title: string;
    sub_title: string;
    content: string;
  };
  panelhealth_report: {
    title: string;
    sub_title: string;
    content: string;
  };
  insights: {
    title: string;
    sub_title: string;
    content: string;
  };
}

interface NotesContextType {
  reports: Report[];
  fetchReports: () => void;
  loading: boolean;
  error: string | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { deviceId } = useDevice();
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simple function to fetch reports
  const fetchReports = useCallback(() => {
    // Skip if no deviceId or not authenticated
    if (!deviceId || !isAuthenticated) {
      console.log('No device ID or not authenticated, skipping fetch');
      return;
    }

    // Set loading state
    setLoading(true);
    console.log('Starting to fetch reports...');

    // Make API call
    api.get(`/insights/reports?deviceId=${deviceId}`)
      .then(response => {
        console.log('API response received:', response.status);
        if (response.data && response.data.success) {
          // Extract reports array and log it
          const reportsData = response.data.reports || [];
          console.log('Reports data from API:', reportsData);
          console.log('Reports count:', reportsData.length);
          
          // Update state with reports
          setReports(reportsData);
          console.log('State updated with reports');
        } else {
          console.error('API error:', response.data);
          setError('Failed to fetch reports');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Error fetching reports');
      })
      .finally(() => {
        // Always set loading to false when done
        setLoading(false);
        console.log('Loading set to false');
      });
  }, [deviceId, isAuthenticated]);

  // Fetch reports on mount and when deviceId or isAuthenticated changes
  useEffect(() => {
    if (deviceId && isAuthenticated) {
      console.log('Fetching reports on mount for device:', deviceId);
      fetchReports();
    }
  }, [deviceId, fetchReports, isAuthenticated]);

  return (
    <NotesContext.Provider
      value={{
        reports,
        fetchReports,
        loading,
        error
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export default NotesContext; 
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  navigateToNotes: () => void;
  fetchReports: (forceRefresh?: boolean) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { deviceId } = useDevice(); // Get deviceId from DeviceContext
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Function to fetch reports from the API - memoized with useCallback
  const fetchReports = useCallback(async (forceRefresh: boolean = false) => {
    // Skip if no deviceId is available
    if (!deviceId) {
      console.log('No device ID available, skipping fetch');
      return;
    }
    
    // Allow force refresh to override the loading state
    if (loading && !forceRefresh) {
      console.log('Already loading reports, skipping fetch. To force refresh, pass true to fetchReports()');
      return;
    }
    
    // Always reset loading state if force refreshing
    if (forceRefresh) {
      setLoading(false);
    }
    
    console.log(`Fetching reports from API for device ${deviceId}... (forceRefresh: ${forceRefresh})`);
    
    try {
      setLoading(true);
      setError(null);
      
      // Use axios instance with deviceId parameter
      console.log(`Making API request to /insights/reports?deviceId=${deviceId}`);
      const response = await api.get(`/insights/reports?deviceId=${deviceId}`);
      console.log('API response status:', response.status);
      
      // Only update state if component is still mounted
      if (isMounted) {
        if (response.data && response.data.success) {
          console.log('API response data received successfully');
          setReports(response.data.reports || []);
          console.log('Reports loaded successfully:', response.data.reports ? response.data.reports.length : 0);
        } else {
          console.error('API response indicates failure:', response.data);
          throw new Error(response.data?.message || 'Failed to fetch reports');
        }
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      
      // Only update state if component is still mounted
      if (isMounted) {
        setError((error as any)?.message || 'Failed to load reports');
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted) {
        console.log('Finished API call, setting loading to false');
        setLoading(false);
      }
    }
  }, [deviceId, isMounted, loading]);

  // Fetch reports when deviceId changes or component mounts
  useEffect(() => {
    if (deviceId) {
      console.log('DeviceId changed or NotesProvider mounted, fetching reports for device:', deviceId);
      fetchReports(true); // Force refresh when deviceId changes
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log('NotesProvider unmounting');
      setIsMounted(false);
    };
  }, [deviceId, fetchReports]);

  // Function to navigate to the notes page
  const navigateToNotes = useCallback(() => {
    navigate('/notes');
  }, [navigate]);

  return (
    <NotesContext.Provider
      value={{
        reports,
        setReports,
        navigateToNotes,
        fetchReports,
        loading,
        error,
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
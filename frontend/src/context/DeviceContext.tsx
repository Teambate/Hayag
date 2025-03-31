import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define the context type
interface DeviceContextType {
  deviceId: string;
  selectedPanel: string;
  setDeviceId: (id: string) => void;
  setSelectedPanel: (panel: string) => void;
}

// Create context with default values
const DeviceContext = createContext<DeviceContextType>({
  deviceId: '',
  selectedPanel: 'All Panels',
  setDeviceId: () => {},
  setSelectedPanel: () => {},
});

// Create DeviceProvider component
export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [selectedPanel, setSelectedPanel] = useState<string>('All Panels');
  const { user } = useAuth();

  // Set default device on component mount or when user changes
  useEffect(() => {
    if (user?.devices && user.devices.length > 0 && !deviceId) {
      setDeviceId(user.devices[0].deviceId);
    }
  }, [user, deviceId]);

  // Store selections in localStorage to persist between page refreshes
  useEffect(() => {
    if (deviceId) {
      localStorage.setItem('selectedDeviceId', deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    localStorage.setItem('selectedPanel', selectedPanel);
  }, [selectedPanel]);

  // Load stored selections on initial mount
  useEffect(() => {
    const storedDeviceId = localStorage.getItem('selectedDeviceId');
    const storedPanel = localStorage.getItem('selectedPanel');
    
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    }
    
    if (storedPanel) {
      setSelectedPanel(storedPanel);
    }
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        deviceId,
        selectedPanel,
        setDeviceId,
        setSelectedPanel
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

// Create custom hook for using device context
export const useDevice = () => useContext(DeviceContext);

export default DeviceContext; 
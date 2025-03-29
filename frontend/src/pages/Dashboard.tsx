import React, { useState, useEffect, useRef } from "react";
import SensorOverview from "../components/data/SensorOverview";
import EnergyProduction, { TimePeriod } from "../components/graphs/EnergyProduction";
import SystemHealth from "../components/data/SystemHealth";
import BatteryChargeDischarge from "../components/graphs/BatteryChargeDischarge";
import PanelTemperatureOverheating from "../components/graphs/PanelTemperatureOverheating";
import IrradianceGraph from "../components/graphs/IrradianceGraph";
import { ThermometerIcon, BatteryMediumIcon, PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import Banner from "../components/layout/Banner";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import AddDeviceModal from "../components/ui/AddDeviceModal";
import { Dialog, DialogContent, DialogContentWithoutCloseButton, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// Types for structured data
interface SensorDataType {
  irradiance: { value: number; unit: string };
  rain: { value: number; unit: string };
  uvIndex: { value: number; unit: string };
  light: { value: number; unit: string };
  humidity: { value: number; unit: string };
  temperature: { value: number; unit: string };
}

interface PanelDataType {
  id: number;
  status: 'active' | 'inactive' | 'warning';
  energy: number;
  voltage: number;
  current: number;
}

interface SystemStatusType {
  temperature: number;
  batteryLevel: number;
}

// Update the apiService to include real API calls
const apiService = {
  fetchSensorData: async (deviceId: string, panelIds?: string[]): Promise<SensorDataType> => {
    try {
      // Build the query parameters
      const params = new URLSearchParams();
      params.append('deviceId', deviceId);
      if (panelIds && panelIds.length > 0) {
        params.append('panelIds', panelIds.join(','));
      }
      
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
  },
  fetchPanelData: async (): Promise<PanelDataType[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: 1, status: 'inactive', energy: 90.88, voltage: 12.8, current: 3.5 },
      { id: 2, status: 'active', energy: 90.88, voltage: 12.8, current: 3.5 }
    ];
  },
  fetchSystemStatus: async (): Promise<SystemStatusType> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      temperature: 32,
      batteryLevel: 75
    };
  },
  addDevice: async (deviceData: { deviceId: string; name: string; location: string }) => {
    try {
      // This would be an actual API call in a real implementation
      console.log("Adding device:", deviceData);
      // Mock successful response
      return { success: true, data: deviceData };
    } catch (error) {
      console.error("Error adding device:", error);
      throw error;
    }
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  // State with proper typing
  const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
  const [panelData, setPanelData] = useState<PanelDataType[]>([]);
  const [filteredPanelData, setFilteredPanelData] = useState<PanelDataType[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('24h');
  const [selectedPanel, setSelectedPanel] = useState<string>("All Panels");
  const [deviceId, setDeviceId] = useState<string>("");
  const [availableDevices, setAvailableDevices] = useState<Array<{deviceId: string; name: string; location?: string}>>([]);
  const socketRef = useRef<Socket | null>(null);
  const [open, setOpen] = useState(false);
  
  // Set available devices and default device from user context
  useEffect(() => {
    if (user?.devices && user.devices.length > 0) {
      setAvailableDevices(user.devices.map(device => ({
        deviceId: device.deviceId,
        name: device.name,
        location: device.location
      })));
      
      // Set the first device as default if no device is selected
      if (!deviceId && user.devices[0].deviceId) {
        setDeviceId(user.devices[0].deviceId);
      }
    }
  }, [user, deviceId]);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if a deviceId is available
      if (!deviceId) return;
      
      try {
        setIsLoading(true);
        
        // Get panel IDs for filtering if a specific panel is selected
        const panelIdsFilter = selectedPanel !== "All Panels" 
          ? [selectedPanel.split(" ")[1]] 
          : undefined;
        
        const [sensors, panels, status] = await Promise.all([
          apiService.fetchSensorData(deviceId, panelIdsFilter),
          apiService.fetchPanelData(),
          apiService.fetchSystemStatus()
        ]);
        
        setSensorData(sensors);
        setPanelData(panels);
        setFilteredPanelData(panels); // Initially show all panels
        setSystemStatus(status);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Could add error state handling here
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [deviceId, selectedPanel]);
  
  // Setup Socket.io connection
  useEffect(() => {
    // Only connect if a deviceId is available
    if (!deviceId) return;
    
    // Initialize Socket.io connection
    socketRef.current = io();
    
    // Setup event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server');
      
      // Subscribe to updates for the current device
      socketRef.current?.emit('subscribe', deviceId);
      
      // Subscribe to all chart types for this device
      ['energy', 'battery', 'panel_temp', 'irradiance'].forEach(chartType => {
        socketRef.current?.emit('subscribeChart', { 
          deviceId: deviceId, 
          chartType: chartType 
        });
      });
    });
    
    // Handle sensor updates
    socketRef.current.on('sensorUpdate', (data) => {
      console.log('Received sensor update:', data);
      
      // Update sensor data state
      if (data.sensors) {
        const updatedSensorData: SensorDataType = {
          irradiance: { 
            value: data.sensors.solar?.[0]?.value || 0, 
            unit: data.sensors.solar?.[0]?.unit || 'W/m²' 
          },
          rain: { 
            value: data.sensors.rain?.[0]?.value || 0, 
            unit: data.sensors.rain?.[0]?.unit || '%' 
          },
          uvIndex: { 
            value: data.sensors.uv?.[0]?.value || 0, 
            unit: data.sensors.uv?.[0]?.unit || 'mW/cm²' 
          },
          light: { 
            value: data.sensors.light?.[0]?.value || 0, 
            unit: data.sensors.light?.[0]?.unit || 'lx' 
          },
          humidity: { 
            value: data.sensors.humidity?.[0]?.value || 0, 
            unit: data.sensors.humidity?.[0]?.unit || '%' 
          },
          temperature: { 
            value: data.sensors.temperature?.[0]?.value || 0, 
            unit: data.sensors.temperature?.[0]?.unit || '°C' 
          }
        };
        
        setSensorData(updatedSensorData);
      }
    });
    
    // Handle chart updates - just logging for now, will implement visualization later
    socketRef.current.on('chartUpdate', (data) => {
      console.log('Received chart update:', data);
      // Will implement chart data updates in the next iteration
    });
    
    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        // Unsubscribe from device updates
        socketRef.current.emit('unsubscribe', deviceId);
        
        // Unsubscribe from all chart types
        ['energy', 'battery', 'panel_temp', 'irradiance'].forEach(chartType => {
          socketRef.current?.emit('unsubscribeChart', { 
            deviceId: deviceId, 
            chartType: chartType 
          });
        });
        
        // Disconnect socket
        socketRef.current.disconnect();
      }
    };
  }, [deviceId]); // Re-connect if deviceId changes

  // Filter panels based on selection
  useEffect(() => {
    if (selectedPanel === "All Panels") {
      setFilteredPanelData(panelData);
    } else {
      const panelId = parseInt(selectedPanel.split(" ")[1]);
      setFilteredPanelData(panelData.filter(panel => panel.id === panelId));
    }
  }, [selectedPanel, panelData]);
  
  // Function to handle time period changes - now will be called from Banner
  const handleTimePeriodChange = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
    // In a real implementation, this would trigger a new data fetch with the selected time period
    console.log(`Time period changed to: ${period}`);
  };

  // Function to handle panel selection
  const handlePanelChange = (panel: string) => {
    setSelectedPanel(panel);
    console.log(`Panel selection changed to: ${panel}`);
  };

  // Function to handle device selection change
  const handleDeviceChange = (selectedDeviceId: string) => {
    setDeviceId(selectedDeviceId);
    console.log(`Device changed to: ${selectedDeviceId}`);
  };
  
  // Function to handle adding a new device
  const handleAddDevice = async (deviceData: { deviceId: string; name: string; location: string }) => {
    try {
      // Call API to add device
      const result = await apiService.addDevice(deviceData);
      
      if (result.success) {
        // Get current date as ISO string for dateAdded
        const currentDate = new Date().toISOString();
        
        // Update local state with new device
        const newDevice = {
          deviceId: deviceData.deviceId,
          name: deviceData.name,
          location: deviceData.location,
          dateAdded: currentDate
        };
        
        setAvailableDevices(prev => [...prev, newDevice]);
        
        // Update user context if updateUser function is available
        if (updateUser && user) {
          const updatedDevices = [...(user.devices || []), {
            deviceId: deviceData.deviceId,
            name: deviceData.name,
            location: deviceData.location,
            dateAdded: currentDate
          }];
          
          updateUser({
            ...user,
            devices: updatedDevices
          });
        }
        
        // If this is the first device, set it as the selected device
        if (availableDevices.length === 0) {
          setDeviceId(deviceData.deviceId);
        }
      }
    } catch (error) {
      console.error("Failed to add device:", error);
      // Could add error state handling here
    }
  };
  
  // Loading state when no devices are available
  if (!user?.devices || user.devices.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full py-20">
        <div className="mb-8 relative">
          {/* Background glow effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#A2BDFF]/20 rounded-full blur-xl animate-ping-slow"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-[#FFC779]/15 rounded-full blur-lg animate-ping-slow" style={{ animationDelay: "0.5s" }}></div>
          
          {/* SVG illustration */}
          <svg 
            width="300" 
            height="300" 
            viewBox="0 0 280 280" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="animate-float relative z-10"
          >
            <path d="M185.124 44.1076C185.124 44.1076 151.514 86.6805 97.7377 61.2856C43.9616 35.8907 -9.8139 104.606 36.4926 146.432C82.7992 188.258 37.4848 211.241 68.9446 236.874C104.701 266.008 135.83 206.93 164.211 220.374C226.851 250.046 273.257 238.299 262.801 203.942C244.446 143.633 220.975 139.71 238.901 108.34C256.826 76.9702 217.264 11.746 185.124 44.1076Z" fill="#FFEFD7"/>
            <path d="M181.728 121.939C181.728 121.939 215.934 119.717 218.599 85.9555C215.49 83.7343 211.047 70.4073 218.599 69.0746C226.151 67.7419 231.482 69.0746 231.482 69.0746C231.482 69.0746 245.253 79.7361 227.928 87.7324C227.484 92.1749 227.04 131.712 191.501 149.037C155.962 166.362 181.728 121.939 181.728 121.939Z" fill="#FFC779" className="animate-pulse-slow"/>
            <path d="M238.214 47.3906L224.5 44.8917C223.74 44.7531 223.011 45.2574 222.872 46.0181L217.931 73.136C217.792 73.8967 218.296 74.6257 219.057 74.7643L232.771 77.2632C233.531 77.4018 234.26 76.8975 234.399 76.1369L239.34 49.0189C239.479 48.2582 238.975 47.5292 238.214 47.3906Z" fill="#A9CABC" className="animate-bounce-slow"/>
            <g className="origin-center animate-spin-slow" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <path d="M198.928 146.443C198.928 165.261 190.595 182.142 177.41 193.603C166.06 203.454 151.532 208.868 136.504 208.849C114.31 208.849 94.8349 197.281 83.7646 179.831C77.7922 170.39 74.4625 159.519 74.1226 148.353C73.7828 137.186 76.4453 126.133 81.8325 116.346C87.2197 106.559 95.1342 98.3973 104.75 92.7111C114.367 87.0249 125.333 84.0231 136.504 84.0187C165.451 84.0187 189.813 103.725 196.849 130.468C198.24 135.679 198.939 141.05 198.928 146.443Z" fill="#A2BDFF"/>
            </g>
            <path d="M177.41 193.603C166.06 203.453 151.532 208.868 136.504 208.849C114.31 208.849 94.8349 197.281 83.7645 179.831C93.5022 171.853 98.9929 172.705 102.653 174.074C106.652 175.585 108.873 182.355 120.423 175.691C131.973 169.028 141.302 185.02 145.744 187.686C163.514 186.406 172.772 190.191 177.41 193.603Z" fill="#A9CABC"/>
            <path d="M196.85 130.468C170.462 136.723 172.328 121.708 169.733 112.61C167.068 103.281 165.291 106.39 148.854 119.274C132.417 132.157 130.64 111.277 130.338 107.724C130.019 104.17 129.308 102.838 120.867 103.885C112.427 104.933 110.206 98.3946 103.098 102.837C100.148 104.685 96.1322 103.85 92.4539 102.233C98.2357 96.4464 105.103 91.8587 112.663 88.733C120.222 85.6074 128.324 84.0054 136.504 84.0189C165.451 84.0186 189.813 103.725 196.85 130.468Z" fill="#A9CABC"/>
            
            {/* Wrap all WiFi elements in a single group to animate together */}
            <g className="animate-pulse-slow">
              {/* Inner circle */}
              <path d="M83.4985 79.3276C83.2127 80.2925 83.2196 81.3203 83.518 82.2813C83.8165 83.2423 84.3932 84.0931 85.1752 84.7263C85.9573 85.3595 86.9095 85.7466 87.9115 85.8386C88.9135 85.9307 89.9204 85.7235 90.8046 85.2433C91.6889 84.7631 92.411 84.0315 92.8794 83.141C93.3479 82.2505 93.5419 81.241 93.4367 80.2403C93.3315 79.2396 92.9319 78.2925 92.2884 77.5189C91.645 76.7453 90.7866 76.1798 89.8218 75.894C88.528 75.511 87.135 75.6576 85.9492 76.3015C84.7633 76.9454 83.8818 78.0339 83.4985 79.3276Z" fill="#FFC779"/>
              
              {/* Middle circle */}
              <path d="M80.8863 66.9784C79.0716 67.9573 77.4692 69.2866 76.1719 70.8892C74.8746 72.4918 73.9082 74.3359 73.3287 76.3147C73.216 76.6901 73.1786 77.084 73.2185 77.4739C73.2584 77.8638 73.375 78.242 73.5614 78.5868C73.7478 78.9316 74.0005 79.2361 74.3049 79.483C74.6092 79.73 74.9594 79.9143 75.3352 80.0256C75.711 80.1369 76.1051 80.1729 76.4949 80.1316C76.8846 80.0902 77.2624 79.9723 77.6065 79.7846C77.9505 79.597 78.2542 79.3432 78.5 79.0379C78.7458 78.7326 78.9289 78.3818 79.0388 78.0056C79.4018 76.7792 80.0028 75.6364 80.8075 74.6424C81.6122 73.6484 82.6048 72.8226 83.7287 72.2123C84.8526 71.6019 86.0857 71.219 87.3576 71.0853C88.6295 70.9516 89.9153 71.0698 91.1415 71.4332C91.517 71.5458 91.9109 71.5832 92.3008 71.5433C92.6907 71.5034 93.0689 71.3868 93.4137 71.2004C93.7584 71.014 94.063 70.7614 94.3099 70.457C94.5568 70.1526 94.7412 69.8024 94.8525 69.4266C94.9638 69.0508 94.9998 68.6567 94.9584 68.2669C94.9171 67.8772 94.7992 67.4994 94.6115 67.1553C94.4238 66.8113 94.1701 66.5076 93.8648 66.2618C93.5595 66.016 93.2087 65.8329 92.8325 65.723C90.8572 65.1316 88.7842 64.9381 86.7336 65.1536C84.683 65.3691 82.6955 65.9893 80.8863 66.9784Z" fill="#FFC779"/>
              <path d="M76.2067 58.3613C73.2582 59.9521 70.6544 62.1119 68.5462 64.7158C66.4381 67.3197 64.8673 70.3159 63.9249 73.531C63.7007 74.2882 63.7864 75.1035 64.1633 75.7975C64.5402 76.4915 65.1773 77.0074 65.9345 77.2316C66.6917 77.4559 67.507 77.3701 68.201 76.9932C68.895 76.6164 69.4109 75.9793 69.6351 75.222C70.3637 72.7609 71.57 70.4674 73.185 68.4724C74.8001 66.4775 76.7923 64.8202 79.0478 63.5953C81.3034 62.3704 83.7782 61.6018 86.3309 61.3334C88.8836 61.065 91.4641 61.3021 93.9251 62.0311C94.3005 62.1438 94.6945 62.1812 95.0844 62.1413C95.4743 62.1013 95.8525 61.9848 96.1973 61.7984C96.542 61.612 96.8466 61.3593 97.0935 61.0549C97.3404 60.7505 97.5248 60.4004 97.6361 60.0246C97.7474 59.6487 97.7834 59.2547 97.742 58.8649C97.7007 58.4752 97.5828 58.0974 97.3951 57.7533C97.2074 57.4092 96.9537 57.1056 96.6484 56.8598C96.3431 56.614 95.9923 56.4308 95.616 56.3209C92.4066 55.3605 89.0386 55.0464 85.707 55.3966C82.3753 55.7468 79.1463 56.7545 76.2067 58.3613Z" fill="#FFC779"/>
              
              {/* Outer circle */}
              <path d="M98.4081 46.8977C93.9597 45.58 89.2953 45.1515 84.6812 45.6367C80.0671 46.1218 75.5939 47.5111 71.5168 49.7252C67.4397 51.9393 63.8387 54.9348 60.9194 58.5408C58.0001 62.1467 55.8198 66.2923 54.5028 70.741C54.3902 71.1164 54.3528 71.5104 54.3927 71.9003C54.4326 72.2902 54.5492 72.6684 54.7356 73.0131C54.922 73.3579 55.1746 73.6625 55.479 73.9094C55.7834 74.1563 56.1336 74.3407 56.5094 74.452C56.8852 74.5632 57.2793 74.5993 57.669 74.5579C58.0588 74.5165 58.4366 74.3986 58.7807 74.211C59.1247 74.0233 59.4284 73.7695 59.6742 73.4642C59.92 73.1589 60.1031 72.8081 60.213 72.4319C61.3078 68.7333 63.1205 65.2865 65.5476 62.2885C67.9746 59.2905 70.9685 56.8 74.3582 54.9592C77.7479 53.1184 81.467 51.9634 85.3031 51.5601C89.1393 51.1569 93.0173 51.5132 96.7156 52.6089C97.4718 52.8292 98.2843 52.7411 98.9756 52.3638C99.6669 51.9865 100.181 51.3508 100.404 50.5957C100.628 49.8406 100.544 49.0276 100.17 48.3346C99.7955 47.6416 99.1622 47.125 98.4081 46.8977Z" fill="#FFC779"/>
            </g>
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-2">No devices found</p>
        <p className="text-sm text-gray-500 mb-6">Add your first device to start monitoring your solar energy system</p>
        <AddDeviceModal onAddDevice={handleAddDevice} />
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return <div className="flex justify-center items-center h-full py-20">Loading dashboard data...</div>;
  }
  
  // Status indicator helper
  const getStatusColor = (status: 'active' | 'inactive' | 'warning') => {
    return status === 'active' ? 'bg-[#65B08F]' : 
           status === 'inactive' ? 'bg-[#FF6242]' : 
           'bg-[#EA9010]';
  };

  return (
    <div>
      {/* Device selector and add device button */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Device:</span>
            <select 
              value={deviceId} 
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {availableDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
          <AddDeviceModal onAddDevice={handleAddDevice} />
        </div>
      </div>
      
      {/* Banner integration */}
      <Banner 
        activeTab="Dashboard" 
        onTimePeriodChange={handleTimePeriodChange}
        onPanelChange={handlePanelChange}
        selectedTimePeriod={selectedTimePeriod}
        deviceId={deviceId}
        selectedPanel={selectedPanel}
      />
      
      {/* Row 1: Sensor Overview - Minimalist, Line-based Layout */}
      <section className="border-b border-gray-200">
        <div className="px-4">
          {sensorData && <SensorOverview sensorData={sensorData} />}
        </div>
      </section>
      
      {/* Row 2: Panels & System Overview - Balanced 3-Column Layout */}
      <section className="border-b border-gray-200">
        <div className="grid grid-cols-12 gap-0">
            {/* Left Column: Panel Status - now 2 cols wide instead of 3 */}
            <div className="col-span-12 lg:col-span-2 grid grid-cols-1 divide-y divide-gray-200 border-r border-gray-200">
             
            {filteredPanelData.map(panel => (
              <div key={panel.id} className="flex flex-col justify-center py-3 pl-4 pr-2">
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 mr-1.5 flex-shrink-0 ${getStatusColor(panel.status)}`}></div>
                  <div>
                    <h3 className="text-xs font-medium">Panel {panel.id}</h3>
                    <div className="mt-2">
                      <div className="text-4xl font-bold leading-none tracking-tight">{panel.energy} <span className="text-xs text-gray-500 font-normal ml-0.5">kWH</span></div>
                      <div className="flex mt-1 text-xs text-gray-600">
                        <div className="mr-3">Voltage <span className="font-medium">{panel.voltage} V</span></div>
                        <div>Current <span className="font-medium">{panel.current} A</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
          {/* Center Column: Energy Production - now 6 cols wide */}
          <div className="col-span-12 lg:col-span-6 border-r border-gray-200 order-3 lg:order-2">
            <div className="px-3 py-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Energy Production
                </h3>
                <div className="flex items-center space-x-4">
                  {systemStatus && (
                    <>
                      <div className="flex items-center text-gray-600">
                        <ThermometerIcon className="mr-1" size={14} />
                        <span className="text-xs font-medium">{systemStatus.temperature}°C</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BatteryMediumIcon className="mr-1" size={14} />
                        <span className="text-xs font-medium">{systemStatus.batteryLevel}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="w-full h-[280px] md:h-[40vw] max-h-[280px]">
                <EnergyProduction timePeriod={selectedTimePeriod} />
              </div>
            </div>
          </div>
          
          {/* Right Column: System Health - now 4 cols wide */}
          <div className="col-span-12 lg:col-span-4 order-2 lg:order-3">
            <div className="px-2 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 pb-2">
                  System Health Status
                </h3>
              </div>
              <SystemHealth />
            </div>
          </div>
        </div>
      </section>
      
      {/* Row 3: Graphs & Trends - 3-Column Grid */}
      <section className="pl-4 pr-3">
        <div className="grid grid-cols-1 md:grid-cols-3 -mx-2">
          {/* Battery Charge Graph */}
          <div className="border-r border-gray-200">
            <div className="px-3 py-3">
              <h3 className="text-base font-semibold text-gray-800 pb-2">
                Battery Charge
              </h3>
              <div className="w-full h-[220px] md:h-[35vw] max-h-[220px]">
                <BatteryChargeDischarge timePeriod={selectedTimePeriod} />
              </div>
            </div>
          </div>
          
          {/* Panel Temperature Graph */}
          <div className="border-r border-gray-200">
            <div className="px-3 py-3">
              <h3 className="text-base font-semibold text-gray-800 pb-2">
                Panel Temperature
              </h3>
              <div className="w-full h-[220px] md:h-[35vw] max-h-[220px]">
                <PanelTemperatureOverheating timePeriod={selectedTimePeriod} />
              </div>
            </div>
          </div>
          
          {/* Irradiance Graph */}
          <div>
            <div className="px-3 py-3">
              <h3 className="text-base font-semibold text-gray-800 pb-2">
                Irradiance
              </h3>
              <div className="w-full h-[220px] md:h-[35vw] max-h-[220px]">
                <IrradianceGraph timePeriod={selectedTimePeriod} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
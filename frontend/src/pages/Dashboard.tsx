import React, { useState, useEffect } from "react";
import SensorOverview from "../components/graphs/SensorOverview";
import EnergyProduction, { TimePeriod } from "../components/graphs/EnergyProduction";
import SystemHealth from "../components/graphs/SystemHealth";
import BatteryChargeDischarge from "../components/graphs/BatteryChargeDischarge";
import PanelTemperatureOverheating from "../components/graphs/PanelTemperatureOverheating";
import IrradianceGraph from "../components/graphs/IrradianceGraph";
import { ThermometerIcon, BatteryMediumIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import Banner from "../components/layout/Banner";

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

// Mock API service - would be replaced with actual API calls
const apiService = {
  fetchSensorData: async (): Promise<SensorDataType> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      irradiance: { value: 900, unit: "W/m²" },
      rain: { value: 90, unit: "%" },
      uvIndex: { value: 10, unit: "mW/cm²" },
      light: { value: 90, unit: "lx" },
      humidity: { value: 90, unit: "%" },
      temperature: { value: 40, unit: "°C" }
    };
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
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State with proper typing
  const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
  const [panelData, setPanelData] = useState<PanelDataType[]>([]);
  const [filteredPanelData, setFilteredPanelData] = useState<PanelDataType[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('24h');
  const [selectedPanel, setSelectedPanel] = useState<string>("All Panels");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7))
  });
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [sensors, panels, status] = await Promise.all([
          apiService.fetchSensorData(),
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
  }, []);

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

  // Function to handle date range changes
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    console.log(`Date range changed to:`, range);
    // In a real implementation, this would trigger a new data fetch with the date range
  };
  
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
      {/* Banner integration */}
      <Banner 
        activeTab="Dashboard" 
        onTimePeriodChange={handleTimePeriodChange}
        onPanelChange={handlePanelChange}
        onDateRangeChange={handleDateRangeChange}
        selectedTimePeriod={selectedTimePeriod}
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
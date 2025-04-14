import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import SensorTable from "../components/data/SensorTable"
import MultiSensorTable from "../components/data/MultiSensorTable"
import Banner from "../components/layout/Banner"
import filterIcon from "../assets/filter.svg"
import { useDevice } from "../context/DeviceContext"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Pagination } from "../components/ui/pagination"

// Add custom animation styles
const animationStyles = `
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes ping-slow {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-ping-slow { animation: ping-slow 3s ease-in-out infinite; }
.animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
.animate-spin-slow { animation: spin-slow 12s linear infinite; }
`;

// Define mapping between sensor types in the UI and backend
const sensorTypeMapping: Record<string, string> = {
  "Light": "light",
  "Irradiance": "solar",
  "Humidity": "dht22", // Will need to extract 'humidity' from this
  "Rain": "rain",
  "Ambient Temperature": "dht22", // Will need to extract 'temperature' from this
  "Battery": "battery",
  "Panel Temperature": "panel_temp",
  "Panel Voltage": "ina226", // Will need to extract 'voltage' from this
  "Panel Current": "ina226"  // Will need to extract 'current' from this
};

// Mapping for units
const unitMapping: Record<string, string> = {
  "Light": "lux",
  "Irradiance": "W/m²",
  "Humidity": "%",
  "Rain": "mm",
  "Ambient Temperature": "°C",
  "Battery": "%",
  "Panel Temperature": "°C",
  "Panel Voltage": "V",
  "Panel Current": "A"
};

export default function Sensors() {
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [sensorData, setSensorData] = useState<any[]>([])
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalDocuments: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Get deviceId and selectedPanel from context
  const { deviceId, selectedPanel } = useDevice()
  
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(), // Today
    to: new Date(),   // Today
  })
  
  const sensorTypes = [
    "Light",
    "Irradiance",
    "Humidity",
    "Rain",
    "Ambient Temperature",
    "Battery",
    "Panel Temperature",
    "Panel Voltage",
    "Panel Current"
  ]

  // Format panel selection for API
  const getPanelIdFromSelection = () => {
    if (!selectedPanel || selectedPanel === "All Panels") {
      return null;
    }
    
    // Extract panel number from string like "Panel 1"
    const panelMatch = selectedPanel.match(/Panel (\d+)/);
    return panelMatch ? panelMatch[1] : null;
  }
  
  // Function to fetch sensor data from the backend
  const fetchSensorData = async () => {
    if (selectedSensors.length === 0) {
      setSensorData([]);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add deviceId
      if (deviceId) {
        params.append('deviceId', deviceId);
      }
      
      // Add panel ID if a specific panel is selected
      const panelId = getPanelIdFromSelection();
      if (panelId) {
        params.append('panelIds', panelId);
      }
      
      // Add date range
      if (dateRange.from) {
        params.append('startDateTime', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append('endDateTime', dateRange.to.toISOString());
      }
      
      // Add timezone information
      params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
      
      // Add pagination parameters
      params.append('page', pagination.currentPage.toString());
      params.append('pageSize', pagination.pageSize.toString());
      
      // Map UI sensor types to backend sensor types
      const backendSensorTypes = selectedSensors
        .map(sensor => sensorTypeMapping[sensor])
        .filter((value, index, self) => value && self.indexOf(value) === index); // Remove duplicates
        
      // Add sensor types
      backendSensorTypes.forEach(sensorType => {
        params.append('sensorTypes', sensorType);
      });
      
      // Make API call
      const response = await fetch(`/api/readings/filtered?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching sensor data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch sensor data');
      }
      
      // Update pagination state
      if (result.pagination) {
        setPagination(result.pagination);
      }
      
      // Format the data based on the number of selected sensors
      const formattedData = formatSensorData(result.data);
      setSensorData(formattedData);
      
    } catch (err) {
      console.error("Error fetching sensor data:", err);
      setError(err instanceof Error ? err.message : String(err));
      setSensorData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format sensor data for UI display
  const formatSensorData = (apiData: any[]) => {
    if (!apiData || apiData.length === 0) {
      return [];
    }
    
    if (selectedSensors.length === 1) {
      // Format for single sensor view (SensorTable)
      const sensorType = selectedSensors[0];
      const mappedType = sensorTypeMapping[sensorType];
      
      return apiData.map(reading => {
        const formattedReading: any = {
          sensorType: sensorType,
          panel1: "N/A",
          panel2: "N/A",
          status: "Normal",
          time: format(new Date(reading.endTime), "h:mm a"),
          date: format(new Date(reading.endTime), "MM/dd/yyyy")
        };
        
        // Extract sensor readings
        if (reading.readings[mappedType]) {
          const sensorReadings = reading.readings[mappedType];
          
          // Handle nested values for humidity, temperature, voltage, current
          if (sensorType === "Humidity" || sensorType === "Ambient Temperature") {
            const valueField = sensorType === "Humidity" ? "humidity" : "temperature";
            
            if (sensorReadings.length > 0) {
              formattedReading.panel1 = sensorReadings[0]?.[valueField]?.average.toFixed(1) + " " + unitMapping[sensorType];
              if (sensorReadings.length > 1) {
                formattedReading.panel2 = sensorReadings[1]?.[valueField]?.average.toFixed(1) + " " + unitMapping[sensorType];
              }
            }
          } else if (sensorType === "Panel Voltage" || sensorType === "Panel Current") {
            const valueField = sensorType === "Panel Voltage" ? "voltage" : "current";
            
            if (sensorReadings.length > 0) {
              formattedReading.panel1 = sensorReadings[0]?.[valueField]?.average.toFixed(1) + " " + unitMapping[sensorType];
              if (sensorReadings.length > 1) {
                formattedReading.panel2 = sensorReadings[1]?.[valueField]?.average.toFixed(1) + " " + unitMapping[sensorType];
              }
            }
          } else {
            // Direct values like light, rain, etc.
            if (sensorReadings.length > 0) {
              formattedReading.panel1 = sensorReadings[0]?.average.toFixed(1) + " " + unitMapping[sensorType];
              if (sensorReadings.length > 1) {
                formattedReading.panel2 = sensorReadings[1]?.average.toFixed(1) + " " + unitMapping[sensorType];
              }
            }
          }
          
          // Determine status based on thresholds (simplified example)
          // This would need to be expanded with actual thresholds per sensor type
          if (sensorType === "Ambient Temperature") {
            const temp = parseFloat(formattedReading.panel1);
            if (temp > 40) formattedReading.status = "Critical";
            else if (temp > 35) formattedReading.status = "Warning";
          } else if (sensorType === "Panel Temperature") {
            const temp = parseFloat(formattedReading.panel1);
            if (temp > 45) formattedReading.status = "Warning";
            if (temp > 50) formattedReading.status = "Critical";
          }
        }
        
        return formattedReading;
      });
    } else {
      // Format for multi-sensor view (MultiSensorTable)
      return apiData.map(reading => {
        // Skip invalid readings
        if (!reading || !reading.endTime) {
          return null;
        }
        
        const formattedReading: {
          timestamp: string;
          sensors: Record<string, {value1: string; value2: string}>;
        } = {
          timestamp: format(new Date(reading.endTime), "MM/dd/yyyy h:mm a"),
          sensors: {}
        };
        
        // Initialize all selected sensors with default values
        // This ensures every selected sensor has an entry in the sensors object
        selectedSensors.forEach(sensorType => {
          formattedReading.sensors[sensorType] = {
            value1: "N/A",
            value2: "N/A"
          };
        });
        
        // Make sure readings object exists before processing
        if (!reading.readings) {
          return formattedReading;
        }
        
        // Process each selected sensor
        selectedSensors.forEach(sensorType => {
          const mappedType = sensorTypeMapping[sensorType];
          
          // Skip processing if no mapped type
          if (!mappedType) return;
          
          // Handle different sensor types
          if (sensorType === "Humidity" || sensorType === "Ambient Temperature") {
            const valueField = sensorType === "Humidity" ? "humidity" : "temperature";
            const sensorReadings = reading.readings["dht22"] || [];
            
            if (sensorReadings.length > 0 && sensorReadings[0] && sensorReadings[0][valueField] && sensorReadings[0][valueField].average !== undefined) {
              formattedReading.sensors[sensorType] = {
                value1: sensorReadings[0][valueField].average.toFixed(1) + " " + unitMapping[sensorType],
                value2: (sensorReadings[1] && sensorReadings[1][valueField] && sensorReadings[1][valueField].average !== undefined) 
                  ? sensorReadings[1][valueField].average.toFixed(1) + " " + unitMapping[sensorType] 
                  : "N/A"
              };
            }
          } else if (sensorType === "Panel Voltage" || sensorType === "Panel Current") {
            const valueField = sensorType === "Panel Voltage" ? "voltage" : "current";
            const sensorReadings = reading.readings["ina226"] || [];
            
            if (sensorReadings.length > 0 && sensorReadings[0] && sensorReadings[0][valueField] && sensorReadings[0][valueField].average !== undefined) {
              formattedReading.sensors[sensorType] = {
                value1: sensorReadings[0][valueField].average.toFixed(1) + " " + unitMapping[sensorType],
                value2: (sensorReadings[1] && sensorReadings[1][valueField] && sensorReadings[1][valueField].average !== undefined) 
                  ? sensorReadings[1][valueField].average.toFixed(1) + " " + unitMapping[sensorType] 
                  : "N/A"
              };
            }
          } else {
            // Direct values
            const sensorReadings = reading.readings[mappedType] || [];
            
            if (sensorReadings.length > 0 && sensorReadings[0] && sensorReadings[0].average !== undefined) {
              formattedReading.sensors[sensorType] = {
                value1: sensorReadings[0].average.toFixed(1) + " " + unitMapping[sensorType],
                value2: (sensorReadings[1] && sensorReadings[1].average !== undefined) 
                  ? sensorReadings[1].average.toFixed(1) + " " + unitMapping[sensorType] 
                  : "N/A"
              };
            }
          }
        });
        
        return formattedReading;
      }).filter(Boolean); // Remove any null entries
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  // Fetch data when selections change or page changes
  useEffect(() => {
    fetchSensorData();
  }, [selectedSensors, deviceId, selectedPanel, dateRange, pagination.currentPage]);

  // Function to get the appropriate table data
  const getTableData = () => {
    if (selectedSensors.length === 0) {
      return [];
    }
    
    return sensorData;
  }

  // Handle "All" button click
  const handleAllClick = () => {
    if (selectedSensors.length === sensorTypes.length) {
      // If all are selected, deselect all
      setSelectedSensors([])
    } else {
      // Otherwise select all
      setSelectedSensors([...sensorTypes])
    }
  }

  // Handle Banner callbacks
  const handlePanelChange = () => {
    // Banner component already updates the context
  }
  
  const handleDateRangeChange = (range: DateRange) => {
    if (!range.from || !range.to) {
      setDateRange(range);
      return;
    }
    
    // Set start date to beginning of day in local timezone (00:00:00)
    const startDate = new Date(range.from);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of day in local timezone (23:59:59)
    const endDate = new Date(range.to);
    endDate.setHours(23, 59, 59, 999);
    
    setDateRange({ from: startDate, to: endDate });
  }

  // Page size options
  const pageSizeOptions = [10, 20, 50, 100];
  
  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      currentPage: 1 // Reset to page 1 when changing page size
    }));
  };

  return (
    <div className="flex flex-col">
      {/* Include animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <Banner 
        activeTab="Sensors" 
        selectedSensors={selectedSensors} 
        onPanelChange={handlePanelChange}
        onDateRangeChange={handleDateRangeChange}
      />
      {/* Subtitle */}
      <p className="text-[#6F6F6F] px-6 mt-2">
        Select specific sensors to view real-time data
      </p>

      {/* Sensor Type Chips */}
      <div className="flex flex-wrap gap-2 px-6 mt-4">
        <Button
          variant="outline"
          size="sm"
          className={`rounded-[10px] ${
            selectedSensors.length === sensorTypes.length
              ? "bg-[#FFF5DF] border-[#F6AE0E] text-[#F6AE0E]"
              : "bg-transparent border-[#C8C8C8] text-[#6F6F6F] hover:border-[#FFD984] hover:bg-[#FFF5DF] hover:text-[#F6AE0E]"
          } text-sm px-3 py-1 min-w-[90px] h-auto group`}
          onClick={handleAllClick}
        >
          <img 
            src={filterIcon} 
            alt="Filter" 
            className={`w-4 h-4 mr-1 transition-all ${
              selectedSensors.length === sensorTypes.length
                ? "filter brightness-0 saturate-100 invert-[20%] sepia-[100%] saturate-[3000%] hue-rotate-[7deg] brightness-[104%] contrast-[101%]" 
                : "filter brightness-0 opacity-40 group-hover:opacity-100 group-hover:brightness-0 group-hover:saturate-100 group-hover:invert-[20%] group-hover:sepia-[100%] group-hover:saturate-[3000%] group-hover:hue-rotate-[7deg] group-hover:brightness-[104%] group-hover:contrast-[101%]"
            }`}
          />
          All
        </Button>
        {sensorTypes.map((sensor) => (
          <Button
            key={sensor}
            variant="outline"
            size="sm"
            className={`rounded-[12px] text-sm px-3 py-1 min-w-[90px] h-auto hover:border-[#FFD984] hover:bg-[#FFF5DF] hover:text-[#F6AE0E] ${
              selectedSensors.includes(sensor)
                ? "bg-[#FFF5DF] border-[#F6AE0E] text-[#F6AE0E]"
                : "bg-transparent border-[#C8C8C8] text-[#6F6F6F]"
            }`}
            onClick={() => {
              if (selectedSensors.includes(sensor)) {
                setSelectedSensors(selectedSensors.filter((s) => s !== sensor))
              } else {
                setSelectedSensors([...selectedSensors, sensor])
              }
            }}
          >
            {sensor}
          </Button>
        ))}
      </div>

      {/* Table Component */}
      <div className="px-6 mt-3 w-full mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-[#65B08F] border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-16">
            <p className="text-red-500">{error}</p>
          </div>
        ) : selectedSensors.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="mb-8 relative">
              {/* Background glow effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#A2BDFF]/20 rounded-full blur-xl animate-ping-slow"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-[#FFC779]/15 rounded-full blur-lg animate-ping-slow" style={{ animationDelay: "0.5s" }}></div>
              
              {/* SVG illustration with animations */}
              <svg 
                width="280" 
                height="280" 
                viewBox="0 0 137 109" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="animate-float relative z-10"
              >
                <path d="M80.2501 39.54C71.8701 39.59 63.3601 39.2 55.4001 36.99C47.4401 34.78 40.4001 30.61 34.0001 25.74C29.8101 22.57 26.0001 20.05 20.5601 20.43C15.2411 20.7095 10.1535 22.6941 6.05009 26.09C-0.869909 32.15 0.180093 43.35 2.94009 51.23C7.10009 63.1 19.7601 71.34 30.5101 76.71C42.9401 82.92 56.5901 86.53 70.2801 88.6C82.2801 90.42 97.6901 91.75 108.08 83.91C117.63 76.72 120.25 60.28 117.91 49.18C117.341 45.9015 115.595 42.9433 113 40.86C106.29 35.96 96.2901 39.23 88.7501 39.4C86.0001 39.46 83.1101 39.53 80.2501 39.54Z" fill="#FFEFD7"/>
                
                {/* Stars - animated */}
                <g className="animate-pulse-slow">
                  <path d="M39.3899 0.72998V5.02998" stroke="#FFC779" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M37.24 2.88H41.54" stroke="#FFC779" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M120.97 86.4399V90.7399" stroke="#FFC779" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M118.82 88.59H123.12" stroke="#FFC779" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6.89992 67.87C7.44116 67.87 7.87992 67.4313 7.87992 66.89C7.87992 66.3488 7.44116 65.91 6.89992 65.91C6.35868 65.91 5.91992 66.3488 5.91992 66.89C5.91992 67.4313 6.35868 67.87 6.89992 67.87Z" fill="#FFC779"/>
                  <path d="M90.3401 5.16996C90.8813 5.16996 91.3201 4.7312 91.3201 4.18996C91.3201 3.64872 90.8813 3.20996 90.3401 3.20996C89.7989 3.20996 89.3601 3.64872 89.3601 4.18996C89.3601 4.7312 89.7989 5.16996 90.3401 5.16996Z" fill="#FFC779"/>
                </g>
                
                <path d="M63.18 108.04C83.4488 108.04 99.88 107.019 99.88 105.76C99.88 104.501 83.4488 103.48 63.18 103.48C42.9111 103.48 26.48 104.501 26.48 105.76C26.48 107.019 42.9111 108.04 63.18 108.04Z" fill="#F2F2F2"/>
                
                {/* Main document - animated bounce */}
                <g className="animate-bounce-slow">
                  <path d="M34.9101 12.41H88.2101C89.5362 12.41 90.8079 12.9368 91.7456 13.8745C92.6833 14.8122 93.2101 16.084 93.2101 17.41V80.82C93.2101 82.1461 92.6833 83.4179 91.7456 84.3556C90.8079 85.2933 89.5362 85.82 88.2101 85.82H28.0801C26.754 85.82 25.4822 85.2933 24.5445 84.3556C23.6069 83.4179 23.0801 82.1461 23.0801 80.82V24.36L34.9101 12.41Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M92.97 43.3101H38.01V86.4301H92.97V43.3101Z" fill="#A2BDFF"/>
                  <path d="M23.0801 24.36H32.7701C33.3386 24.3574 33.8829 24.1297 34.2839 23.7268C34.6849 23.3239 34.9101 22.7785 34.9101 22.21V12.41L23.0801 24.36Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                
                {/* Document cards */}
                <g>
                  <path d="M92.7 29.54H38.34C36.2248 29.54 34.51 31.2548 34.51 33.37V45C34.51 47.1153 36.2248 48.83 38.34 48.83H92.7C94.8153 48.83 96.53 47.1153 96.53 45V33.37C96.53 31.2548 94.8153 29.54 92.7 29.54Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M45.07 42.55C46.9146 42.55 48.41 41.0546 48.41 39.21C48.41 37.3654 46.9146 35.87 45.07 35.87C43.2253 35.87 41.73 37.3654 41.73 39.21C41.73 41.0546 43.2253 42.55 45.07 42.55Z" fill="#A9CABC"/>
                  <path d="M55.57 42.55C57.4146 42.55 58.91 41.0546 58.91 39.21C58.91 37.3654 57.4146 35.87 55.57 35.87C53.7253 35.87 52.23 37.3654 52.23 39.21C52.23 41.0546 53.7253 42.55 55.57 42.55Z" fill="#A9CABC"/>
                  <path d="M66.06 42.55C67.9046 42.55 69.4 41.0546 69.4 39.21C69.4 37.3654 67.9046 35.87 66.06 35.87C64.2153 35.87 62.72 37.3654 62.72 39.21C62.72 41.0546 64.2153 42.55 66.06 42.55Z" fill="#A9CABC"/>
                  
                  <path d="M92.7 50.92H38.34C36.2248 50.92 34.51 52.6348 34.51 54.75V66.38C34.51 68.4953 36.2248 70.21 38.34 70.21H92.7C94.8153 70.21 96.53 68.4953 96.53 66.38V54.75C96.53 52.6348 94.8153 50.92 92.7 50.92Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M45.07 63.94C46.9146 63.94 48.41 62.4446 48.41 60.6C48.41 58.7554 46.9146 57.26 45.07 57.26C43.2253 57.26 41.73 58.7554 41.73 60.6C41.73 62.4446 43.2253 63.94 45.07 63.94Z" fill="#A9CABC"/>
                  <path d="M55.57 63.94C57.4146 63.94 58.91 62.4446 58.91 60.6C58.91 58.7554 57.4146 57.26 55.57 57.26C53.7253 57.26 52.23 58.7554 52.23 60.6C52.23 62.4446 53.7253 63.94 55.57 63.94Z" fill="#A9CABC"/>
                  <path d="M66.06 63.94C67.9046 63.94 69.4 62.4446 69.4 60.6C69.4 58.7554 67.9046 57.26 66.06 57.26C64.2153 57.26 62.72 58.7554 62.72 60.6C62.72 62.4446 64.2153 63.94 66.06 63.94Z" fill="#A9CABC"/>
                  
                  <path d="M92.7 72.3101H38.34C36.2248 72.3101 34.51 74.0248 34.51 76.1401V87.7701C34.51 89.8853 36.2248 91.6001 38.34 91.6001H92.7C94.8153 91.6001 96.53 89.8853 96.53 87.7701V76.1401C96.53 74.0248 94.8153 72.3101 92.7 72.3101Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M45.07 85.32C46.9146 85.32 48.41 83.8246 48.41 81.98C48.41 80.1354 46.9146 78.64 45.07 78.64C43.2253 78.64 41.73 80.1354 41.73 81.98C41.73 83.8246 43.2253 85.32 45.07 85.32Z" fill="#A9CABC"/>
                  <path d="M55.57 85.32C57.4146 85.32 58.91 83.8246 58.91 81.98C58.91 80.1354 57.4146 78.64 55.57 78.64C53.7253 78.64 52.23 80.1354 52.23 81.98C52.23 83.8246 53.7253 85.32 55.57 85.32Z" fill="#A9CABC"/>
                  <path d="M66.06 85.32C67.9046 85.32 69.4 83.8246 69.4 81.98C69.4 80.1354 67.9046 78.64 66.06 78.64C64.2153 78.64 62.72 80.1354 62.72 81.98C62.72 83.8246 64.2153 85.32 66.06 85.32Z" fill="#A9CABC"/>
                </g>
                
                {/* Magnifying glass - animated rotate */}
                <g className="origin-center animate-pulse-slow" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                  <path d="M97.6199 53.8999C109.069 53.8999 118.35 44.6188 118.35 33.1699C118.35 21.7211 109.069 12.4399 97.6199 12.4399C86.171 12.4399 76.8899 21.7211 76.8899 33.1699C76.8899 44.6188 86.171 53.8999 97.6199 53.8999Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M112.34 48.21L117.86 53.73" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M117.11 51.4601L115.396 53.2527C114.625 54.0592 114.654 55.3378 115.46 56.1087L130.351 70.3435C131.157 71.1144 132.436 71.0856 133.207 70.2792L134.92 68.4865C135.691 67.6801 135.663 66.4015 134.856 65.6306L119.966 51.3958C119.159 50.6249 117.88 50.6537 117.11 51.4601Z" fill="white" stroke="#FFC779" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
              </svg>
            </div>
            <p className="text-xl font-medium text-gray-800 mb-3">No sensor data to display</p>
            <p className="text-base text-gray-500">Please select at least one sensor to view data</p>
          </div>
        ) : selectedSensors.length === 1 ? (
          sensorData.length > 0 ? (
            <>
              <SensorTable data={getTableData() as any[]} />
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                  <div className="flex justify-center items-center mt-3 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select
                      className="ml-2 border rounded p-1"
                      value={pagination.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                      {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <span className="ml-4">
                      Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalDocuments)} of {pagination.totalDocuments}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p>No data available for the selected sensor and time range.</p>
            </div>
          )
        ) : (
          sensorData.length > 0 ? (
            <>
              <MultiSensorTable 
                data={getTableData() as any[]} 
                selectedSensors={selectedSensors}
              />
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                  <div className="flex justify-center items-center mt-3 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select
                      className="ml-2 border rounded p-1"
                      value={pagination.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                      {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <span className="ml-4">
                      Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalDocuments)} of {pagination.totalDocuments}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p>No data available for the selected sensors and time range.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}


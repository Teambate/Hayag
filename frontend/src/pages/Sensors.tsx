import { useState } from "react"
import { Button } from "../components/ui/button"
import SensorTable from "../components/data/SensorTable"
import MultiSensorTable from "../components/data/MultiSensorTable"
import Banner from "../components/layout/Banner"
import filterIcon from "../assets/filter.svg"
import noDataIcon from "../assets/NoData.svg"

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

export default function Sensors() {
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])
  
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

  // Sample data for single sensor view
  const singleSensorData = {
    "Light": [
      {
        sensorType: "Light",
        panel1: "4500 lux",
        panel2: "4800 lux",
        status: "Warning",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Irradiance": [
      {
        sensorType: "Irradiance",
        panel1: "850 W/m²",
        panel2: "920 W/m²",
        status: "Normal",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Humidity": [
      {
        sensorType: "Humidity",
        panel1: "65%",
        panel2: "68%",
        status: "Normal",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Rain": [
      {
        sensorType: "Rain",
        panel1: "25 mm",
        panel2: "30 mm",
        status: "Normal",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Ambient Temperature": [
      {
        sensorType: "Ambient Temperature",
        panel1: "32°C",
        panel2: "45°C",
        status: "Critical",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Battery": [
      {
        sensorType: "Battery",
        panel1: "85%",
        panel2: "92%",
        status: "Normal",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Panel Temperature": [
      {
        sensorType: "Panel Temperature",
        panel1: "45°C",
        panel2: "48°C",
        status: "Warning",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Panel Voltage": [
      {
        sensorType: "Panel Voltage",
        panel1: "24.5 V",
        panel2: "25.2 V",
        status: "Normal",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ],
    "Panel Current": [
      {
        sensorType: "Panel Current",
        panel1: "5.8 A",
        panel2: "6.2 A",
        status: "Normal",
        time: "10:00 am",
        date: "12/28/2025"
      }
    ]
  }

  // Sample data for multi-sensor view
  const multiSensorData = [
    {
      timestamp: "02/23/2025 06:00am",
      rain: {
        value1: "25 mm",
        value2: "30 mm"
      },
      light: {
        value1: "4500 lux",
        value2: "4800 lux"
      },
      ambientTemp: {
        value1: "32°C",
        value2: "45°C"
      }
    },
    {
      timestamp: "02/23/2025 07:00am",
      rain: {
        value1: "28 mm",
        value2: "33 mm"
      },
      light: {
        value1: "5200 lux",
        value2: "5500 lux"
      },
      ambientTemp: {
        value1: "34°C",
        value2: "47°C"
      }
    },
    {
      timestamp: "02/23/2025 08:00am",
      rain: {
        value1: "30 mm",
        value2: "35 mm"
      },
      light: {
        value1: "6000 lux",
        value2: "6300 lux"
      },
      ambientTemp: {
        value1: "36°C",
        value2: "48°C"
      }
    }
  ]

  // Function to get the appropriate table data based on selected sensors
  const getTableData = () => {
    if (selectedSensors.length === 0) {
      return []
    } else if (selectedSensors.length === 1) {
      return singleSensorData[selectedSensors[0] as keyof typeof singleSensorData] || []
    } else {
      // For multiple sensors, transform the data for MultiSensorTable
      return multiSensorData.map(row => {
        // Initialize with explicit type for sensors
        const newRow: {
          timestamp: string;
          sensors: Record<string, {value1: string; value2: string}>;
        } = {
          timestamp: row.timestamp,
          sensors: {}
        };
        
        // Add selected sensors to the data
        if (selectedSensors.includes("Rain")) {
          newRow.sensors["Rain"] = row.rain;
        }
        if (selectedSensors.includes("Light")) {
          newRow.sensors["Light"] = row.light;
        }
        if (selectedSensors.includes("Ambient Temperature")) {
          newRow.sensors["Ambient Temperature"] = row.ambientTemp;
        }
        
        // Add dummy data for other selected sensors
        selectedSensors.forEach(sensor => {
          if (!newRow.sensors[sensor]) {
            newRow.sensors[sensor] = {
              value1: `${sensor} Panel 1 Value`,
              value2: `${sensor} Panel 2 Value`
            };
          }
        });
        
        return newRow;
      });
    }
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

  return (
    <div className="flex flex-col">
      {/* Include animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <Banner activeTab="Sensors" selectedSensors={selectedSensors} />
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

      {/* Table Component - conditionally render based on selection */}
      <div className="px-6 mt-3 w-full mx-auto">
        {selectedSensors.length === 0 ? (
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
          <SensorTable data={getTableData() as any[]} />
        ) : (
          <MultiSensorTable 
            data={getTableData() as any[]} 
            selectedSensors={selectedSensors}
          />
        )}
      </div>
    </div>
  )
}


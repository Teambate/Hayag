import { useState } from "react"
import { Button } from "../components/ui/button"
import SensorTable from "../components/data/SensorTable"
import MultiSensorTable from "../components/data/MultiSensorTable"

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
          } text-sm px-3 py-1`}
          onClick={handleAllClick}
        >
          <span className="mr-2">≡</span> All
        </Button>
        {sensorTypes.map((sensor) => (
          <Button
            key={sensor}
            variant="outline"
            size="sm"
            className={`rounded-[12px] text-sm px-3 py-1 hover:border-[#FFD984] hover:bg-[#FFF5DF] hover:text-[#F6AE0E] ${
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
      <div className="px-6 mt-6">
        {selectedSensors.length === 0 ? (
          <p className="text-center text-[#6F6F6F] py-10">
            Please select at least one sensor to view data
          </p>
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


// Define a more flexible interface for sensor data
interface SensorValues {
  value1: string;
  value2: string;
}

interface MultiSensorData {
  timestamp: string;
  // Use a dynamic key-value structure for sensors
  sensors: {
    [sensorName: string]: SensorValues;
  };
}

interface MultiSensorTableProps {
  data: MultiSensorData[];
  selectedSensors: string[];
}

export default function MultiSensorTable({ data, selectedSensors }: MultiSensorTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Time Stamp</th>
            {/* Dynamically generate table headers based on selected sensors */}
            {selectedSensors.map(sensor => (
              <th key={sensor} className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">{sensor}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t border-gray-100">
              <td className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">{row.timestamp}</td>
              {/* Dynamically generate table cells based on selected sensors */}
              {selectedSensors.map(sensor => (
                <td key={sensor} className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">
                  {row.sensors[sensor]?.value1 || "-"} | {row.sensors[sensor]?.value2 || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
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
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Time Stamp</th>
            {/* Dynamically generate table headers based on selected sensors */}
            {selectedSensors.map(sensor => (
              <th key={sensor} className="py-4 px-6 font-medium text-[#000000] text-center">{sensor}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t border-gray-100">
              <td className="py-4 px-6 font-regular text-[#000000] text-sm text-center">{row.timestamp}</td>
              {/* Dynamically generate table cells based on selected sensors */}
              {selectedSensors.map(sensor => (
                <td key={sensor} className="py-4 px-6 font-regular text-[#000000] text-sm text-center">
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
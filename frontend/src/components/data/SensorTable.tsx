interface SensorData {
  sensorType: string;
  panel1: string;
  panel2: string;
  status: string;
  time: string;
  date: string;
}

interface SensorTableProps {
  data: SensorData[];
}

export default function SensorTable({ data }: SensorTableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Sensor Type</th>
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Panel 1</th>
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Panel 2</th>
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Status</th>
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Time</th>
            <th className="py-4 px-6 font-medium text-[#000000] text-center">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t border-gray-100">
              <td className="py-4 px-6 font-regular text-[#000000] text-sm text-center">{row.sensorType}</td>
              <td className="py-4 px-6 font-regular text-[#000000] text-sm text-center">{row.panel1}</td>
              <td className="py-4 px-6 font-regular text-[#000000] text-sm text-center">{row.panel2}</td>
              <td className="py-4 px-6 text-center">
                <span className={`px-5 py-2 text-xs font-medium rounded-full text-white ${
                  row.status === "Normal" 
                    ? "bg-[#7FB093]" 
                    : row.status === "Warning"
                    ? "bg-[#F8B76B]"
                    : "bg-[#EB8B76]"
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="py-4 px-6 font-regular text-[#000000] text-sm text-center">{row.time}</td>
              <td className="py-4 px-6 font-regular text-[#000000] text-sm text-center">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

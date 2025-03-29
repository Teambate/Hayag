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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Sensor Type</th>
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Panel 1</th>
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Panel 2</th>
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Status</th>
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Time</th>
            <th className="py-4 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-center text-sm lg:text-base">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t border-gray-100">
              <td className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">{row.sensorType}</td>
              <td className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">{row.panel1}</td>
              <td className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">{row.panel2}</td>
              <td className="py-3 px-4 lg:py-5 lg:px-6 text-center">
                <span className={`px-3 py-1 lg:px-5 lg:py-2 text-xs font-medium rounded-full text-white ${
                  row.status === "Normal" 
                    ? "bg-[#7FB093]" 
                    : row.status === "Warning"
                    ? "bg-[#F8B76B]"
                    : "bg-[#EB8B76]"
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">{row.time}</td>
              <td className="py-3 px-4 lg:py-5 lg:px-6 font-medium text-[#000000] text-sm text-center">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

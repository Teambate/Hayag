import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// Mock data for irradiance by month
const irradianceData = [
  { month: 'Jan', morning: 300, afternoon: 600 },
  { month: 'Feb', morning: 400, afternoon: 700 },
  { month: 'Mar', morning: 500, afternoon: 800 },
  { month: 'Apr', morning: 600, afternoon: 700 },
  { month: 'May', morning: 700, afternoon: 950 },
  { month: 'Jun', morning: 800, afternoon: 900 },
  { month: 'Jul', morning: 700, afternoon: 800 },
];

const IrradianceGraph: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={irradianceData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              domain={[0, 1200]}
            />
            <YAxis
              dataKey="month"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              width={30}
            />
            <Tooltip />
            <Bar
              dataKey="morning"
              fill="#FFE082"
              barSize={20}
              radius={[0, 0, 0, 0]}
              name="Morning"
            />
            <Bar
              dataKey="afternoon"
              fill="#81C784"
              barSize={20}
              radius={[0, 0, 0, 0]}
              name="Afternoon"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-1 space-x-6 text-sm text-gray-500 justify-center pt-3 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-200 mr-1"></div>
          <span>Morning</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-300 mr-1"></div>
          <span>Afternoon</span>
        </div>
      </div>
    </div>
  );
};

export default IrradianceGraph; 
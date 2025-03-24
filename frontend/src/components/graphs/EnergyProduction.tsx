import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", value: 120 },
  { name: "Tue", value: 140 },
  { name: "Wed", value: 100 },
  { name: "Thu", value: 160 },
  { name: "Fri", value: 180 },
  { name: "Sat", value: 190 },
  { name: "Sun", value: 210 }
];

const EnergyProduction: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${value} kWh`}
        />
        <Tooltip 
          formatter={(value) => [`${value} kWh`, "Energy"]}
          labelFormatter={(label) => `Day: ${label}`}
        />
        <Bar 
          dataKey="value" 
          fill="#65B08F" 
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EnergyProduction; 
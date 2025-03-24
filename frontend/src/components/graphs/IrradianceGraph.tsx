import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "6:00 AM", value: 200 },
  { time: "8:00 AM", value: 450 },
  { time: "10:00 AM", value: 800 },
  { time: "12:00 PM", value: 950 },
  { time: "2:00 PM", value: 890 },
  { time: "4:00 PM", value: 620 },
  { time: "6:00 PM", value: 290 },
];

const IrradianceGraph: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="time" 
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fontSize: 10 }} 
          axisLine={false}
          tickLine={false}
          domain={[0, 1000]}
          tickFormatter={(value) => `${value} W/m²`}
        />
        <Tooltip 
          formatter={(value) => [`${value} W/m²`, "Irradiance"]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#F9A826" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default IrradianceGraph;

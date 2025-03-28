import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TimePeriod } from './EnergyProduction';

// Different mock data sets for different time periods
const batteryDataSets = {
  '24h': [
    { time: '6AM', charge: 140, discharge: 100 },
    { time: '8AM', charge: 240, discharge: 150 },
    { time: '10AM', charge: 300, discharge: 200 },
    { time: '12PM', charge: 320, discharge: 250 },
    { time: '2PM', charge: 280, discharge: 260 },
    { time: '4PM', charge: 250, discharge: 210 },
    { time: '6PM', charge: 180, discharge: 170 },
    { time: '8PM', charge: 150, discharge: 160 },
  ],
  '7d': [
    { time: 'Mon', charge: 1200, discharge: 1000 },
    { time: 'Tue', charge: 1500, discharge: 1200 },
    { time: 'Wed', charge: 1300, discharge: 1100 },
    { time: 'Thu', charge: 1800, discharge: 1500 },
    { time: 'Fri', charge: 1600, discharge: 1400 },
    { time: 'Sat', charge: 1200, discharge: 1000 },
    { time: 'Sun', charge: 1100, discharge: 900 },
  ],
  '30d': [
    { time: 'W1', charge: 7800, discharge: 6500 },
    { time: 'W2', charge: 8500, discharge: 7200 },
    { time: 'W3', charge: 7500, discharge: 6800 },
    { time: 'W4', charge: 8200, discharge: 7500 },
  ],
  '90d': [
    { time: 'Jan', charge: 28000, discharge: 25000 },
    { time: 'Feb', charge: 30000, discharge: 27000 },
    { time: 'Mar', charge: 32000, discharge: 29000 },
  ],
};

// Component props interface
interface BatteryChargeDischargeProps {
  timePeriod?: TimePeriod;
}

const BatteryChargeDischarge: React.FC<BatteryChargeDischargeProps> = ({ timePeriod = '24h' }) => {
  // Get the correct data set based on the time period
  const batteryData = batteryDataSets[timePeriod];
  
  return (
    <div className="flex flex-col h-full">
      {/* Chart container - take up remaining space */}
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={batteryData} 
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCharge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDischarge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F44336" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F44336" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              domain={[0, 'auto']}
              tickCount={5}
            />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="charge" 
              stroke="#4CAF50" 
              fillOpacity={1} 
              fill="url(#colorCharge)" 
              name="Charge"
            />
            <Area 
              type="monotone" 
              dataKey="discharge" 
              stroke="#F44336" 
              fillOpacity={1} 
              fill="url(#colorDischarge)" 
              name="Discharge"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - No border and centered */}
      <div className="flex justify-center space-x-4 text-sm text-gray-500 pt-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Charge</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Discharge</span>
        </div>
      </div>
    </div>
  );
};

export default BatteryChargeDischarge; 
import React from 'react';

// Mock data for peak solar hours
const peakSolarData = [
  { day: 'Mon', value: 276, label: 'kWh' },
  { day: 'Tue', value: 282, label: 'kWh' },
  { day: 'Wed', value: 287, label: 'kWh', highlight: true },
  { day: 'Thu', value: 269, label: 'kWh' },
  { day: 'Fri', value: 274, label: 'kWh' },
  { day: 'Sat', value: 175, label: 'kWh' },
  { day: 'Sun', value: 138, label: 'kWh' },
];

const PeakSolarHours: React.FC = () => {
  return (
    <div className="grid grid-cols-7 gap-1 mt-4">
      {peakSolarData.map((day, index) => (
        <div key={index} className="text-center">
          <div className={`text-sm font-medium mb-1 ${day.highlight ? 'text-amber-500' : ''}`}>{day.day}</div>
          <div className={`p-4 ${day.highlight ? 'bg-amber-50' : 'bg-gray-50'} rounded-md`}>
            <div className={`text-xl font-bold ${day.highlight ? 'text-amber-500' : ''}`}>{day.value}</div>
            <div className="text-xs text-gray-500">{day.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PeakSolarHours; 
import React from 'react';
import { SunIcon, CloudRainIcon, SunDimIcon, SunMediumIcon, DropletIcon, ThermometerIcon } from 'lucide-react';

interface SensorDataItem {
  value: number;
  unit: string;
}

interface SensorDataProps {
  sensorData: {
    irradiance: SensorDataItem;
    rain: SensorDataItem;
    uvIndex: SensorDataItem;
    light: SensorDataItem;
    humidity: SensorDataItem;
    temperature: SensorDataItem;
  };
}

const SensorOverview: React.FC<SensorDataProps> = ({ sensorData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-gray-200">
      {/* Irradiance */}
      <div className="py-4 md:py-2 first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2 md:px-4 flex flex-col items-center justify-center">
        <div className="flex items-center text-amber-500 mb-2">
          <SunIcon className="mr-2" size={20} />
          <span className="text-sm">Irradiance</span>
        </div>
        <div className="text-4xl font-bold">
          {sensorData.irradiance.value}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {sensorData.irradiance.unit}
          </span>
        </div>
      </div>

      {/* Rain */}
      <div className="py-4 md:py-2 first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2 md:px-4 flex flex-col items-center justify-center">
        <div className="flex items-center text-blue-500 mb-2">
          <CloudRainIcon className="mr-2" size={20} />
          <span className="text-sm">Rain</span>
        </div>
        <div className="text-4xl font-bold">
          {sensorData.rain.value}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {sensorData.rain.unit}
          </span>
        </div>
      </div>

      {/* UV Index */}
      <div className="py-4 md:py-2 first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2 md:px-4 flex flex-col items-center justify-center">
        <div className="flex items-center text-purple-500 mb-2">
          <SunIcon className="mr-2" size={20} />
          <span className="text-sm">UV Index</span>
        </div>
        <div className="text-4xl font-bold">
          {sensorData.uvIndex.value}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {sensorData.uvIndex.unit}
          </span>
        </div>
      </div>

      {/* Light */}
      <div className="py-4 md:py-2 first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2 md:px-4 flex flex-col items-center justify-center">
        <div className="flex items-center text-yellow-500 mb-2">
          <SunMediumIcon className="mr-2" size={20} />
          <span className="text-sm">Light</span>
        </div>
        <div className="text-4xl font-bold">
          {sensorData.light.value}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {sensorData.light.unit}
          </span>
        </div>
      </div>

      {/* Humidity */}
      <div className="py-4 md:py-2 first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2 md:px-4 flex flex-col items-center justify-center">
        <div className="flex items-center text-blue-400 mb-2">
          <DropletIcon className="mr-2" size={20} />
          <span className="text-sm">Humidity</span>
        </div>
        <div className="text-4xl font-bold">
          {sensorData.humidity.value}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {sensorData.humidity.unit}
          </span>
        </div>
      </div>

      {/* Ambient Temp */}
      <div className="py-4 md:py-2 first:pt-0 md:first:pt-2 last:pb-0 md:last:pb-2 md:px-4 flex flex-col items-center justify-center">
        <div className="flex items-center text-red-500 mb-2">
          <ThermometerIcon className="mr-2" size={20} />
          <span className="text-sm">Ambient Temp</span>
        </div>
        <div className="text-4xl font-bold">
          {sensorData.temperature.value}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {sensorData.temperature.unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorOverview; 
import React from 'react';
import { SunIcon, CloudRainIcon, SunMediumIcon, DropletIcon, ThermometerIcon } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 -mx-4">
      {/* Irradiance */}
      <div className="flex flex-col items-center justify-center py-3 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex items-center text-amber-500 mb-1">
          <SunIcon className="mr-1" size={16} />
          <span className="text-xs">Irradiance</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {sensorData.irradiance.value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {sensorData.irradiance.unit}
          </span>
        </div>
      </div>

      {/* Rain */}
      <div className="flex flex-col items-center justify-center py-3 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex items-center text-blue-500 mb-1">
          <CloudRainIcon className="mr-1" size={16} />
          <span className="text-xs">Rain</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {sensorData.rain.value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {sensorData.rain.unit}
          </span>
        </div>
      </div>

      {/* UV Index */}
      <div className="flex flex-col items-center justify-center py-3 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex items-center text-purple-500 mb-1">
          <SunIcon className="mr-1" size={16} />
          <span className="text-xs">UV Index</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {sensorData.uvIndex.value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {sensorData.uvIndex.unit}
          </span>
        </div>
      </div>

      {/* Light */}
      <div className="flex flex-col items-center justify-center py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="flex items-center text-yellow-500 mb-1">
          <SunMediumIcon className="mr-1" size={16} />
          <span className="text-xs">Light</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {sensorData.light.value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {sensorData.light.unit}
          </span>
        </div>
      </div>

      {/* Humidity */}
      <div className="flex flex-col items-center justify-center py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="flex items-center text-blue-400 mb-1">
          <DropletIcon className="mr-1" size={16} />
          <span className="text-xs">Humidity</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {sensorData.humidity.value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {sensorData.humidity.unit}
          </span>
        </div>
      </div>

      {/* Ambient Temp */}
      <div className="flex flex-col items-center justify-center py-3 border-gray-200">
        <div className="flex items-center text-red-500 mb-1">
          <ThermometerIcon className="mr-1" size={16} />
          <span className="text-xs">Ambient Temp</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {sensorData.temperature.value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {sensorData.temperature.unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorOverview; 
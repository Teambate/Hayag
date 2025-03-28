import React from 'react';
import IrradianceIcon from '../../assets/Irradiance.svg';
import RainIcon from '../../assets/Rain.svg';
import UVIndexIcon from '../../assets/UV Index.svg';
import LightIcon from '../../assets/Light.svg';
import HumidityIcon from '../../assets/Humidity.svg';
import AmbientTempIcon from '../../assets/Ambient Temp.svg';

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
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={IrradianceIcon} alt="Irradiance" className="mr-1 w-4 h-4" />
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
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={RainIcon} alt="Rain" className="mr-1 w-4 h-4" />
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
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={UVIndexIcon} alt="UV Index" className="mr-1 w-4 h-4" />
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
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={LightIcon} alt="Light" className="mr-1 w-4 h-4" />
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
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={HumidityIcon} alt="Humidity" className="mr-1 w-4 h-4" />
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
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={AmbientTempIcon} alt="Ambient Temp" className="mr-1 w-4 h-4" />
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
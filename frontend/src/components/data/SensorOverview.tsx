import React from 'react';
import IrradianceIcon from '../../assets/Irradiance.svg';
import RainIcon from '../../assets/Rain.svg';
import UVIndexIcon from '../../assets/UV Index.svg';
import LightIcon from '../../assets/Light.svg';
import HumidityIcon from '../../assets/Humidity.svg';
import AmbientTempIcon from '../../assets/Ambient Temp.svg';

interface SensorPanel {
  panelId: string;
  value: number;
  unit: string;
}

interface SensorType {
  value: number;
  unit: string;
  panelCount?: number;
  panels?: SensorPanel[];
}

interface SensorResponseData {
  deviceId: string;
  timestamp: string;
  sensors: {
    solar: SensorType;
    rain: SensorType;
    uv: SensorType;
    light: SensorType;
    humidity: SensorType;
    temperature: SensorType;
    [key: string]: SensorType;
  };
}

interface SensorDataProps {
  sensorData: SensorResponseData;
  selectedPanel?: string;
}

const SensorOverview: React.FC<SensorDataProps> = ({ sensorData, selectedPanel = "All Panels" }) => {
  // Function to get the correct sensor value based on selected panel
  const getSensorValue = (sensorKey: string) => {
    // Safety check to ensure sensors and the specific sensor exist
    if (!sensorData?.sensors || !sensorData.sensors[sensorKey]) {
      return { value: 0, unit: "" };
    }
    
    // If "All Panels" is selected, use the average value
    if (selectedPanel === "All Panels") {
      return {
        value: sensorData.sensors[sensorKey].value,
        unit: sensorData.sensors[sensorKey].unit
      };
    }
    
    // For specific panel, find its data in panels array
    const panelId = selectedPanel.split(" ")[1];
    const panelData = sensorData.sensors[sensorKey].panels?.find(
      p => p.panelId === `Panel_${panelId}` || p.panelId === panelId
    );
    
    if (panelData) {
      return {
        value: panelData.value,
        unit: panelData.unit
      };
    }
    
    // Fallback to average if panel data not found
    return {
      value: sensorData.sensors[sensorKey].value,
      unit: sensorData.sensors[sensorKey].unit
    };
  };

  // Get sensor values based on selected panel
  const irradiance = getSensorValue('solar');
  const rain = getSensorValue('rain');
  const uvIndex = getSensorValue('uv');
  const light = getSensorValue('light');
  const humidity = getSensorValue('humidity');
  const temperature = getSensorValue('temperature');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 -mx-4">
      {/* Irradiance */}
      <div className="flex flex-col items-center justify-center py-3 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex items-center text-[#EA9010] mb-1">
          <img src={IrradianceIcon} alt="Irradiance" className="mr-1 w-4 h-4" />
          <span className="text-xs">Irradiance</span>
        </div>
        <div className="text-3xl font-bold leading-none">
          {typeof irradiance.value === 'number' ? irradiance.value.toFixed(2) : '0.00'}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {irradiance.unit}
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
          {typeof rain.value === 'number' ? rain.value.toFixed(2) : '0.00'}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {rain.unit}
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
          {typeof uvIndex.value === 'number' ? uvIndex.value.toFixed(2) : '0.00'}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {uvIndex.unit}
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
          {typeof light.value === 'number' ? light.value.toFixed(2) : '0.00'}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {light.unit}
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
          {typeof humidity.value === 'number' ? humidity.value.toFixed(2) : '0.00'}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {humidity.unit}
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
          {typeof temperature.value === 'number' ? temperature.value.toFixed(2) : '0.00'}
          <span className="text-xs font-normal text-gray-500 ml-0.5">
            {temperature.unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorOverview; 
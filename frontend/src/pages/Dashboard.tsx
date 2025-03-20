import { useState } from "react";
import SensorOverview from "../components/dashboard/SensorOverview";
import EnergyProduction from "../components/dashboard/EnergyProduction";
import SystemHealth from "../components/dashboard/SystemHealth";
import BatteryCharge from "../components/dashboard/BatteryCharge";
import PanelTemperature from "../components/dashboard/PanelTemperature";
import IrradianceGraph from "../components/dashboard/IrradianceGraph";

export default function Dashboard() {
  // Mock data would be replaced with actual API calls
  const [sensorData] = useState({
    irradiance: { value: 900, unit: "W/m²" },
    rain: { value: 90, unit: "%" },
    uvIndex: { value: 10, unit: "mW/cm²" },
    light: { value: 90, unit: "lx" },
    humidity: { value: 90, unit: "%" },
    temperature: { value: 40, unit: "°C" }
  });

  return (
    <div className="px-6 py-6">
      
      {/* Row 1: Sensor Overview - Minimalist, Line-based Layout */}
      <section className="border-b border-gray-200 pb-6">
        <SensorOverview sensorData={sensorData} />
      </section>
      
      {/* Row 2: Panels & System Overview - Balanced 3-Column Layout */}
      <section className="my-6 border-b border-gray-200 pb-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Panel Status - 3 cols wide */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Panel 1 Data */}
            <div className="border-l-4 border-dark-green pl-4">
              <h3 className="text-lg font-medium">Panel 1</h3>
              <div className="mt-2">
                <div className="text-5xl font-bold">90.88 <span className="text-sm text-gray-500 font-normal">kWH</span></div>
                <div className="flex mt-2 text-sm text-gray-600">
                  <div className="mr-6">Voltage <span className="font-medium">12.8 V</span></div>
                  <div>Current <span className="font-medium">3.5 A</span></div>
                </div>
              </div>
            </div>

            {/* Panel 2 Data */}
            <div className="border-l-4 border-dark-green pl-4">
              <h3 className="text-lg font-medium">Panel 2</h3>
              <div className="mt-2">
                <div className="text-5xl font-bold">90.88 <span className="text-sm text-gray-500 font-normal">kWH</span></div>
                <div className="flex mt-2 text-sm text-gray-600">
                  <div className="mr-6">Voltage <span className="font-medium">12.8 V</span></div>
                  <div>Current <span className="font-medium">3.5 A</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Energy Production - 6 cols wide */}
          <div className="col-span-12 lg:col-span-6 border-l border-gray-200 pl-6 order-3 lg:order-2">
            <h3 className="text-lg font-medium mb-4">Energy Production</h3>
            <EnergyProduction />
          </div>
          
          {/* Right Column: System Health - 3 cols wide */}
          <div className="col-span-12 lg:col-span-3 border-l border-gray-200 pl-6 order-2 lg:order-3">
            <h3 className="text-lg font-medium mb-4">System Health Summary</h3>
            <SystemHealth />
          </div>
        </div>
      </section>
      
      {/* Row 3: Graphs & Trends - 3-Column Grid */}
      <section className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Battery Charge Graph */}
          <div>
            <h3 className="text-lg font-medium mb-4">Battery Charge</h3>
            <BatteryCharge />
          </div>
          
          {/* Panel Temperature Graph */}
          <div className="border-l border-gray-200 pl-6">
            <h3 className="text-lg font-medium mb-4">Panel Temperature</h3>
            <PanelTemperature />
          </div>
          
          {/* Irradiance Graph */}
          <div className="border-l border-gray-200 pl-6">
            <h3 className="text-lg font-medium mb-4">Irradiance</h3>
            <IrradianceGraph />
          </div>
        </div>
      </section>
    </div>
  );
}
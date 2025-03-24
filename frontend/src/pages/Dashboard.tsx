import { useState } from "react";
import SensorOverview from "../components/graphs/SensorOverview";
import EnergyProduction from "../components/graphs/EnergyProduction";
import SystemHealth from "../components/graphs/SystemHealth";
import BatteryChargeDischarge from "../components/graphs/BatteryChargeDischarge";
import PanelTemperatureOverheating from "../components/graphs/PanelTemperatureOverheating";
import IrradianceGraph from "../components/graphs/IrradianceGraph";
import { ThermometerIcon, BatteryMediumIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
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
    <div>
      
      {/* Row 1: Sensor Overview - Minimalist, Line-based Layout */}
      <section className="border-b border-gray-200">
        <div className="px-4">
          <SensorOverview sensorData={sensorData} />
        </div>
      </section>
      
      {/* Row 2: Panels & System Overview - Balanced 3-Column Layout */}
      <section className="border-b border-gray-200">
        <div className="grid grid-cols-12 gap-0">
            {/* Left Column: Panel Status - now 2 cols wide instead of 3 */}
            <div className="col-span-12 lg:col-span-2 grid grid-cols-1 divide-y divide-gray-200 border-r border-gray-200">
              {/* Panel 1 Data */}
              <div className="flex flex-col justify-center py-3 pl-4 pr-2">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 mr-1.5 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xs font-medium">Panel 1</h3>
                    <div className="mt-2">
                      <div className="text-3xl font-bold leading-none tracking-tight">90.88 <span className="text-xs text-gray-500 font-normal ml-0.5">kWH</span></div>
                      <div className="flex mt-1 text-xs text-gray-600">
                        <div className="mr-3">Voltage <span className="font-medium">12.8 V</span></div>
                        <div>Current <span className="font-medium">3.5 A</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2 Data */}
              <div className="flex flex-col justify-center py-3 pl-4 pr-2">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 mr-1.5 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-xs font-medium">Panel 2</h3>
                    <div className="mt-2">
                      <div className="text-3xl font-bold leading-none tracking-tight">90.88 <span className="text-xs text-gray-500 font-normal ml-0.5">kWH</span></div>
                      <div className="flex mt-1 text-xs text-gray-600">
                        <div className="mr-3">Voltage <span className="font-medium">12.8 V</span></div>
                        <div>Current <span className="font-medium">3.5 A</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          {/* Center Column: Energy Production - now 6 cols wide */}
          <div className="col-span-12 lg:col-span-6 border-r border-gray-200 order-3 lg:order-2">
            <div className="px-3 py-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-m font-medium pb-2">Energy Production</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-gray-600">
                    <ThermometerIcon className="mr-1" size={14} />
                    <span className="text-xs font-medium">32°C</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <BatteryMediumIcon className="mr-1" size={14} />
                    <span className="text-xs font-medium">75%</span>
                  </div>
                </div>
              </div>
              <div className="w-full" style={{ height: "min(280px, 40vw)" }}>
                <EnergyProduction />
              </div>
            </div>
          </div>
          
          {/* Right Column: System Health - now 4 cols wide */}
          <div className="col-span-12 lg:col-span-4 order-2 lg:order-3">
            <div className="px-3 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-m font-medium">System Health Summary</h3>
                <div 
                  className="text-xs text-gray-500 font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/notes")}
                >
                  +2 more
                </div>
              </div>
              <SystemHealth />
            </div>
          </div>
        </div>
      </section>
      
      {/* Row 3: Graphs & Trends - 3-Column Grid */}
      <section className="pl-4 pr-3">
        <div className="grid grid-cols-1 md:grid-cols-3 -mx-2">
          {/* Battery Charge Graph */}
          <div className="border-r border-gray-200">
            <div className="px-3 py-3">
              <h3 className="text-sm font-medium mb-1">Battery Charge</h3>
              <div className="w-full" style={{ height: "min(250px, 40vw)" }}>
                <BatteryChargeDischarge />
              </div>
            </div>
          </div>
          
          {/* Panel Temperature Graph */}
          <div className="border-r border-gray-200">
            <div className="px-3 py-3">
              <h3 className="text-sm font-medium mb-1">Panel Temperature</h3>
              <div className="w-full" style={{ height: "min(250px, 40vw)" }}>
                <PanelTemperatureOverheating />
              </div>
            </div>
          </div>
          
          {/* Irradiance Graph */}
          <div>
            <div className="px-3 py-3">
              <h3 className="text-sm font-medium mb-1">Irradiance</h3>
              <div className="w-full" style={{ height: "min(280px, 38vw)" }}>
                <IrradianceGraph />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
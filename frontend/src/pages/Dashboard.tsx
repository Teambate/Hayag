<<<<<<< Updated upstream
import { useState } from "react";
import SensorOverview from "../components/dashboard/SensorOverview";
import EnergyProduction from "../components/dashboard/EnergyProduction";
import SystemHealth from "../components/dashboard/SystemHealth";
import BatteryCharge from "../components/dashboard/BatteryCharge";
import PanelTemperature from "../components/dashboard/PanelTemperature";
import IrradianceGraph from "../components/dashboard/IrradianceGraph";
=======
import { useState, ReactNode } from "react";
import SensorOverview from "../components/graphs/SensorOverview";
import EnergyProduction from "../components/graphs/EnergyProduction";
import SystemHealth from "../components/graphs/SystemHealth";
import BatteryChargeDischarge from "../components/graphs/BatteryChargeDischarge";
import PanelTemperatureOverheating from "../components/graphs/PanelTemperatureOverheating";
import IrradianceGraph from "../components/graphs/IrradianceGraph";
import { ThermometerIcon, BatteryMediumIcon, XIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
>>>>>>> Stashed changes

// Modal component for expanded graphs
interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const GraphModal = ({ isOpen, onClose, title, children }: GraphModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-xl font-medium">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="w-full" style={{ height: "60vh" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Interface for modal state
interface ModalState {
  isOpen: boolean;
  title: string;
  content: ReactNode | null;
}

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

  // Panel status (active/inactive)
  const [panelStatus] = useState({
    panel1: true, // active
    panel2: false // inactive
  });

  // State for modal
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: "",
    content: null
  });

  // Function to open modal with specific graph
  const openGraphModal = (title: string, content: ReactNode) => {
    setModalState({
      isOpen: true,
      title,
      content
    });
  };

  // Function to close modal
  const closeModal = () => {
    setModalState({
      ...modalState,
      isOpen: false
    });
  };

  return (
<<<<<<< Updated upstream
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
=======
    <div>
      {/* Modal */}
      <GraphModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        title={modalState.title}
      >
        {modalState.content}
      </GraphModal>
      
      {/* Row 1: Sensor Overview - Minimalist, Line-based Layout */}
      <section className="border-b border-gray-200">
        <div className="px-4">
          <div onClick={() => openGraphModal("Sensor Overview", <SensorOverview sensorData={sensorData} />)} 
               className="cursor-pointer hover:opacity-90 transition-opacity">
            <SensorOverview sensorData={sensorData} />
          </div>
        </div>
      </section>
      
      {/* Row 2: Panels & System Overview - Balanced 3-Column Layout */}
      <section className="border-b border-gray-200">
        <div className="grid grid-cols-12 gap-0 min-h-[270px] max-h-[380px] overflow-hidden">
            {/* Left Column: Panel Status - now 2 cols wide instead of 3 */}
            <div className="col-span-12 lg:col-span-2 flex flex-col divide-y divide-gray-200 border-r border-gray-200 overflow-hidden h-full">
             
              {/* Panel 1 Data */}
              <div className="flex-1 flex items-center py-2 pl-6 pr-1">
                <div className="flex items-start w-full">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-1.5 flex-shrink-0 ${panelStatus.panel1 ? 'bg-[#65B08F]' : 'bg-[#FF6242]'}`}></div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-medium truncate">Panel 1</h3>
                    <div className="mt-1">
                      <div className="text-4xl font-bold leading-none tracking-tight">90.88 <span className="text-xs text-gray-500 font-normal ml-0.5">kWH</span></div>
                      <div className="flex flex-wrap mt-1 text-xs text-gray-600">
                        <div className="mr-2">Voltage <span className="font-medium">12.8 V</span></div>
                        <div>Current <span className="font-medium">3.5 A</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2 Data */}
              <div className="flex-1 flex items-center py-2 pl-6 pr-1">
                <div className="flex items-start w-full">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-1.5 flex-shrink-0 ${panelStatus.panel2 ? 'bg-[#65B08F]' : 'bg-[#FF6242]'}`}></div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-medium truncate">Panel 2</h3>
                    <div className="mt-1">
                      <div className="text-4xl font-bold leading-none tracking-tight">90.88 <span className="text-xs text-gray-500 font-normal ml-0.5">kWH</span></div>
                      <div className="flex flex-wrap mt-1 text-xs text-gray-600">
                        <div className="mr-2">Voltage <span className="font-medium">12.8 V</span></div>
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
                <h3 className="text-m font-medium pb-1">Energy Production</h3>
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
              <div 
                className="w-full cursor-pointer hover:opacity-90 transition-opacity" 
                style={{ height: "min(280px, 40vw)" }}
                onClick={() => openGraphModal("Energy Production", <EnergyProduction />)}
              >
                <EnergyProduction />
              </div>
>>>>>>> Stashed changes
            </div>
          </div>

          {/* Center Column: Energy Production - 6 cols wide */}
          <div className="col-span-12 lg:col-span-6 border-l border-gray-200 pl-6 order-3 lg:order-2">
            <h3 className="text-lg font-medium mb-4">Energy Production</h3>
            <EnergyProduction />
          </div>
          
<<<<<<< Updated upstream
          {/* Right Column: System Health - 3 cols wide */}
          <div className="col-span-12 lg:col-span-3 border-l border-gray-200 pl-6 order-2 lg:order-3">
            <h3 className="text-lg font-medium mb-4">System Health Summary</h3>
            <SystemHealth />
=======
          {/* Right Column: System Health - now 4 cols wide */}
          <div className="col-span-12 lg:col-span-4 order-2 lg:order-3">
            <div className="px-3 pt-3 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-m font-medium">System Health Summary</h3>
                <div 
                  className="text-xs text-gray-500 font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/notes")}
                >
                  +2 more
                </div>
              </div>
              <div 
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openGraphModal("System Health Summary", <SystemHealth />)}
              >
                <SystemHealth />
              </div>
            </div>
>>>>>>> Stashed changes
          </div>
        </div>
      </section>
      
      {/* Row 3: Graphs & Trends - 3-Column Grid */}
      <section className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Battery Charge Graph */}
<<<<<<< Updated upstream
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
=======
          <div className="border-r border-gray-200">
            <div className="px-3 py-3">
              <h3 className="text-sm font-medium mb-1 pb-3">Battery Charge</h3>
              <div 
                className="w-full cursor-pointer hover:opacity-90 transition-opacity" 
                style={{ height: "220px" }}
                onClick={() => openGraphModal("Battery Charge", <BatteryChargeDischarge />)}
              >
                <BatteryChargeDischarge />
              </div>
            </div>
          </div>
          
          {/* Panel Temperature Graph */}
          <div className="border-r border-gray-200">
            <div className="px-3 py-3">
              <h3 className="text-sm font-medium mb-1 pb-3">Panel Temperature</h3>
              <div 
                className="w-full cursor-pointer hover:opacity-90 transition-opacity" 
                style={{ height: "220px" }}
                onClick={() => openGraphModal("Panel Temperature", <PanelTemperatureOverheating />)}
              >
                <PanelTemperatureOverheating />
              </div>
            </div>
          </div>
          
          {/* Irradiance Graph */}
          <div>
            <div className="px-3 py-3">
              <h3 className="text-sm font-medium mb-1 pb-3">Irradiance</h3>
              <div 
                className="w-full cursor-pointer hover:opacity-90 transition-opacity" 
                style={{ height: "220px" }}
                onClick={() => openGraphModal("Irradiance", <IrradianceGraph />)}
              >
                <IrradianceGraph />
              </div>
            </div>
>>>>>>> Stashed changes
          </div>
        </div>
      </section>
    </div>
  );
}
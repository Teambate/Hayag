import { useState } from "react";
import { TrendingUp, ArrowUp, SunIcon, GaugeIcon, Plus } from "lucide-react";

// Import graph components
import PanelPerformance from "../components/graphs/PanelPerformance";
import EfficiencyEnvironment from "../components/graphs/EfficiencyEnvironment";
import AnomalyDetection from "../components/graphs/AnomalyDetection";
import PeakSolarHours from "../components/graphs/PeakSolarHours";
import BatteryChargeDischarge from "../components/graphs/BatteryChargeDischarge";
import PanelTemperatureOverheating from "../components/graphs/PanelTemperatureOverheating";
import IrradiancePowerOutput from "../components/graphs/IrradiancePowerOutput";

export default function Analytics() {
  // Analytics data - would be replaced with actual API calls in production
  const [analyticsData] = useState({
    efficiency: { 
      value: 85, 
      trend: 2,
      trendDirection: "up" 
    },
    peakSolarHours: {
      start: "10am",
      end: "2pm",
      bestTime: "11am"
    },
    dailyYield: {
      value: 90.88,
      unit: "kWh"
    }
  });

  // Mock data for insights
  const insights = [
    {
      type: "efficiency",
      title: "Efficiency Increased",
      detail: "Panel 1 improved by 5%",
      date: "22 Oct 2024",
      time: "3:42pm"
    },
    {
      type: "fault",
      title: "Fault Detected",
      detail: "Panel 2 output reduced by70%",
      date: "22 Oct 2024",
      time: "3:42pm"
    },
    {
      type: "environment",
      title: "Environmental Impact",
      detail: "High Temperature reduced efficiency by 10%",
      date: "23 Oct 2024",
      time: "9:42am"
    },
    {
      type: "environment",
      title: "Environmental Impact",
      detail: "High Temperature reduced efficiency by 10%",
      date: "23 Oct 2024",
      time: "2:42pm"
    },
    {
      type: "environment",
      title: "Environmental Impact",
      detail: "High Temperature reduced efficiency by 10%",
      date: "22 Oct 2024",
      time: "9:42am"
    },
    {
      type: "sensor",
      title: "Rain Sensor Inactive",
      detail: "No rainfall for 9 days. Verify wiring.",
      date: "22 Oct 2024",
      time: "9:42pm"
    }
  ];

  return (
    <div className="px-6 py-6">
      {/* Row 1: First section (3-panels) and Insights & Notes sidebar */}
      <div className="grid grid-cols-12 gap-6 border-b border-gray-200 pb-6">
        {/* Left Column (Overview Section and Panel Performance Comparison) */}
        <div className="col-span-12 lg:col-span-8">
          {/* Overview Section */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Efficiency */}
            <div className="border-l-4 border-dark-green pl-4">
              <div className="flex items-center text-gray-500 mb-2">
                <GaugeIcon size={16} className="mr-1" />
                <span className="text-sm">Efficiency</span>
              </div>
              <div className="flex items-baseline">
                <div className="text-4xl font-bold">{analyticsData.efficiency.value}<span className="text-xl">%</span></div>
                <div className="ml-2 text-sm text-green-600 flex items-center">
                  <ArrowUp size={14} />
                  <span>+{analyticsData.efficiency.trend}% Today</span>
                </div>
              </div>
            </div>
            
            {/* Peak Solar Hours */}
            <div className="border-l-4 border-amber-400 pl-4">
              <div className="flex items-center text-gray-500 mb-2">
                <SunIcon size={16} className="mr-1" />
                <span className="text-sm">Peak Solar Hours</span>
              </div>
              <div className="flex items-baseline">
                <div className="text-4xl font-bold">{analyticsData.peakSolarHours.start}-{analyticsData.peakSolarHours.end}</div>
                <div className="ml-2 text-sm text-gray-600 flex items-center">
                  <span>Best Solar Time</span>
                </div>
              </div>
            </div>
            
            {/* Daily Yield */}
            <div className="border-l-4 border-red-400 pl-4">
              <div className="flex items-center text-gray-500 mb-2">
                <TrendingUp size={16} className="mr-1" />
                <span className="text-sm">Daily Yield</span>
              </div>
              <div className="flex items-baseline">
                <div className="text-4xl font-bold">{analyticsData.dailyYield.value}</div>
                <div className="ml-2 text-sm text-gray-600 flex items-center">
                  <span>{analyticsData.dailyYield.unit}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Panel Performance Comparison Graph */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Panel Performance Comparison</h3>
            <PanelPerformance />
          </div>
        </div>
        
        {/* Right Column: Insights & Notes Sidebar */}
        <div className="col-span-12 lg:col-span-4 border-l border-gray-200 pl-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Insights & Notes</h3>
            <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md flex items-center">
              <Plus size={14} className="mr-1" />
              Add Notes
            </button>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="relative pl-8 pb-4 border-l border-gray-100">
                {/* Colored dot based on insight type */}
                <div className={`absolute left-[-5px] top-0 w-3 h-3 rounded-full ${
                  insight.type === 'efficiency' ? 'bg-green-500' :
                  insight.type === 'fault' ? 'bg-amber-500' :
                  insight.type === 'environment' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-xs text-gray-700 mt-1">{insight.detail}</p>
                <p className="text-xs text-gray-500 mt-1">{insight.date} · {insight.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* "Overview of Sensors" banner is handled by Banner.tsx */}
      
      {/* Row 3: Two-Column Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-b border-gray-200 pb-6">
        {/* Left: Efficiency vs Environment */}
        <div>
          <h3 className="text-lg font-medium mb-2">Efficiency vs Environment</h3>
          <p className="text-sm text-gray-500 mb-4">Impact of temperature and humidity on efficiency</p>
          <EfficiencyEnvironment />
        </div>
        
        {/* Right: Fault & Anomaly Detection */}
        <div className="border-l border-gray-200 pl-6">
          <h3 className="text-lg font-medium mb-2">Fault & Anomaly Detection</h3>
          <p className="text-sm text-gray-500 mb-4">Identifying sensor deviations and system anomalies</p>
          <AnomalyDetection />
        </div>
      </div>
      
      {/* Row 4: Two-Column Data View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-b border-gray-200 pb-6">
        {/* Left: Peak Solar Hours Breakdown */}
        <div>
          <h3 className="text-lg font-medium mb-2">Peak Solar Hours & Off-Peak Analysis</h3>
          <p className="text-sm text-gray-500 mb-4">Solar energy generation trends throughout the week</p>
          <PeakSolarHours />
        </div>
        
        {/* Right: Battery Charge & Discharge Graph */}
        <div className="border-l border-gray-200 pl-6">
          <h3 className="text-lg font-medium mb-2">Battery Charge & Discharge</h3>
          <p className="text-sm text-gray-500 mb-4">Tracking battery charge levels and energy consumption</p>
          <BatteryChargeDischarge />
        </div>
      </div>
      
      {/* Row 5: Two-Column Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left: Panel Temperature & Overheating Graph */}
        <div>
          <h3 className="text-lg font-medium mb-2">Panel Temperature & Overheating</h3>
          <p className="text-sm text-gray-500 mb-4">Monitoring temperature fluctuations and overheating risks</p>
          <PanelTemperatureOverheating />
        </div>
        
        {/* Right: Solar Irradiance vs Power Output */}
        <div className="border-l border-gray-200 pl-6">
          <h3 className="text-lg font-medium mb-2">Solar Irradiance vs Power Output</h3>
          <p className="text-sm text-gray-500 mb-4">Comparing sunlight intensity with generated power</p>
          <IrradiancePowerOutput />
        </div>
      </div>
    </div>
  );
} 
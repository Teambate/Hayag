import { useState, useEffect } from "react"
import { PanelSelector } from "../ui/panel-selector"
import { IntervalSelector } from "../ui/interval-selector"
import { DateRangePicker } from "../ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { TimePeriod } from "../graphs/EnergyProduction"
import { useAuth } from "../../context/AuthContext"
import DownloadModal from "../ui/DownloadModal"

// Map UI intervals to TimePeriod values
const intervalToTimePeriod: Record<string, TimePeriod> = {
  "Hourly": "24h",
  "Daily": "7d",
  "Weekly": "30d",
  "Monthly": "90d"
};

// Map TimePeriod values to UI intervals
const timePeriodToInterval: Record<TimePeriod, string> = {
  "24h": "Hourly",
  "7d": "Daily",
  "30d": "Weekly",
  "90d": "Monthly"
};

interface BannerProps {
  activeTab: string;
  // Props for Dashboard integration
  onTimePeriodChange?: (period: TimePeriod) => void;
  onPanelChange?: (panel: string) => void;
  onDateRangeChange?: (range: DateRange) => void;
  selectedTimePeriod?: TimePeriod;
  selectedPanel?: string;
  deviceId?: string;
  selectedSensors?: string[];
}

export default function Banner({ 
  activeTab, 
  onTimePeriodChange, 
  onPanelChange, 
  onDateRangeChange,
  selectedTimePeriod = '24h',
  selectedPanel = 'All Panels',
  deviceId,
  selectedSensors = []
}: BannerProps) {
  // State for panel selection
  const [panel, setPanel] = useState(selectedPanel);
  // State for available panel IDs
  const [panelIds, setPanelIds] = useState<string[]>([])
  // State for loading panel IDs
  const [loadingPanels, setLoadingPanels] = useState<boolean>(false)

  // Get user from auth context
  const { user } = useAuth()

  // State for interval - UI representation (Hourly, Daily, Monthly)
  const [interval, setInterval] = useState<string>("Hourly")

  // State for date range - only used for Analytics and Sensors tabs
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2025, 1, 23), // Feb 23, 2025
    to: new Date(2025, 2, 4), // March 4, 2025
  })

  // Get device ID from props, user context, or localStorage
  const getDeviceId = () => {
    // First priority: deviceId from props
    if (deviceId) return deviceId;
    
    // Second priority: from user context
    if (user?.devices && user.devices.length > 0) {
      return user.devices[0].deviceId;
    }
    
    // Third priority: from localStorage
    const storedDeviceId = localStorage.getItem('deviceId');
    return storedDeviceId || "";
  }

  // Fetch panel IDs when deviceId changes
  useEffect(() => {
    const fetchPanelIds = async () => {
      const currentDeviceId = getDeviceId();
      if (!currentDeviceId) return;
      
      try {
        setLoadingPanels(true);
        const response = await fetch(`/api/readings/device/${currentDeviceId}/panels`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch panel IDs: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          console.log("Fetched panel IDs:", data.data);
          setPanelIds(data.data);
        } else {
          console.error("Unexpected response format:", data);
        }
      } catch (error) {
        console.error("Error fetching panel IDs:", error);
      } finally {
        setLoadingPanels(false);
      }
    };
    
    fetchPanelIds();
  }, [deviceId, user]);

  // Update local state when props change (for controlled components)
  useEffect(() => {
    if (selectedTimePeriod) {
      // Convert the TimePeriod to the corresponding UI interval
      setInterval(timePeriodToInterval[selectedTimePeriod]);
    }
  }, [selectedTimePeriod]);

  // Update panel state when prop changes
  useEffect(() => {
    if (selectedPanel) {
      setPanel(selectedPanel);
    }
  }, [selectedPanel]);

  // If the active tab is Notes or Settings, don't show the banner
  if (activeTab === "Notes" || activeTab === "Settings") {
    return null;
  }

  // Handle panel change
  const handlePanelChange = (newPanel: string) => {
    setPanel(newPanel);
    if (onPanelChange) {
      onPanelChange(newPanel);
    }
  }

  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    
    // Convert UI interval to TimePeriod and pass to parent component
    if (onTimePeriodChange) {
      const timePeriod = intervalToTimePeriod[newInterval];
      onTimePeriodChange(timePeriod);
    }
  }

  // Handle date range change - only relevant for Analytics and Sensors tabs
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
  }

  // Get the title based on active tab
  const getBannerTitle = () => {
    switch (activeTab) {
      case "Dashboard":
        return "System Performance Overview";
      case "Analytics":
        return "Performance Analytics";
      case "Sensors":
        return "Sensor Summary";
      default:
        return "";
    }
  }

  // Get appropriate panel options based on fetched panel IDs
  const getPanelOptions = () => {
    if (loadingPanels) {
      return ["Loading..."];
    }
    
    // Convert panel IDs to strings and format them as "Panel X"
    const panelOptions = panelIds.map(id => `Panel ${id.toString()}`);
    
    // Always include "All Panels" option
    if (!panelOptions.includes("All Panels")) {
      panelOptions.unshift("All Panels");
    }
    
    return panelOptions.length > 0 ? panelOptions : ["All Panels"];
  }

  // Get interval options - now always showing user-friendly labels
  const getIntervalOptions = () => {
    return [
      { value: "Hourly", label: "Hourly" },
      { value: "Daily", label: "Daily" },
      { value: "Weekly", label: "Weekly" },
      { value: "Monthly", label: "Monthly" }
    ];
  }

  return (
    <div className="w-full bg-white border-b">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1900px] mx-auto">
        <h1 className="text-2xl font-semibold text-[#1e3a29]">{getBannerTitle()}</h1>

        <div className="flex items-center gap-3">
          {/* Panel Dropdown */}
          <PanelSelector 
            value={panel} 
            onChange={handlePanelChange} 
            options={getPanelOptions()}
          />

          {/* Interval Dropdown - hide on Sensors page */}
          {activeTab !== "Sensors" && (
            <IntervalSelector 
              value={interval} 
              onChange={handleIntervalChange} 
              options={getIntervalOptions()} 
            />
          )}

          {/* Date Range Picker - show on Analytics and Sensors tabs, not on Dashboard */}
          {(activeTab === "Analytics" || activeTab === "Sensors") && (
            <DateRangePicker 
              value={dateRange} 
              onChange={handleDateRangeChange} 
            />
          )}

          {/* Download Modal - only visible on Sensors page */}
          {activeTab === "Sensors" && (
            <DownloadModal 
              dateRange={dateRange}
              sensors={selectedSensors}
            />
          )}
        </div>
      </div>
    </div>
  )
}
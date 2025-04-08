import { useState, useEffect } from "react"
import { PanelSelector } from "../ui/panel-selector"
import { IntervalSelector } from "../ui/interval-selector"
import { DateRangePicker } from "../ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { TimePeriod } from "../graphs/EnergyProduction"
import { useAuth } from "../../context/AuthContext"
import { useDevice } from "../../context/DeviceContext"
import DownloadModal from "../ui/DownloadModal"

// Map UI intervals to TimePeriod values
const intervalToTimePeriod: Record<string, TimePeriod> = {
  "10min": "24h",
  "30min": "24h",
  "hourly": "24h",
  "daily": "7d",
  "weekly": "30d",
  "monthly": "90d"
};

// Map TimePeriod values to UI intervals
const timePeriodToInterval: Record<TimePeriod, string> = {
  "24h": "hourly",
  "7d": "daily",
  "30d": "weekly",
  "90d": "monthly"
};

interface BannerProps {
  activeTab: string;
  // Props for Dashboard integration
  onTimePeriodChange?: (period: TimePeriod) => void;
  onPanelChange?: (panel: string) => void;
  onIntervalChange?: (interval: string) => void;
  onDateRangeChange?: (range: DateRange) => void;
  selectedTimePeriod?: TimePeriod;
  selectedPanel?: string;
  selectedInterval?: string;
  deviceId?: string;
  selectedSensors?: string[];
}

export default function Banner({ 
  activeTab, 
  onTimePeriodChange, 
  onPanelChange, 
  onIntervalChange,
  onDateRangeChange,
  selectedTimePeriod = '24h',
  selectedPanel,
  selectedInterval,
  deviceId,
  selectedSensors = []
}: BannerProps) {
  // Get device context
  const { deviceId: contextDeviceId, selectedPanel: contextSelectedPanel, setSelectedPanel } = useDevice();

  // State for panel selection - use context value or prop as default
  const [panel, setPanel] = useState(selectedPanel || contextSelectedPanel || 'All Panels');
  // State for available panel IDs
  const [panelIds, setPanelIds] = useState<string[]>([])
  // State for loading panel IDs
  const [loadingPanels, setLoadingPanels] = useState<boolean>(false)

  // Get user from auth context
  const { user } = useAuth()

  // State for interval - UI representation (Hourly, Daily, Monthly)
  const [interval, setInterval] = useState<string>(selectedInterval || "10min");

  // Get the default date range (last 7 days)
  const getDefaultDateRange = (): DateRange => {
    // Create end date at the very end of today in local time
    const endDate = new Date();
    // Set to end of day in local timezone
    endDate.setHours(23, 59, 59, 999);
    
    // Create start date 7 days ago at the very beginning of the day in local time
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    // Set to beginning of day in local timezone
    startDate.setHours(0, 0, 0, 0);
    
    return {
      from: startDate,
      to: endDate,
    };
  };

  // State for date range - only used for Analytics and Sensors tabs
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  // Trigger onDateRangeChange on initial render to provide default to parent
  useEffect(() => {
    if (onDateRangeChange && (activeTab === "Analytics" || activeTab === "Sensors")) {
      onDateRangeChange(dateRange);
    }
  }, []);

  // Get device ID from props, context, user context, or localStorage
  const getDeviceId = () => {
    // First priority: deviceId from props
    if (deviceId) return deviceId;
    
    // Second priority: from context
    if (contextDeviceId) return contextDeviceId;
    
    // Third priority: from user context
    if (user?.devices && user.devices.length > 0) {
      return user.devices[0].deviceId;
    }
    
    // Fourth priority: from localStorage
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
        // Add timezone as query parameter
        const params = new URLSearchParams();
        params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        const response = await fetch(`/api/readings/device/${currentDeviceId}/panels?${params.toString()}`);
        
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
  }, [deviceId, contextDeviceId, user]);

  // Update local state when props change (for controlled components)
  useEffect(() => {
    if (selectedTimePeriod) {
      // Convert the TimePeriod to the corresponding UI interval
      setInterval(timePeriodToInterval[selectedTimePeriod]);
    }
  }, [selectedTimePeriod]);

  // Update panel state when prop or context changes
  useEffect(() => {
    const newPanel = selectedPanel || contextSelectedPanel;
    if (newPanel) {
      setPanel(newPanel);
    } else {
      // Default to 'All Panels' if no panel is selected
      setPanel('All Panels');
    }
  }, [selectedPanel, contextSelectedPanel]);

  // Update interval state when prop changes
  useEffect(() => {
    if (selectedInterval) {
      setInterval(selectedInterval);
    }
  }, [selectedInterval]);

  // If the active tab is Notes or Settings, don't show the banner
  if (activeTab === "Notes" || activeTab === "Settings") {
    return null;
  }

  // Handle panel change
  const handlePanelChange = (newPanel: string) => {
    setPanel(newPanel);
    
    // Update global context
    setSelectedPanel(newPanel);
    
    // Also call prop callback if provided
    if (onPanelChange) {
      onPanelChange(newPanel);
    }
  }

  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    
    // Call parent interval change callback if provided
    if (onIntervalChange) {
      onIntervalChange(newInterval);
    }
    
    // Also convert UI interval to TimePeriod and pass to parent component if provided
    if (onTimePeriodChange) {
      const timePeriod = intervalToTimePeriod[newInterval];
      onTimePeriodChange(timePeriod);
    }
  }

  // Handle date range change - only relevant for Analytics and Sensors tabs
  const handleDateRangeChange = (newRange: DateRange) => {
    if (!newRange.from || !newRange.to) {
      setDateRange(newRange);
      if (onDateRangeChange) {
        onDateRangeChange(newRange);
      }
      return;
    }
    
    // Set start date to beginning of day in local timezone (00:00:00)
    const startDate = new Date(newRange.from);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of day in local timezone (23:59:59)
    const endDate = new Date(newRange.to);
    endDate.setHours(23, 59, 59, 999);
    
    const formattedRange = { from: startDate, to: endDate };
    setDateRange(formattedRange);
    
    if (onDateRangeChange) {
      onDateRangeChange(formattedRange);
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
    
    // Convert panel IDs to strings without adding "Panel " prefix
    const panelOptions = panelIds.map(id => id.toString());
    
    // Always include "All Panels" option
    if (!panelOptions.includes("All Panels")) {
      panelOptions.unshift("All Panels");
    }
    
    return panelOptions.length > 0 ? panelOptions : ["All Panels"];
  }

  // Get interval options - now always showing user-friendly labels
  const getIntervalOptions = () => {
    // For Dashboard tab, only show intervals up to hourly
    if (activeTab === "Dashboard") {
      return [
        { value: "10min", label: "10 min" },
        { value: "30min", label: "30 min" },
        { value: "hourly", label: "Hourly" }
      ];
    }
    
    // For other tabs, show all interval options
    return [
      { value: "10min", label: "10 min" },
      { value: "30min", label: "30 min" },
      { value: "hourly", label: "Hourly" },
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" }
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

          {/* Interval Dropdown - hide on Sensors and Analytics pages */}
          {activeTab !== "Sensors" && activeTab !== "Analytics" && (
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
import { useState, useEffect } from "react"
import { PanelSelector } from "../ui/panel-selector"
import { IntervalSelector } from "../ui/interval-selector"
import { DateRangePicker } from "../ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Download } from "lucide-react"
import { Button } from "../ui/button"
import { TimePeriod } from "../graphs/EnergyProduction"

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
}

export default function Banner({ 
  activeTab, 
  onTimePeriodChange, 
  onPanelChange, 
  onDateRangeChange,
  selectedTimePeriod = '24h'
}: BannerProps) {
  // State for panel selection
  const [panel, setPanel] = useState<string>("All Panels")

  // State for interval - UI representation (Hourly, Daily, Monthly)
  const [interval, setInterval] = useState<string>("Hourly")

  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2025, 1, 23), // Feb 23, 2025
    to: new Date(2025, 2, 4), // March 4, 2025
  })

  // Update local state when props change (for controlled components)
  useEffect(() => {
    if (selectedTimePeriod) {
      // Convert the TimePeriod to the corresponding UI interval
      setInterval(timePeriodToInterval[selectedTimePeriod]);
    }
  }, [selectedTimePeriod]);

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

  // Handle date range change
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

  // Get appropriate panel options based on active tab
  const getPanelOptions = () => {
    if (activeTab === "Dashboard") {
      return ["All Panels", "Panel 1", "Panel 2"];
    }
    return ["Panel 1", "Panel 2", "Panel 3", "Panel 4"];
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
      <div className="flex items-center justify-between px-6 py-2 max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-semibold text-[#1e3a29]">{getBannerTitle()}</h1>

        <div className="flex items-center gap-2">
          {/* Panel Dropdown */}
          <PanelSelector 
            value={panel} 
            onChange={handlePanelChange} 
            options={getPanelOptions()}
          />

          {/* Interval Dropdown */}
          <IntervalSelector 
            value={interval} 
            onChange={handleIntervalChange} 
            options={getIntervalOptions()} 
          />

          {/* Date Range Picker */}
          <DateRangePicker 
            value={dateRange} 
            onChange={handleDateRangeChange} 
          />

          {/* Download button - only visible on Sensors page */}
          {activeTab === "Sensors" && (
            <Button 
              variant="outline" 
              size="icon"
              className="bg-[#FAFDFB] border-transparent hover:border-[#6CBC92] hover:bg-[#FAFDFB]"
              onClick={() => {
                // Add download functionality here
                console.log("Download data")
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
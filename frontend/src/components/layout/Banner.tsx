import { useState } from "react"
import { PanelSelector } from "./ui/panel-selector"
import { IntervalSelector } from "./ui/interval-selector"
import { DateRangePicker } from "./ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Download } from "lucide-react"
import { Button } from "../ui/button"

interface BannerProps {
  activeTab: string;
}

export default function Banner({ activeTab }: BannerProps) {
  // State for panel selection
  const [panel, setPanel] = useState("Panel 1")

  // State for time interval
  const [interval, setInterval] = useState("Hourly")

  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2025, 1, 23), // Feb 23, 2025
    to: new Date(2025, 2, 4), // March 4, 2025
  })

  // If the active tab is Notes or Settings, don't show the banner
  if (activeTab === "Notes" || activeTab === "Settings") {
    return null;
  }

  // Get the title based on active tab
  const getBannerTitle = () => {
    switch (activeTab) {
      case "Dashboard":
        return "Overview of Sensors";
      case "Analytics":
        return "Performance Analytics";
      case "Sensors":
        return "Sensor Summary";
      default:
        return "";
    }
  }

  return (
    <div className="w-full bg-white border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-semibold text-[#1e3a29]">{getBannerTitle()}</h1>

        <div className="flex items-center gap-2">
          {/* Panel Dropdown */}
          <PanelSelector value={panel} onChange={setPanel} />

          {/* Interval Dropdown */}
          <IntervalSelector value={interval} onChange={setInterval} />

          {/* Date Range Picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

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
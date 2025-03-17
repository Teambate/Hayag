import { useState } from "react"
import { PanelSelector } from "./ui/panel-selector"
import { IntervalSelector } from "./ui/interval-selector"
import { DateRangePicker } from "./ui/date-range-picker"
import { DateRange } from "react-day-picker"

export default function SensorDashboard() {
  // State for panel selection
  const [panel, setPanel] = useState("Panel 1")

  // State for time interval
  const [interval, setInterval] = useState("Hourly")

  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2025, 1, 23), // Feb 23, 2025
    to: new Date(2025, 2, 4), // March 4, 2025
  })

  return (
    <div className="w-full bg-white border-b">
      <div className="flex items-center justify-between px-6 py-4 max-w-[1600px] mx-auto">
        <h1 className="text-3xl font-semibold text-[#1e3a29]">Overview of Sensors</h1>

        <div className="flex items-center gap-2">
          {/* Panel Dropdown */}
          <PanelSelector value={panel} onChange={setPanel} />

          {/* Interval Dropdown */}
          <IntervalSelector value={interval} onChange={setInterval} />

          {/* Date Range Picker */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>
    </div>
  )
}
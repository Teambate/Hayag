"use client"

import { useState } from "react"
import { PanelSelector } from "./panel-selector"
import { IntervalSelector } from "./interval-selector"
import { DateRangePicker } from "./date-range-picker"
import { DateRange } from "react-day-picker"

export function FilterDropdown() {
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
    <div className="flex flex-col w-full">
      <div className="bg-gray-700 p-4">
        <h2 className="text-white text-xl">Filter Dropdown</h2>
      </div>
      <div className="p-2 flex flex-col gap-2">
        <div className="flex gap-2">
          <PanelSelector value={panel} onChange={setPanel} />
          <IntervalSelector value={interval} onChange={setInterval} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>
    </div>
  )
}


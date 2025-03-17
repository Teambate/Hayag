import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "../../../components/ui/calendar"
import { Button } from "../../../components/ui/button" 
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Format date range for display
  const formattedDateRange =
    value.from && value.to ? `${format(value.from, "MM/dd/yy")} - ${format(value.to, "MM/dd/yy")}` : "Select date range"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-between gap-2 w-[220px] bg-white border-gray-200"
        >
          <CalendarIcon className="h-4 w-4" />
          {formattedDateRange}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value.from}
          selected={value}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange(range)
              setIsOpen(false)
            }
          }}
          numberOfMonths={1}
          initialFocus
          footer={
            <div className="flex items-center justify-between p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange({ from: undefined, to: undefined })
                }}
              >
                Clear
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setIsOpen(false)}>
                  OK
                </Button>
              </div>
            </div>
          }
        />
      </PopoverContent>
    </Popover>
  )
}

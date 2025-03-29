import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "../../components/ui/calendar"
import { Button } from "../../components/ui/button" 
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Track temporary selection state separately from the committed value
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(value)
  
  // Update internal state when props change
  useEffect(() => {
    setTempDateRange(value);
  }, [value.from?.toISOString(), value.to?.toISOString()]);

  // Format date range for display
  const formattedDateRange = 
    value.from && value.to 
      ? `${format(value.from, "MMM dd, yyyy")} - ${format(value.to, "MMM dd, yyyy")}`
      : value.from 
        ? `${format(value.from, "MMM dd, yyyy")}`
        : "Select date range"

  // Handle when the popover opens or closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reset temporary selection to match current value when opening
    if (open) {
      setTempDateRange(value);
    }
  }

  // Handle selection confirmation
  const handleConfirm = () => {
    if (tempDateRange) {
      onChange(tempDateRange);
    }
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-between gap-2 w-[220px] bg-[#FAFDFB] border-transparent hover:border-[#6CBC92] hover:bg-[#FAFDFB]"
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
          selected={tempDateRange}
          onSelect={setTempDateRange}
          numberOfMonths={1}
          initialFocus
          footer={
            <div className="flex items-center justify-between p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:bg-transparent"
                onClick={() => {
                  setTempDateRange({ from: undefined, to: undefined });
                }}
              >
                Clear
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:bg-transparent"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="ghost"
                  size="sm" 
                  className="text-[#65B08F] hover:bg-transparent"
                  onClick={handleConfirm}
                >
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

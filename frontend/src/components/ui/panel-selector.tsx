import { useState } from "react"
import { Button } from "../ui/button"     
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { ChevronDown } from "lucide-react"

interface PanelSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function PanelSelector({ value, onChange }: PanelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const options = ["Panel 1", "Panel 2", "All Panels"]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-between gap-2 w-[120px] bg-[#FAFDFB] border-transparent hover:border-[#6CBC92] hover:bg-[#FAFDFB]"
        >
          {value}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0" align="start">
        <div className="flex flex-col">
          {options.map((option) => (
            <Button
              key={option}
              variant="ghost"
              className="justify-start rounded-none h-10 hover:bg-[#FAFDFB] hover:border-[#6CBC92]"
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
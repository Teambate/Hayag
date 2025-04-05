"use client"

import React, { useState } from "react"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { ChevronDown, Filter } from "lucide-react"

export interface IntervalOption {
  value: string
  label: string
}

export interface IntervalSelectorProps {
  value: string
  onChange: (value: string) => void
  options?: IntervalOption[]
}

const defaultOptions: IntervalOption[] = [
  { value: "10min", label: "10 min" },
  { value: "30min", label: "30 min" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" }
]

export function IntervalSelector({ 
  value, 
  onChange, 
  options = defaultOptions 
}: IntervalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Find the current label to display
  const currentOption = options.find(opt => opt.value === value) || options[0]
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-between gap-2 w-[130px] bg-[#FAFDFB] border-transparent hover:border-[#6CBC92] hover:bg-[#FAFDFB]"
        >
          <Filter className="h-4 w-4" />
          {currentOption.label}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[130px] p-0" align="start">
        <div className="flex flex-col">
          {options.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={`justify-start rounded-none h-10 hover:bg-[#FAFDFB] hover:border-[#6CBC92] ${value === option.value ? 'bg-[#f0f9f4]' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}


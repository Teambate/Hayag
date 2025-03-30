import React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Check } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

interface DeviceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDevice: string
  onSelectDevice: (deviceName: string) => void
}

export function DeviceSelector({ 
  open, 
  onOpenChange, 
  currentDevice, 
  onSelectDevice 
}: DeviceSelectorProps) {
  const { user } = useAuth()
  const devices = user?.devices || []
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Select Device</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2 max-h-[300px] overflow-y-auto">
          {devices.length > 0 ? (
            devices.map((device) => (
              <div 
                key={device.deviceId} 
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                  currentDevice === device.name 
                    ? 'bg-[#FFF8E7] border border-[#FFBC3B]' 
                    : 'border border-gray-100 hover:bg-[#FAFDFB]'
                }`}
                onClick={() => onSelectDevice(device.name)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-[#664300]">{device.name}</span>
                  <span className="text-xs text-gray-500">{device.location}</span>
                </div>
                {currentDevice === device.name && (
                  <Check className="h-5 w-5 text-[#FFBC3B]" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No devices available
            </div>
          )}
        </div>
        <DialogFooter className="flex sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-[#FFBC3B] text-[#664300] hover:bg-[#FFD175]"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
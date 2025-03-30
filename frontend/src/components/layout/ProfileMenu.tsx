import React, { useState, useRef } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { Edit, Plus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import GirlProfile from "../../assets/girl.png"
import { DeviceSelector } from './DeviceSelector'
import AddDeviceModal from "../ui/AddDeviceModal"
import { DialogTrigger } from "../ui/dialog"

export interface ProfileMenuProps {
  className?: string
}

export function ProfileMenu({ className }: ProfileMenuProps) {
  const { user, refreshUser } = useAuth()
  const [currentDevice, setCurrentDevice] = useState(user?.devices?.[0]?.name || 'No device')
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const addDeviceButtonRef = useRef<HTMLButtonElement>(null)
  
  // Get user's location from the first device or default to Unknown
  const userLocation = user?.devices?.[0]?.location || 'Unknown'
  
  const handleDeviceSelection = (deviceName: string) => {
    setCurrentDevice(deviceName)
    // Here you would likely update this in your API/backend
  }
  
  const handleDeviceAdded = (device: { deviceId: string; name: string; location: string }) => {
    // Device was added successfully, refresh user data
    refreshUser()
    // Update current device if this is the first one
    if (!user?.devices?.length) {
      setCurrentDevice(device.name)
    }
  }
  
  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Avatar className={`h-8 w-8 sm:h-10 sm:w-10 cursor-pointer ${className}`}>
            <AvatarImage src={GirlProfile} alt="Profile" />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={GirlProfile} alt="Profile" />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-lg font-semibold text-[#664300]">{user?.name || 'User'}</h4>
                <p className="text-sm text-gray-600">{userLocation}</p>
              </div>
            </div>
            
            {/* Device Section */}
            <div className="space-y-2">
              <h5 className="text-md font-medium text-[#4F4F4F]">Current Device</h5>
              <div className="flex items-center justify-between p-2 bg-[#FAFDFB] rounded-md border border-gray-100">
                <span className="text-[#664300]">{currentDevice}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setIsPopoverOpen(false) // Close the popover
                    setIsDeviceSelectorOpen(true) // Open the device selector
                  }}
                >
                  <Edit className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">Change device</span>
                </Button>
              </div>
            </div>
            
            {/* Custom add device button that will close the popover */}
            <Button 
              variant="outline" 
              className="w-full bg-white border-[#FFBC3B] text-[#664300] hover:bg-[#FFF8E7] hover:text-[#664300]"
              onClick={() => {
                setIsPopoverOpen(false) // Close the popover
                // Click the actual add device button after a short delay
                setTimeout(() => {
                  addDeviceButtonRef.current?.click();
                }, 100);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Device
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Device Selector Dialog */}
      <DeviceSelector 
        open={isDeviceSelectorOpen}
        onOpenChange={setIsDeviceSelectorOpen}
        currentDevice={currentDevice}
        onSelectDevice={handleDeviceSelection}
      />

      {/* Modified AddDeviceModal implementation */}
      <span className="sr-only">
        <AddDeviceModal 
          onAddDevice={handleDeviceAdded} 
          ref={addDeviceButtonRef}
        />
      </span>
    </>
  )
} 
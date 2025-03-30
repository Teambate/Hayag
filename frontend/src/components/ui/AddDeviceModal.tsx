import { useState, forwardRef } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import {
  Dialog,
  DialogContentWithoutCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import api from "../../utils/api"
import { useAuth } from "../../context/AuthContext"

interface AddDeviceModalProps {
  onAddDevice: (device: { deviceId: string; name: string; location: string }) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  ref?: React.Ref<HTMLButtonElement>;
}

const AddDeviceModal = forwardRef<HTMLButtonElement, AddDeviceModalProps>(({ 
  onAddDevice, 
  isOpen, 
  onOpenChange 
}, ref) => {
  const [deviceId, setDeviceId] = useState("")
  const [deviceName, setDeviceName] = useState("")
  const [deviceLocation, setDeviceLocation] = useState("")
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Determine if we're using controlled or uncontrolled state
  const isControlled = isOpen !== undefined && onOpenChange !== undefined
  const open = isControlled ? isOpen : internalOpen
  const setOpen = isControlled 
    ? onOpenChange 
    : setInternalOpen
  
  const { updateUser } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!deviceId.trim() || !deviceName.trim()) {
      return
    }
    
    const deviceData = {
      deviceId: deviceId.trim(),
      name: deviceName.trim(),
      location: deviceLocation.trim()
    }
    
    try {
      setIsLoading(true)
      
      // Add device via API
      const response = await api.post('/auth/devices', deviceData)
      
      if (response.data.success) {
        // Update user context with new user data
        updateUser(response.data.data)
        
        // Also call onAddDevice prop for local state updates if needed
        onAddDevice(deviceData)
        
        // Reset form
        setDeviceId("")
        setDeviceName("")
        setDeviceLocation("")
        setOpen(false)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to add device. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            ref={ref}
            className="flex items-center gap-2 bg-[#6CBC92] hover:bg-[#5AA982] text-white px-4 py-2 font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Add Device
          </Button>
        </DialogTrigger>
      )}
      <DialogContentWithoutCloseButton className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Enter your device information to connect it to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="deviceId" className="text-sm font-medium text-gray-700">
              Device ID
            </label>
            <Input
              id="deviceId"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Enter device ID"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="deviceName" className="text-sm font-medium text-gray-700">
              Device Name
            </label>
            <Input
              id="deviceName"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Enter a recognizable name"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="deviceLocation" className="text-sm font-medium text-gray-700">
              Location (Optional)
            </label>
            <Input
              id="deviceLocation"
              value={deviceLocation}
              onChange={(e) => setDeviceLocation(e.target.value)}
              placeholder="Where is this device installed?"
              disabled={isLoading}
            />
          </div>
          <DialogFooter className="flex justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="mr-2"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#6CBC92] hover:bg-[#5AA982] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContentWithoutCloseButton>
    </Dialog>
  )
})

AddDeviceModal.displayName = "AddDeviceModal"

export default AddDeviceModal 
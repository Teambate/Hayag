import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Dialog,
  DialogContentWithoutCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

interface AddDeviceModalProps {
  onAddDevice: (device: { deviceId: string; name: string; location: string }) => void
}

export default function AddDeviceModal({ onAddDevice }: AddDeviceModalProps) {
  const [deviceId, setDeviceId] = useState("")
  const [deviceName, setDeviceName] = useState("")
  const [deviceLocation, setDeviceLocation] = useState("")
  const [open, setOpen] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!deviceId.trim() || !deviceName.trim()) {
      return
    }
    
    onAddDevice({
      deviceId: deviceId.trim(),
      name: deviceName.trim(),
      location: deviceLocation.trim()
    })
    
    // Reset form
    setDeviceId("")
    setDeviceName("")
    setDeviceLocation("")
    setOpen(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="flex items-center gap-2 bg-[#6CBC92] hover:bg-[#5AA982] text-white px-4 py-2 font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContentWithoutCloseButton className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Enter your device information to connect it to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            />
          </div>
          <DialogFooter className="flex justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#6CBC92] hover:bg-[#5AA982] text-white"
            >
              Add Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContentWithoutCloseButton>
    </Dialog>
  )
} 
import React, { useState, useEffect, useRef } from "react";
import { 
  Save, 
  RefreshCw, 
  User,
  MapPin,
  Smartphone,
  Plus,
  Bell,
  ChevronDown
} from "lucide-react";
import Banner from "../components/layout/Banner";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import AddDeviceModal from "../components/ui/AddDeviceModal";
import { useDevice } from "../context/DeviceContext";

// Define types for our components
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

interface SelectOptionProps {
  option: { value: string; label: string };
  isSelected: boolean;
  onClick: () => void;
}

// Simple toggle switch component
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={checked}
    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus:outline-none ${
      checked 
        ? 'bg-white border-[#65B08F]' 
        : 'bg-white border-gray-200'
    }`}
    onClick={() => onChange(!checked)}
  >
    <span
      className={`pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform ${
        checked 
          ? 'translate-x-5 bg-[#65B08F]' 
          : 'translate-x-0 bg-gray-200'
      }`}
    />
  </button>
);

// Simple Label component
const Label = ({ htmlFor, className = "", children, ...props }: LabelProps) => (
  <label 
    htmlFor={htmlFor} 
    className={`text-sm font-medium text-gray-700 ${className}`}
    {...props}
  >
    {children}
  </label>
);

// Select Option component for custom dropdown
const SelectOption = ({ option, isSelected, onClick }: SelectOptionProps) => (
  <div
    className={`px-3 py-2 cursor-pointer hover:bg-[#f0f9f4] ${
      isSelected ? 'bg-[#f0f9f4] text-[#1e3a29]' : 'text-gray-700'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <span>{option.label}</span>
      {isSelected && (
        <div className="text-[#65B08F]">✓</div>
      )}
    </div>
  </div>
);

// Enhanced Select component with custom styling
const Select = ({ value, onChange, options, className = "" }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update the button width when the component mounts or window resizes
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
    
    const updateWidth = () => {
      if (buttonRef.current) {
        setButtonWidth(buttonRef.current.offsetWidth);
      }
    };
    
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [buttonRef]);

  // Determine if dropdown should appear above or below button
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, bottom: 'auto' };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 240; // Max height of dropdown
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - buttonRect.bottom;
    
    if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
      // Position above if more space above than below
      return { 
        bottom: `${windowHeight - buttonRect.top}px`, 
        top: 'auto',
        maxHeight: `${Math.min(buttonRect.top - 20, 300)}px` 
      };
    } else {
      // Position below
      return { 
        top: `${buttonRect.bottom + 4}px`, 
        bottom: 'auto',
        maxHeight: `${Math.min(spaceBelow - 20, 300)}px`
      };
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm bg-white hover:border-[#65B08F] transition-colors ${className}`}
      >
        <span className="text-[#1e3a29]">{selectedOption?.label || value}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
          <div 
            ref={dropdownRef}
            className="fixed z-50 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden"
            style={{ 
              width: Math.max(buttonWidth, 240),
              left: buttonRef.current?.getBoundingClientRect().left || 0,
              ...getDropdownPosition()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full overflow-auto">
              {options.map((option) => (
                <SelectOption
                  key={option.value}
                  option={option}
                  isSelected={value === option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Device Button component (similar to AddNoteButton in Notes page)
const AddDeviceButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center bg-white border border-[#65B08F] hover:bg-[#f0f9f4] text-[#1e3a29] px-3 py-2 rounded-md shadow-sm transition-colors"
  >
    <Plus className="h-4 w-4 mr-1 text-[#65B08F]" />
    <span className="text-sm font-medium">Add Device</span>
  </button>
);

// Custom device selector dropdown
const DeviceSelector = ({ 
  value, 
  devices, 
  onChange 
}: { 
  value: string; 
  devices: Array<{deviceId: string; name: string; location: string}>; 
  onChange: (deviceId: string) => void; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDevice = devices.find(device => device.deviceId === value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update the button width when the component mounts or window resizes
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
    
    const updateWidth = () => {
      if (buttonRef.current) {
        setButtonWidth(buttonRef.current.offsetWidth);
      }
    };
    
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [buttonRef]);

  // Determine if dropdown should appear above or below button
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, bottom: 'auto' };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 240; // Max height of dropdown
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - buttonRect.bottom;
    
    if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
      // Position above if more space above than below
      return { 
        bottom: `${windowHeight - buttonRect.top}px`, 
        top: 'auto',
        maxHeight: `${Math.min(buttonRect.top - 20, 300)}px` 
      };
    } else {
      // Position below
      return { 
        top: `${buttonRect.bottom + 4}px`, 
        bottom: 'auto',
        maxHeight: `${Math.min(spaceBelow - 20, 300)}px`
      };
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm bg-white hover:border-[#65B08F] transition-colors"
      >
        <span className="text-[#1e3a29]">{selectedDevice?.name || "Select device"}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
          <div 
            ref={dropdownRef}
            className="fixed z-50 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden"
            style={{ 
              width: Math.max(buttonWidth, 240),
              left: buttonRef.current?.getBoundingClientRect().left || 0,
              ...getDropdownPosition()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full overflow-auto">
              {devices.map((device) => (
                <div
                  key={device.deviceId}
                  className={`px-3 py-2 cursor-pointer hover:bg-[#f0f9f4] ${
                    value === device.deviceId ? 'bg-[#f0f9f4] text-[#1e3a29]' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    onChange(device.deviceId);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{device.name}</div>
                      {device.location && (
                        <div className="text-xs text-gray-500">{device.location}</div>
                      )}
                    </div>
                    {value === device.deviceId && (
                      <div className="text-[#65B08F]">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Props for accessing the setActiveTab function
interface SettingsProps {
  setActiveTab?: (tab: string) => void;
}

export default function Settings({ setActiveTab }: SettingsProps) {
  const { user, updateUser } = useAuth();
  const { deviceId: contextDeviceId, setDeviceId: setContextDeviceId } = useDevice();
  
  // Profile settings state
  const [name, setName] = useState(user?.name || "");
  const [location, setLocation] = useState(user?.devices?.[0]?.location || "");
  const [, setCurrentDevice] = useState(user?.devices?.[0]?.name || "");
  const [deviceId, setDeviceId] = useState(contextDeviceId || user?.devices?.[0]?.deviceId || "");
  const [availableDevices, setAvailableDevices] = useState(
    user?.devices?.map(device => ({
      deviceId: device.deviceId,
      name: device.name,
      location: device.location
    })) || []
  );
  
  // Notification preferences
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [reportFrequency, setReportFrequency] = useState("weekly");
  
  // State for device selector dialog
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  
  // Status message state
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Update navbar active tab when component mounts
  useEffect(() => {
    if (setActiveTab) {
      setActiveTab("Settings");
    }
  }, [setActiveTab]);
  
  // Update profile settings from user context when it changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      
      if (user.devices && user.devices.length > 0) {
        const selectedDevice = user.devices.find(device => device.deviceId === contextDeviceId) || user.devices[0];
        setLocation(selectedDevice.location || "");
        setCurrentDevice(selectedDevice.name || "");
        setDeviceId(selectedDevice.deviceId || "");
        setAvailableDevices(
          user.devices.map(device => ({
            deviceId: device.deviceId,
            name: device.name,
            location: device.location
          }))
        );
      }
    }
  }, [user, contextDeviceId]);
  
  // Handle device change
  const handleDeviceChange = (newDeviceId: string) => {
    setDeviceId(newDeviceId);
    
    // Update the global device context
    setContextDeviceId(newDeviceId);
    
    const selectedDevice = availableDevices.find(
      device => device.deviceId === newDeviceId
    );
    
    if (selectedDevice) {
      setCurrentDevice(selectedDevice.name);
      setLocation(selectedDevice.location);
    }
  };
  
  // Handle adding a new device
  const handleAddDevice = (device: { deviceId: string; name: string; location: string }) => {
    // Update available devices
    setAvailableDevices(prev => [...prev, device]);
    
    // If this is the first device, set it as selected
    if (availableDevices.length === 0) {
      setDeviceId(device.deviceId);
      setCurrentDevice(device.name);
      setLocation(device.location);
    }
    
    // Show success message
    setStatusMessage({
      message: "Device added successfully!",
      type: 'success'
    });
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };
  
  // Save settings handler
  const handleSaveSettings = async () => {
    try {
      // In a real app, this would save the settings to the backend
      console.log("Settings saved:", {
        name,
        location,
        deviceId,
        systemNotifications,
        reportFrequency
      });
      
      // Update user in context if needed
      if (user) {
        // Create updated user object
        const updatedUser = {
          ...user,
          name
        };
        
        // Update device location in the selected device
        if (user.devices) {
          updatedUser.devices = user.devices.map(device => 
            device.deviceId === deviceId 
              ? { ...device, location } 
              : device
          );
        }
        
        // Update user in context
        updateUser(updatedUser);
      }
      
      // Make sure device context is updated with the current selection
      if (deviceId !== contextDeviceId) {
        setContextDeviceId(deviceId);
      }
      
      // Show success message
      setStatusMessage({
        message: "Settings saved successfully!",
        type: 'success'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      
      // Show error message
      setStatusMessage({
        message: "Failed to save settings. Please try again.",
        type: 'error'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  };
  
  return (
    <>
      <Banner activeTab="Settings" />
      
      <div className="max-w-5xl mx-auto py-6 px-4">
        {/* Header section with title and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-[#1e3a29]">Settings</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSaveSettings}
              className="bg-white border border-[#65B08F] hover:bg-[#f0f9f4] text-[#1e3a29] flex items-center transition-colors"
            >
              <Save className="h-4 w-4 mr-2 text-[#65B08F]" />
              Save Settings
            </Button>
          </div>
        </div>
        
        {/* Status message */}
        {statusMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            statusMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {statusMessage.message}
          </div>
        )}
        
        {/* Settings sections as cards, similar to Notes */}
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center">
              <User className="h-5 w-5 mr-2 text-[#65B08F]" />
              <h2 className="text-lg font-medium text-gray-800">Profile</h2>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Device selection */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 bg-[#FAFDFB] p-4 rounded-md border border-gray-100">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <Label className="block font-medium text-base">Current Device</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      {availableDevices.length > 0 
                        ? "Select which device you're configuring" 
                        : "No devices available. Add a device to get started."}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {availableDevices.length > 0 && (
                    <DeviceSelector
                      value={deviceId}
                      devices={availableDevices}
                      onChange={handleDeviceChange}
                    />
                  )}
                  
                  <AddDeviceButton onClick={() => setIsAddDeviceModalOpen(true)} />
                </div>
              </div>
              
              {/* Name */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-500" />
                  <Label htmlFor="name" className="text-base">Name</Label>
                </div>
                <div className="md:w-1/2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full focus:border-[#65B08F] focus:ring-[#65B08F] focus:ring-opacity-20"
                  />
                </div>
              </div>
              
              {/* Location */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <Label htmlFor="location" className="text-base">Location</Label>
                </div>
                <div className="md:w-1/2">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where is this device installed?"
                    className="w-full focus:border-[#65B08F] focus:ring-[#65B08F] focus:ring-opacity-20"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-[#65B08F]" />
              <h2 className="text-lg font-medium text-gray-800">Notifications</h2>
            </div>
            
            <div className="p-5 space-y-5">
              {/* System Notifications */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <Label className="block text-base">System Notifications</Label>
                    <p className="text-sm text-gray-500 mt-1">Show notifications for system events</p>
                  </div>
                </div>
                <div>
                  <Switch checked={systemNotifications} onChange={setSystemNotifications} />
                </div>
              </div>
              
              {/* Performance Reports */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <Label htmlFor="reportFrequency" className="block text-base">Performance Reports</Label>
                    <p className="text-sm text-gray-500 mt-1">How often to receive system performance reports</p>
                  </div>
                </div>
                <div className="md:w-1/2">
                  <Select 
                    value={reportFrequency} 
                    onChange={setReportFrequency}
                    options={[
                      { value: "never", label: "Never" },
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "monthly", label: "Monthly" }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Device Selector Dialog */}
      <Dialog open={isDeviceSelectorOpen} onOpenChange={setIsDeviceSelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Select Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[300px] overflow-y-auto">
            {availableDevices.length > 0 ? (
              availableDevices.map((device) => (
                <div 
                  key={device.deviceId} 
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                    deviceId === device.deviceId 
                      ? 'bg-[#f0f9f4] border border-[#65B08F]' 
                      : 'border border-gray-100 hover:bg-[#FAFDFB]'
                  }`}
                  onClick={() => {
                    handleDeviceChange(device.deviceId);
                    setIsDeviceSelectorOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[#1e3a29]">{device.name}</span>
                    <span className="text-xs text-gray-500">{device.location}</span>
                  </div>
                  {deviceId === device.deviceId && (
                    <div className="h-5 w-5 text-[#65B08F] flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No devices available
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeviceSelectorOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={() => setIsDeviceSelectorOpen(false)}
              className="bg-white border border-[#65B08F] hover:bg-[#f0f9f4] text-[#1e3a29]"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Device Modal */}
      <AddDeviceModal 
        onAddDevice={handleAddDevice} 
        isOpen={isAddDeviceModalOpen} 
        onOpenChange={setIsAddDeviceModalOpen}
      />
    </>
  );
} 
import React, { useState } from "react";
import { 
  Save, 
  Bell, 
  RefreshCw, 
  Clock, 
  LayoutGrid,
  Thermometer, 
  ChevronRight, 
  ShieldCheck,
  Check,
  ChevronDown
} from "lucide-react";
import Banner from "../components/layout/Banner";
import { TimePeriod } from "../components/graphs/EnergyProduction";
import { Button } from "../components/ui/button";

// Define types for our components
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

interface SelectOption {
  value: string;
  label?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface RadioItemProps {
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  id: string;
  children: React.ReactNode;
}

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

// Simple Switch component
const Switch = ({ checked, onCheckedChange, className = "", ...props }: SwitchProps) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`
      relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
      transition-colors focus:outline-none focus:ring-1
      ${checked ? 'bg-[#65B08F]' : 'bg-gray-200'}
      ${className}
    `}
    {...props}
  >
    <span
      className={`
        pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform 
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

// Simple Select component
const Select = ({ value, onChange, options, placeholder, className = "" }: SelectProps) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm
          bg-[#FAFDFB] border-transparent hover:border-[#6CBC92] ${className}
        `}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {open && (
        <div className="absolute mt-1 w-full z-10 bg-white border rounded-md shadow-lg">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={`
                  flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left
                  ${value === option.value ? 'bg-gray-50' : ''}
                `}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label || option.value}
                {value === option.value && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Radio component
const RadioGroup = ({ value, onValueChange, children, className = "", ...props }: RadioGroupProps) => (
  <div className={`flex items-center space-x-4 ${className}`} {...props}>
    {children}
  </div>
);

const RadioItem = ({ value, checked, onChange, id, children }: RadioItemProps) => (
  <div className="flex items-center space-x-1">
    <input
      type="radio"
      id={id}
      checked={checked}
      onChange={() => onChange(value)}
      className="h-4 w-4 text-[#65B08F] border-gray-300 focus:ring-[#65B08F]"
    />
    <Label htmlFor={id}>{children}</Label>
  </div>
);

export default function Settings() {
  // General preferences state
  const [defaultTimePeriod, setDefaultTimePeriod] = useState<TimePeriod>("24h");
  const [defaultPanel, setDefaultPanel] = useState("All Panels");
  const [refreshRate, setRefreshRate] = useState("5");
  const [temperatureUnit, setTemperatureUnit] = useState("celsius");
  
  // Notification settings state
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [performanceReports, setPerformanceReports] = useState(false);
  
  // State for showing password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // State for password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Save settings handler
  const handleSaveSettings = () => {
    // In a real app, this would save the settings to the backend
    console.log("Settings saved:", {
      defaultTimePeriod,
      defaultPanel,
      refreshRate,
      temperatureUnit,
      systemAlerts,
      performanceReports
    });
    
    // Show success message
    alert("Settings saved successfully!");
  };
  
  // Toggle password modal
  const togglePasswordModal = () => {
    setShowPasswordModal(!showPasswordModal);
    // Reset form fields when closing
    if (showPasswordModal) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };
  
  // Change password handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the password via API
    console.log("Password change requested", {
      currentPassword,
      newPassword,
      confirmPassword
    });
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    // Show success message and close modal
    alert("Password changed successfully!");
    togglePasswordModal();
  };
  
  // Handle time period change with proper typing
  const handleTimePeriodChange = (value: string) => {
    setDefaultTimePeriod(value as TimePeriod);
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Banner */}
      <Banner activeTab="Settings" />
      
      {/* Settings content container */}
      <div className="flex-grow overflow-auto bg-[#fafdfb]">
        <div className="max-w-[1000px] mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="p-6 border-b">
              <h1 className="text-2xl font-semibold text-[#1e3a29]">Settings</h1>
              <p className="text-gray-500 text-sm mt-1">Configure your dashboard preferences</p>
            </div>
            
            {/* Settings sections */}
            <div className="p-6">
              {/* General preferences section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <LayoutGrid className="h-5 w-5 mr-2 text-[#65B08F]" />
                  General Preferences
                </h2>
                
                <div className="space-y-4">
                  {/* Default time period */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <Label>Default Time Period</Label>
                    </div>
                    <Select 
                      value={defaultTimePeriod} 
                      onChange={handleTimePeriodChange}
                      options={[
                        { value: "24h", label: "24 Hours (Hourly)" },
                        { value: "7d", label: "7 Days (Daily)" },
                        { value: "30d", label: "30 Days (Weekly)" },
                        { value: "90d", label: "90 Days (Monthly)" }
                      ]}
                      placeholder="Select time period"
                      className="w-[180px]"
                    />
                  </div>
                  
                  {/* Default panel view */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <LayoutGrid className="h-4 w-4 mr-2 text-gray-500" />
                      <Label>Default Panel View</Label>
                    </div>
                    <Select 
                      value={defaultPanel} 
                      onChange={setDefaultPanel}
                      options={[
                        { value: "All Panels", label: "All Panels" },
                        { value: "Panel 1", label: "Panel 1" },
                        { value: "Panel 2", label: "Panel 2" }
                      ]}
                      placeholder="Select panel"
                      className="w-[180px]"
                    />
                  </div>
                  
                  {/* Data refresh rate */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
                      <Label>Data Refresh Rate</Label>
                    </div>
                    <Select 
                      value={refreshRate} 
                      onChange={setRefreshRate}
                      options={[
                        { value: "1", label: "Every 1 minute" },
                        { value: "5", label: "Every 5 minutes" },
                        { value: "15", label: "Every 15 minutes" },
                        { value: "30", label: "Every 30 minutes" },
                        { value: "60", label: "Every hour" }
                      ]}
                      placeholder="Select refresh rate"
                      className="w-[180px]"
                    />
                  </div>
                  
                  {/* Temperature unit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-2 text-gray-500" />
                      <Label>Temperature Unit</Label>
                    </div>
                    <RadioGroup 
                      value={temperatureUnit} 
                      onValueChange={setTemperatureUnit}
                    >
                      <RadioItem 
                        id="celsius"
                        value="celsius"
                        checked={temperatureUnit === "celsius"}
                        onChange={setTemperatureUnit}
                      >
                        °C
                      </RadioItem>
                      <RadioItem 
                        id="fahrenheit"
                        value="fahrenheit"
                        checked={temperatureUnit === "fahrenheit"}
                        onChange={setTemperatureUnit}
                      >
                        °F
                      </RadioItem>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              
              {/* Notification settings section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-[#65B08F]" />
                  Notification Settings
                </h2>
                
                <div className="space-y-4">
                  {/* System alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="block">System Alerts</Label>
                      <p className="text-xs text-gray-500 mt-1">Get notified about system warnings and errors</p>
                    </div>
                    <Switch 
                      checked={systemAlerts} 
                      onCheckedChange={setSystemAlerts} 
                    />
                  </div>
                  
                  {/* Performance reports */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="block">Performance Reports</Label>
                      <p className="text-xs text-gray-500 mt-1">Receive weekly performance summary reports</p>
                    </div>
                    <Switch 
                      checked={performanceReports} 
                      onCheckedChange={setPerformanceReports}
                    />
                  </div>
                </div>
              </div>
              
              {/* Security section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-[#65B08F]" />
                  Security
                </h2>
                
                <div>
                  {/* Change password button */}
                  <button 
                    onClick={togglePasswordModal}
                    className="flex items-center justify-between w-full px-4 py-3 bg-[#FAFDFB] border border-gray-100 rounded-md hover:bg-[#f0f9f4] transition"
                  >
                    <span className="text-sm font-medium text-gray-700">Change Password</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer with save button */}
            <div className="p-6 border-t bg-[#FAFDFB]">
              <Button 
                onClick={handleSaveSettings}
                className="bg-[#65B08F] hover:bg-[#4a9d75] flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password change modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
            
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password" className="block mb-1">
                    Current Password
                  </Label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-password" className="block mb-1">
                    New Password
                  </Label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm-password" className="block mb-1">
                    Confirm New Password
                  </Label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={togglePasswordModal}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#65B08F] hover:bg-[#4a9d75]"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
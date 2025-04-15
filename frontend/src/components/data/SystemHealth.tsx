import React, { useMemo, useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type SystemHealthProps = {
  health?: number;
  sensor_health?: {
    [key: string]: number;
  };
};

// Radial progress component
const RadialProgress: React.FC<{ percentage: number; status: string }> = ({ percentage, status }) => {
  const radius = 30;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on status
  const strokeColor = 
    status === "Critical" ? "#ef4444" : 
    status === "Warning" ? "#f59e0b" : 
    "#22c55e";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-sm font-medium">{percentage}%</div>
    </div>
  );
};

// Tooltip component for displaying sensor details
const SensorTooltip: React.FC<{ 
  isVisible: boolean, 
  sensors: Array<{ name: string, value: number }>,
  status: string,
  color: string,
  position: 'left' | 'center' | 'right'
}> = ({ isVisible, sensors, status, color, position }) => {
  if (!isVisible || sensors.length === 0) return null;

  // Define position classes based on the position prop
  const positionClasses = {
    left: "left-0 transform-none ml-0 mb-2",
    center: "left-1/2 transform -translate-x-1/2 mb-2",
    right: "right-0 transform-none mr-0 mb-2"
  };

  // Define arrow position classes
  const arrowPositionClasses = {
    left: "left-4 -translate-x-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-4 translate-x-0"
  };

  return (
    <div className={`absolute z-10 bottom-full ${positionClasses[position]} w-64 p-3 rounded-lg shadow-md bg-white border transition-opacity duration-200`}
         style={{ opacity: isVisible ? 1 : 0 }}>
      <div className="flex items-center mb-2">
        <Info className="h-4 w-4 mr-1.5" 
          style={{ color: color === "red" ? "#ef4444" : color === "amber" ? "#f59e0b" : "#22c55e" }} />
        <span className="text-sm font-medium">
          {status} Sensors ({sensors.length})
        </span>
      </div>
      <div className="max-h-36 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 font-medium text-gray-600">Sensor</th>
              <th className="text-right py-1 font-medium text-gray-600">Health</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="py-1.5 text-gray-700">{sensor.name}</td>
                <td className="py-1.5 text-right font-medium"
                    style={{ color: sensor.value < 40 ? "#ef4444" : sensor.value < 71 ? "#f59e0b" : "#22c55e" }}>
                  {sensor.value}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`absolute bottom-0 ${arrowPositionClasses[position]} transform translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b`} 
           style={{ borderColor: 'rgba(0,0,0,0.1)' }}></div>
    </div>
  );
};

const SystemHealth: React.FC<SystemHealthProps> = ({ health = 0, sensor_health = {} }) => {
  // Track the current time for relative time display
  const [lastCheckedTime] = useState(new Date());
  const [relativeTime, setRelativeTime] = useState("");
  
  // Track which card is being hovered
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Update the relative time every minute
  useEffect(() => {
    // Initial update
    setRelativeTime(formatDistanceToNow(lastCheckedTime, { addSuffix: true }));
    
    // Set up interval to update every minute
    const intervalId = setInterval(() => {
      setRelativeTime(formatDistanceToNow(lastCheckedTime, { addSuffix: true }));
    }, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [lastCheckedTime]);
  
  // Format sensor names for better readability
  const formatSensorName = (key: string): string => {
    // Convert snake_case or camelCase to Title Case with spaces
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };
  
  // Calculate health categories with sensors
  const healthCategories = useMemo(() => {
    const categories = {
      Critical: { count: 0, sensors: [] as Array<{ name: string, value: number }> },
      Warning: { count: 0, sensors: [] as Array<{ name: string, value: number }> },
      Good: { count: 0, sensors: [] as Array<{ name: string, value: number }> }
    };
    
    // Calculate counts for each category from sensor_health and collect sensors
    Object.entries(sensor_health).forEach(([key, value]) => {
      if (value < 40) {
        categories.Critical.count++;
        categories.Critical.sensors.push({ name: formatSensorName(key), value });
      } else if (value < 71) {
        categories.Warning.count++;
        categories.Warning.sensors.push({ name: formatSensorName(key), value });
      } else {
        categories.Good.count++;
        categories.Good.sensors.push({ name: formatSensorName(key), value });
      }
    });
    
    // Sort sensors by health value (ascending for Critical/Warning, descending for Good)
    categories.Critical.sensors.sort((a, b) => a.value - b.value);
    categories.Warning.sensors.sort((a, b) => a.value - b.value);
    categories.Good.sensors.sort((a, b) => b.value - a.value);
    
    return categories;
  }, [sensor_health]);
  
  // Determine overall system status based on health value
  const systemStatus = health < 40 ? "Critical" : health < 71 ? "Warning" : "Good";
  
  // Calculate totals for percentages
  const totalSensors = healthCategories.Critical.count + 
                       healthCategories.Warning.count + 
                       healthCategories.Good.count;
  
  // Calculate percentages for each category
  const percentages = {
    Critical: totalSensors > 0 ? Math.round((healthCategories.Critical.count / totalSensors) * 100) : 0,
    Warning: totalSensors > 0 ? Math.round((healthCategories.Warning.count / totalSensors) * 100) : 0,
    Good: totalSensors > 0 ? Math.round((healthCategories.Good.count / totalSensors) * 100) : 0
  };
  
  // Create health data array for rendering
  const healthData = [
    { 
      status: "Critical", 
      count: healthCategories.Critical.count, 
      sensors: healthCategories.Critical.sensors,
      percentage: percentages.Critical,
      description: "Sensors are not operating correctly",
      icon: AlertCircle,
      color: "red"
    },
    { 
      status: "Warning", 
      count: healthCategories.Warning.count,
      sensors: healthCategories.Warning.sensors,
      percentage: percentages.Warning,
      description: "Sensors might require attention",
      icon: AlertTriangle,
      color: "amber"
    },
    { 
      status: "Good", 
      count: healthCategories.Good.count,
      sensors: healthCategories.Good.sensors,
      percentage: percentages.Good,
      description: "Sensors operating normally",
      icon: CheckCircle,
      color: "green"
    }
  ];
  
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-4 p-3 flex-grow">
        {/* Status summary card with radial progress */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3.5 mb-4">
          <div className="flex items-center">
            <RadialProgress percentage={health} status={systemStatus} />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-800">
                System Status
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-gray-800">{systemStatus}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Last checked</div>
            <div className="text-xs sm:text-sm font-medium">{relativeTime}</div>
          </div>
        </div>
        
        {/* Modern gauge visualization */}
        <div className="mb-4">
          <div className="flex w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            {healthData.map((item, index) => (
              item.percentage > 0 && (
                <div 
                  key={index}
                  style={{ 
                    width: `${item.percentage}%` 
                  }}
                  className={`transition-all ${
                    item.color === "red" ? "bg-red-500" : 
                    item.color === "amber" ? "bg-amber-500" : 
                    "bg-green-500"
                  }`}
                />
              )
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <div>Critical</div>
            <div>Warning</div>
            <div>Good</div>
          </div>
        </div>
        
        {/* Health statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {healthData.map((item, index) => {
            // Determine tooltip position based on card position
            const tooltipPosition = index === 0 ? 'left' : index === 2 ? 'right' : 'center';
            
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg transition-colors relative ${
                  item.color === "red" ? "bg-red-50" : 
                  item.color === "amber" ? "bg-amber-50" : 
                  "bg-green-50"
                } ${item.sensors.length > 0 ? "cursor-pointer" : ""}`}
                onMouseEnter={() => item.sensors.length > 0 && setHoveredCard(item.status)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center">
                  <item.icon className={`h-4 w-4 mr-1.5 ${
                    item.color === "red" ? "text-red-500" : 
                    item.color === "amber" ? "text-amber-500" : 
                    "text-green-500"
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-semibold text-gray-800">{item.count}</div>
                <div className="text-xs mt-1 text-gray-500">{item.description}</div>
                
                {/* Tooltip for displaying sensors on hover */}
                <SensorTooltip 
                  isVisible={hoveredCard === item.status}
                  sensors={item.sensors}
                  status={item.status}
                  color={item.color}
                  position={tooltipPosition}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 
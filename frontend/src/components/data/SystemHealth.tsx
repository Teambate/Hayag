import React, { useMemo } from "react";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

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

const SystemHealth: React.FC<SystemHealthProps> = ({ health = 0, sensor_health = {} }) => {
  // Calculate health categories
  const healthCategories = useMemo(() => {
    const categories = {
      Critical: 0,
      Warning: 0,
      Good: 0
    };
    
    // Calculate counts for each category from sensor_health
    Object.values(sensor_health).forEach(value => {
      if (value < 40) {
        categories.Critical++;
      } else if (value < 71) {
        categories.Warning++;
      } else {
        categories.Good++;
      }
    });
    
    return categories;
  }, [sensor_health]);
  
  // Determine overall system status based on health value
  const systemStatus = health < 40 ? "Critical" : health < 71 ? "Warning" : "Good";
  
  // Calculate totals for percentages
  const totalSensors = Object.values(healthCategories).reduce((acc, count) => acc + count, 0);
  
  // Calculate percentages for each category
  const percentages = {
    Critical: totalSensors > 0 ? Math.round((healthCategories.Critical / totalSensors) * 100) : 0,
    Warning: totalSensors > 0 ? Math.round((healthCategories.Warning / totalSensors) * 100) : 0,
    Good: totalSensors > 0 ? Math.round((healthCategories.Good / totalSensors) * 100) : 0
  };
  
  // Create health data array for rendering
  const healthData = [
    { 
      status: "Critical", 
      count: healthCategories.Critical, 
      percentage: percentages.Critical,
      description: "Sensors are not operating correctly",
      icon: AlertCircle,
      color: "red"
    },
    { 
      status: "Warning", 
      count: healthCategories.Warning,
      percentage: percentages.Warning,
      description: "Sensors might require attention",
      icon: AlertTriangle,
      color: "amber"
    },
    { 
      status: "Good", 
      count: healthCategories.Good,
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
            <div className="text-xs text-gray-500">Overall Health</div>
            <div className="text-xs sm:text-sm font-medium">{health}%</div>
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
          {healthData.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg transition-colors ${
                item.color === "red" ? "bg-red-50" : 
                item.color === "amber" ? "bg-amber-50" : 
                "bg-green-50"
              }`}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 
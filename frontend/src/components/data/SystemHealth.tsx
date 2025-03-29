import React from "react";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

// Mock data for system health with more details
const healthData = [
  { 
    status: "Critical", 
    count: 0, 
    description: "No critical issues detected",
    icon: AlertCircle,
    color: "red"
  },
  { 
    status: "Warning", 
    count: 2, 
    description: "Minor issues requiring attention",
    icon: AlertTriangle,
    color: "amber"
  },
  { 
    status: "Good", 
    count: 12, 
    description: "Components operating normally",
    icon: CheckCircle,
    color: "green"
  }
];

// Radial progress component
const RadialProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 30;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
          stroke="#22c55e"
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

const SystemHealth: React.FC = () => {
  // Calculate totals for percentages
  const totalComponents = healthData.reduce((acc, item) => acc + item.count, 0);
  const goodPercentage = Math.round((healthData[2].count / totalComponents) * 100);
  
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-4 p-3 flex-grow">
        {/* Status summary card with radial progress */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3.5 mb-4">
          <div className="flex items-center">
            <RadialProgress percentage={goodPercentage} />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-800">
                System Status
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-gray-800">Good</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Last checked</div>
            <div className="text-xs sm:text-sm font-medium">Today, 2:34 PM</div>
          </div>
        </div>
        
        {/* Modern gauge visualization */}
        <div className="mb-4">
          <div className="flex w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            {healthData.map((item, index) => (
              item.count > 0 && (
                <div 
                  key={index}
                  style={{ 
                    width: `${(item.count / totalComponents) * 100}%` 
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
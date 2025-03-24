import React from "react";

// Mock data for system health
const healthData = [
  { status: "Critical", count: 0 },
  { status: "Warning", count: 2 },
  { status: "Good", count: 12 }
];

const SystemHealth: React.FC = () => {
  return (
    <div className="space-y-3">
      {healthData.map((item, index) => (
        <div key={index} className="flex items-center mb-2">
          <div className="w-2/3">
            <div className="flex items-center">
              <div 
                className={`h-3 w-3 rounded-full mr-2 ${
                  item.status === "Critical" 
                    ? "bg-red-500" 
                    : item.status === "Warning" 
                      ? "bg-yellow-500" 
                      : "bg-green-500"
                }`}
              />
              <span className="text-sm font-medium">{item.status}</span>
            </div>
            <div className="mt-1 relative pt-0.5">
              <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200">
                <div 
                  style={{ 
                    width: `${(item.count / Math.max(...healthData.map(d => d.count))) * 100}%`,
                    opacity: item.count === 0 ? 0 : 1
                  }} 
                  className={`
                    shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center 
                    ${
                      item.status === "Critical" 
                        ? "bg-red-500" 
                        : item.status === "Warning" 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                    }
                  `}
                />
              </div>
            </div>
          </div>
          <div className="w-1/3 text-right">
            <span className="text-2xl font-semibold">{item.count}</span>
            <div className="text-xs text-gray-500">components</div>
          </div>
        </div>
      ))}

      <div className="pt-2 mt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs">
          <div className="text-gray-500">Last checked:</div>
          <div className="font-medium">Today, 2:34 PM</div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <div className="text-gray-500">Last maintenance:</div>
          <div className="font-medium">March 15, 2023</div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 
import React from 'react';
import { CheckCircleIcon, AlertTriangleIcon, BatteryLowIcon, XCircleIcon } from 'lucide-react';

const SystemHealth: React.FC = () => {
  return (
    <div className="space-y-4">
            {/* Panel 1 - Good status */}
            <div className="mb-4 p-3 bg-green-50 rounded-md">
        <div className="flex">
          <CheckCircleIcon className="text-green-500 mr-2" size={20} />
          <div>
            <h4 className="font-medium">Panel 1 is stable</h4>
            <div className="text-sm text-gray-600 mt-1">
              Efficiency: <span className="font-medium">80%</span>, with no detected issues.
            </div>
            <div className="text-xs text-gray-500 mt-1">22 Oct 2024 · 3:42am</div>
          </div>
        </div>
      </div>
      
      {/* Panel 2 - Warning */}
      <div className="mb-4 p-3 bg-amber-50 rounded-md">
        <div className="flex">
          <AlertTriangleIcon className="text-amber-500 mr-2" size={20} />
          <div>
            <h4 className="font-medium">Panel 2 drop</h4>
            <div className="text-sm text-gray-600 mt-1">
              Efficiency: <span className="font-medium">65% → 75%</span>. Monitoring is advised.
            </div>
            <div className="text-xs text-gray-500 mt-1">22 Oct 2024 · 3:42am</div>
          </div>
        </div>
      </div>
      
      {/* Battery Status - Low */}
      <div className="mb-4 p-3 bg-red-50 rounded-md">
        <div className="flex">
          <BatteryLowIcon className="text-red-500 mr-2" size={20} />
          <div>
            <h4 className="font-medium">Battery low!</h4>
            <div className="text-sm text-gray-600 mt-1">
              Output is at <span className="font-medium">15%</span>, plug in now.
            </div>
            <div className="text-xs text-gray-500 mt-1">22 Oct 2024 · 3:42am</div>
          </div>
        </div>
      </div>
      
      {/* UV Sensor Offline */}
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="flex">
          <XCircleIcon className="text-gray-500 mr-2" size={20} />
          <div>
            <h4 className="font-medium">UV Sensor offline</h4>
            <div className="text-sm text-gray-600 mt-1">
              No data since <span className="font-medium">3:42 AM</span>.
            </div>
            <div className="text-xs text-gray-500 mt-1">22 Oct 2024 · 3:42am</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 
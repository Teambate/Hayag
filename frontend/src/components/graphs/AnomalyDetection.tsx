import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Mock data for fault and anomaly detection
const anomalyData = [
  // Panel 1 - Normal Data
  { hour: '6am', panel: 'Panel 1', metric: 20, severity: 5, normal: true },
  { hour: '8am', panel: 'Panel 1', metric: 30, severity: 5, normal: true },
  { hour: '10am', panel: 'Panel 1', metric: 50, severity: 5, normal: true },
  { hour: '12pm', panel: 'Panel 1', metric: 60, severity: 5, normal: true },
  { hour: '2pm', panel: 'Panel 1', metric: 55, severity: 5, normal: true },
  { hour: '4pm', panel: 'Panel 1', metric: 40, severity: 5, normal: true },
  { hour: '6pm', panel: 'Panel 1', metric: 20, severity: 5, normal: true },
  
  // Panel 2 - Normal Data
  { hour: '6am', panel: 'Panel 2', metric: 19, severity: 5, normal: true },
  { hour: '8am', panel: 'Panel 2', metric: 28, severity: 5, normal: true },
  { hour: '10am', panel: 'Panel 2', metric: 47, severity: 5, normal: true },
  { hour: '12pm', panel: 'Panel 2', metric: 58, severity: 5, normal: true },
  { hour: '2pm', panel: 'Panel 2', metric: 52, severity: 5, normal: true },
  { hour: '4pm', panel: 'Panel 2', metric: 38, severity: 5, normal: true },
  { hour: '6pm', panel: 'Panel 2', metric: 18, severity: 5, normal: true },
  
  // Panel 1 - Anomalies
  { hour: '10am', panel: 'Panel 1', metric: 30, severity: 40, normal: false },
  { hour: '2pm', panel: 'Panel 1', metric: 25, severity: 60, normal: false },
  
  // Panel 2 - Anomalies
  { hour: '8am', panel: 'Panel 2', metric: 15, severity: 30, normal: false },
  { hour: '4pm', panel: 'Panel 2', metric: 20, severity: 50, normal: false },
];

const hourMapping = {
  '6am': 6, '8am': 8, '10am': 10, '12pm': 12, '2pm': 14, '4pm': 16, '6pm': 18
};

const AnomalyDetection: React.FC = () => {
  return (
    <div>
      <div className="w-full aspect-[16/9]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="hour" 
              name="Time" 
              axisLine={false} 
              tickLine={false}
              type="category"
            />
            <YAxis 
              dataKey="metric" 
              name="Value" 
              axisLine={false} 
              tickLine={false}
              domain={[0, 70]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'Voltage/Current', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
            />
            <ZAxis 
              dataKey="severity"
              range={[40, 400]}
              name="Severity"
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name, props) => {
                if (name === 'severity') return [`Severity: ${value}`, 'Impact'];
                return [value, name];
              }}
            />
            
            {/* Panel 1 - Normal */}
            <Scatter 
              name="Panel 1 (Normal)" 
              data={anomalyData.filter(d => d.panel === 'Panel 1' && d.normal)} 
              fill="#4CAF50" 
            />
            
            {/* Panel 1 - Anomalies */}
            <Scatter 
              name="Panel 1 (Fault)" 
              data={anomalyData.filter(d => d.panel === 'Panel 1' && !d.normal)} 
              fill="#F44336" 
            />
            
            {/* Panel 2 - Normal */}
            <Scatter 
              name="Panel 2 (Normal)" 
              data={anomalyData.filter(d => d.panel === 'Panel 2' && d.normal)} 
              fill="#2196F3" 
            />
            
            {/* Panel 2 - Anomalies */}
            <Scatter 
              name="Panel 2 (Fault)" 
              data={anomalyData.filter(d => d.panel === 'Panel 2' && !d.normal)} 
              fill="#FF9800" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap mt-1 space-x-3 text-sm text-gray-500 justify-center pt-3 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Panel 1 Normal</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Panel 1 Fault</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Panel 2 Normal</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span>Panel 2 Fault</span>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection; 
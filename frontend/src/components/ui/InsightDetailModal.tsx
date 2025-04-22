import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { InsightType } from './InsightCard';
import { FileText, Cog, SquareActivity, Lightbulb, CheckCircle, AlertTriangle, ArrowUp, ArrowDown, AlertCircle, ChevronRight } from 'lucide-react';

// Custom icon component for BarChartNoAxes
const BarChartNoAxes = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="12" width="4" height="8" />
    <rect x="10" y="8" width="4" height="12" />
    <rect x="17" y="4" width="4" height="16" />
  </svg>
);

interface InsightDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  type: InsightType;
  date: string;
  time: string;
}

const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
  isOpen,
  onOpenChange,
  title,
  content,
  type,
  date,
  time
}) => {
  // Helper to get icon and color based on insight type and title
  const getInsightIconAndColor = () => {
    // Check title first for more accurate icon assignment
    if (title.includes('Performance') || title.includes('Daily')) {
      return { 
        icon: <BarChartNoAxes className="h-7 w-7 text-blue-500" />,
        color: 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200'
      };
    } else if (title.includes('Sensor')) {
      return { 
        icon: <Cog className="h-7 w-7 text-gray-500" />,
        color: 'bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-200'
      };
    } else if (title.includes('Panel')) {
      return { 
        icon: <SquareActivity className="h-7 w-7 text-green-500" />,
        color: 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-200'
      };
    } else if (title.includes('System') || title.includes('Insight')) {
      return { 
        icon: <Lightbulb className="h-7 w-7 text-amber-500" />,
        color: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200'
      };
    } else {
      // Fallback based on type
      return { 
        icon: <FileText className="h-7 w-7 text-blue-500" />,
        color: 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200'
      };
    }
  };

  const { icon, color } = getInsightIconAndColor();

  // Sensor type icons and colors mapping
  const getSensorTypeInfo = (sensorName: string) => {
    sensorName = sensorName.toLowerCase().trim();
    
    if (sensorName.includes('temp') || sensorName.includes('temperature')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>,
        color: 'text-red-500'
      };
    } else if (sensorName.includes('light') || sensorName.includes('lux') || sensorName.includes('irradiance')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
        color: 'text-amber-500'
      };
    } else if (sensorName.includes('humid') || sensorName.includes('moisture')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>,
        color: 'text-blue-500'
      };
    } else if (sensorName.includes('voltage') || sensorName.includes('power') || sensorName.includes('current') || sensorName.includes('electric')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
        color: 'text-purple-500'
      };
    } else if (sensorName.includes('pressure') || sensorName.includes('barometric')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2v10"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>,
        color: 'text-cyan-500'
      };
    } else if (sensorName.includes('uv') || sensorName.includes('ultraviolet')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/><path d="M3 14h7"/><path d="M10 17v.01"/><path d="M14 17v.01"/><path d="M12 20v.01"/><path d="M13.67 7.14c-1.94-1.95-5.09-1.95-7.03 0"/><path d="M17.74 11.25a9.25 9.25 0 0 0-13.07-13.1"/><path d="M22 22 2 2"/></svg>,
        color: 'text-violet-500'
      };
    } else if (sensorName.includes('solar') || sensorName.includes('panel')) {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>,
        color: 'text-green-500'
      };
    } else {
      return { 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"/><path d="m9.09 9 .5.5"/><path d="m14.41 9 .5.5"/><path d="M9 13h6"/></svg>,
        color: 'text-gray-500'
      };
    }
  };

  // Format content with better hierarchy and spacing
  const formatContent = (contentText: string) => {
    if (!contentText) return null;
    
    // Check if this is a sensor health report, performance report, or panel health report
    const isSensorReport = title.includes('Sensor');
    const isPerformanceReport = title.includes('Performance') || title.includes('Daily');
    const isPanelReport = title.includes('Panel');
    const isSystemInsight = title.includes('System') || title.includes('Insight');
    
    // Split by lines
    const lines = contentText.split('\n');
    
    // Extract panel health information if this is a panel report
    let panelSummary = null;
    if (isPanelReport) {
      // Try to find the panel count and status line
      const panelStatusLine = lines.find(line => 
        line.includes('panels monitored') && 
        (line.includes('good') || line.includes('warning') || line.includes('critical'))
      );
      
      // Try to find average temperature line
      const avgTempLine = lines.find(line => 
        line.includes('Average panel temperature')
      );
      
      // Try to find highest temperature line
      const highTempLine = lines.find(line => 
        line.includes('Highest temperature')
      );
      
      // Try to find best/lowest panel efficiency lines
      const bestEfficiencyLine = lines.find(line => 
        line.includes('Best panel efficiency')
      );
      
      const lowestEfficiencyLine = lines.find(line => 
        line.includes('Lowest panel efficiency')
      );
      
      // Extract values
      let goodCount = 0;
      let warningCount = 0;
      let criticalCount = 0;
      let avgTemp = "";
      let highTemp = "";
      let highTempPanel = "";
      let bestEfficiency = "";
      let bestEfficiencyPanel = "";
      let lowestEfficiency = "";
      let lowestEfficiencyPanel = "";
      
      if (panelStatusLine) {
        const goodMatch = panelStatusLine.match(/(\d+)\s+good/i);
        const warningMatch = panelStatusLine.match(/(\d+)\s+warning/i);
        const criticalMatch = panelStatusLine.match(/(\d+)\s+critical/i);
        
        goodCount = goodMatch ? parseInt(goodMatch[1]) : 0;
        warningCount = warningMatch ? parseInt(warningMatch[1]) : 0;
        criticalCount = criticalMatch ? parseInt(criticalMatch[1]) : 0;
      }
      
      if (avgTempLine) {
        const match = avgTempLine.match(/(\d+(\.\d+)?)\s*°C/);
        if (match) avgTemp = match[1];
      }
      
      if (highTempLine) {
        const match = highTempLine.match(/(\d+(\.\d+)?)\s*°C\s*\(Panel\s+([^)]+)\)/);
        if (match) {
          highTemp = match[1];
          highTempPanel = match[3];
        }
      }
      
      if (bestEfficiencyLine) {
        const match = bestEfficiencyLine.match(/(\d+(\.\d+)?)\s*%\s*\(Panel\s+([^)]+)\)/);
        if (match) {
          bestEfficiency = match[1];
          bestEfficiencyPanel = match[3];
        }
      }
      
      if (lowestEfficiencyLine) {
        const match = lowestEfficiencyLine.match(/(\d+(\.\d+)?)\s*%\s*\(Panel\s+([^)]+)\)/);
        if (match) {
          lowestEfficiency = match[1];
          lowestEfficiencyPanel = match[3];
        }
      }
      
      // Generate panel health visualization
      panelSummary = (
        <div className="space-y-5">
          {/* Section 2: Critical Issues Alert Box */}
          {(criticalCount > 0 || parseFloat(highTemp) > 45 || parseFloat(lowestEfficiency) < 5) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500 w-5 h-5" />
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Critical Panel Issues Detected
                </h2>
              </div>
              
              <ul className="list-disc ml-6 space-y-3 text-sm text-gray-800">
                {parseFloat(highTemp) > 45 && (
                  <li className="leading-relaxed">
                    <span className="font-semibold">Dangerous overheating on {highTempPanel}</span><br />
                    Temperature of <span className="font-semibold text-red-700">{highTemp}°C</span> exceeds safe limit (<span className="text-gray-600">45°C</span>). Immediate inspection required.
                  </li>
                )}
                
                {parseFloat(lowestEfficiency) < 5 && (
                  <li className="leading-relaxed">
                    <span className="font-semibold">Critical efficiency loss on {lowestEfficiencyPanel}</span><br />
                    Efficiency of <span className="font-semibold text-red-700">{lowestEfficiency}%</span> indicates potential panel failure. Check for damage or connection issues.
                  </li>
                )}
                
                {(parseFloat(bestEfficiency) - parseFloat(lowestEfficiency)) > 10 && (
                  <li className="leading-relaxed">
                    <span className="font-semibold">Significant efficiency variance</span><br />
                    Difference of <span className="font-semibold text-red-700">{(parseFloat(bestEfficiency) - parseFloat(lowestEfficiency)).toFixed(1)}%</span> between panels suggests potential shading or degradation issues.
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {/* Section 3: Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Temperature Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Temperature</h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
                </svg>
              </div>
              
              <div className="space-y-3">
                {/* Average temp */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Average</span>
                  <span className={`text-sm font-medium ${
                    parseFloat(avgTemp) >= 45 ? 'text-red-600' : 
                    parseFloat(avgTemp) >= 35 ? 'text-amber-600' : 
                    'text-gray-700'
                  }`}>{avgTemp}°C</span>
                </div>
                
                {/* Highest temp */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">Maximum</span>
                    {highTempPanel && (
                      <span className="ml-1 text-xs text-gray-400">
                        (<span className="font-medium">{highTempPanel}</span>)
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    parseFloat(highTemp) >= 45 ? 'text-red-600' : 
                    parseFloat(highTemp) >= 35 ? 'text-amber-600' : 
                    'text-gray-700'
                  }`}>{highTemp}°C</span>
                </div>
                
                {/* Temperature scale */}
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
                    <span>0°C</span>
                    <span>30°C</span>
                    <span>60°C</span>
                  </div>
                  <div className="w-full h-2 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full relative">
                    {avgTemp && (
                      <div className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-700 rounded-full -mt-1 -ml-2" 
                        style={{ 
                          left: `${Math.min(Math.max(parseFloat(avgTemp) / 60, 0), 1) * 100}%`,
                        }}
                      />
                    )}
                    {highTemp && (
                      <div className="absolute top-0 w-3 h-3 bg-red-500 border border-white rounded-full -mt-0.5 -ml-1.5" 
                        style={{ 
                          left: `${Math.min(Math.max(parseFloat(highTemp) / 60, 0), 1) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Efficiency Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Efficiency</h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              
              <div className="space-y-3">
                {/* Best efficiency */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">Best</span>
                    {bestEfficiencyPanel && (
                      <span className="ml-1 text-xs text-gray-400">
                        (<span className="font-medium">{bestEfficiencyPanel}</span>)
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-green-600">{bestEfficiency}%</span>
                </div>
                
                {/* Lowest efficiency */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">Lowest</span>
                    {lowestEfficiencyPanel && (
                      <span className="ml-1 text-xs text-gray-400">
                        (<span className="font-medium">{lowestEfficiencyPanel}</span>)
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    parseFloat(lowestEfficiency) < 5 ? 'text-red-600' : 
                    parseFloat(lowestEfficiency) < 10 ? 'text-amber-600' : 
                    'text-gray-700'
                  }`}>{lowestEfficiency}%</span>
                </div>
                
                {/* Efficiency visualization */}
                <div className="mt-3 pt-2 border-t border-gray-100">
                  {/* Panel count indicator */}
                  <div className="flex justify-between items-center text-xs mt-0">
                    <div className="text-gray-600">
                      Panels: <span className="font-medium">{goodCount + warningCount + criticalCount}</span>
                    </div>
                    {criticalCount > 0 && (
                      <div className="bg-red-50 px-2 py-1 rounded-full border border-red-100 text-red-600 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>{criticalCount} critical</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats summary - simplified stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Total Panels</div>
              <div className="text-lg font-semibold text-gray-800">{goodCount + warningCount + criticalCount}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Temperature Δ</div>
              <div className="text-lg font-semibold text-gray-800">
                {(parseFloat(highTemp) - parseFloat(avgTemp)).toFixed(1)}°C
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Efficiency Δ</div>
              <div className="text-lg font-semibold text-gray-800">
                {(parseFloat(bestEfficiency) - parseFloat(lowestEfficiency)).toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className={`text-base font-semibold ${
                criticalCount > 0 ? 'text-red-600' : 
                warningCount > 0 ? 'text-amber-600' : 
                'text-green-600'
              }`}>
                {criticalCount > 0 ? 'Critical' : warningCount > 0 ? 'Warning' : 'Good'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Extract performance metrics if this is a performance report
    let performanceSummary = null;
    if (isPerformanceReport) {
      // Try to find energy generation line
      const energyGenLine = lines.find(line => 
        line.includes('Generated') && line.includes('kWh')
      );
      
      // Try to find efficiency line
      const efficiencyLine = lines.find(line => 
        line.includes('efficiency') || line.includes('Efficiency')
      );
      
      // Try to find comparison with previous day
      const comparisonLine = lines.find(line => 
        (line.includes('increase') || line.includes('decrease')) && 
        line.includes('compared')
      );
      
      // Try to find peak generation time
      const peakGenLine = lines.find(line => 
        line.includes('Peak generation')
      );
      
      // Extract values
      let energyValue = "";
      let efficiencyValue = "";
      let comparisonValue = "";
      let peakValue = "";
      let comparisonTrend: 'up' | 'down' | 'neutral' = 'neutral';
      
      if (energyGenLine) {
        const match = energyGenLine.match(/(\d+\.\d+)\s*kWh/);
        if (match) energyValue = match[1];
      }
      
      if (efficiencyLine) {
        const match = efficiencyLine.match(/(\d+\.\d+)%/);
        if (match) efficiencyValue = match[1];
      }
      
      if (comparisonLine) {
        const increaseMatch = comparisonLine.match(/(\d+\.\d+)%\s*increase/);
        const decreaseMatch = comparisonLine.match(/(\d+\.\d+)%\s*decrease/);
        
        if (increaseMatch) {
          comparisonValue = increaseMatch[1];
          comparisonTrend = 'up';
        } else if (decreaseMatch) {
          comparisonValue = decreaseMatch[1];
          comparisonTrend = 'down';
        }
      }
      
      if (peakGenLine) {
        const match = peakGenLine.match(/(\d+\.\d+)\s*kWh\s*at\s*(\d+:\d+)/);
        if (match) peakValue = `${match[1]} kWh at ${match[2]}`;
      }
      
      // Generate performance summary visualization
      performanceSummary = (
        <div className="mb-6">
          {/* Energy generation card */}
          <div className="bg-gradient-to-br rounded-xl border border-blue-100 p-5 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Energy Generated</h3>
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-bold text-blue-600">{energyValue}</span>
                  <span className="text-lg text-blue-500 ml-1">kWh</span>
                </div>
              </div>
              <div className="p-2 bg-white rounded-full shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            </div>
            
            {comparisonValue && (
              <div className={`mt-3 flex items-center text-sm ${
                comparisonTrend === 'up' ? 'text-green-600' : 
                comparisonTrend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {comparisonTrend === 'up' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                ) : comparisonTrend === 'down' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                ) : null}
                <span className="font-medium">{comparisonValue}%</span>
                <span className="ml-1">compared to yesterday</span>
              </div>
            )}
          </div>
          
          {/* Key metrics cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Efficiency card */}
            {efficiencyValue && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">System Efficiency</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gray-800">{efficiencyValue}%</span>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${Math.min(parseFloat(efficiencyValue), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Peak Generation card */}
            {peakValue && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-gray-500">Peak Generation</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2"/>
                    <path d="M12 20v2"/>
                    <path d="m4.93 4.93 1.41 1.41"/>
                    <path d="m17.66 17.66 1.41 1.41"/>
                    <path d="M2 12h2"/>
                    <path d="M20 12h2"/>
                    <path d="m6.34 17.66-1.41 1.41"/>
                    <path d="m19.07 4.93-1.41 1.41"/>
                  </svg>
                </div>
                <div className="mt-2">
                  <span className="text-lg font-bold text-gray-800">{peakValue}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Extract sensor information for sensor reports
    let sensorSummary = null;
    if (isSensorReport) {
      // Try to find sensor summary line (usually contains count of sensors)
      const summaryLine = lines.find(line => 
        line.includes('sensors monitored') || 
        line.includes('sensor') && (line.includes('good') || line.includes('warning') || line.includes('critical'))
      );
      
      // Extract sensor status counts if summary line exists
      if (summaryLine) {
        const goodMatch = summaryLine.match(/(\d+)\s+good/i);
        const warningMatch = summaryLine.match(/(\d+)\s+warning/i);
        const criticalMatch = summaryLine.match(/(\d+)\s+critical/i);
        
        const goodCount = goodMatch ? parseInt(goodMatch[1]) : 0;
        const warningCount = warningMatch ? parseInt(warningMatch[1]) : 0;
        const criticalCount = criticalMatch ? parseInt(criticalMatch[1]) : 0;
        
        // Find sensor details lines
        const warningSensorsLine = lines.find(line => line.toLowerCase().includes('warning sensors:'));
        const criticalSensorsLine = lines.find(line => line.toLowerCase().includes('critical sensors:'));
        const goodSensorsLine = lines.find(line => line.toLowerCase().includes('good sensors:'));
        
        // Extract sensor names
        const warningSensors = warningSensorsLine ? warningSensorsLine.split(':')[1]?.trim() : '';
        const criticalSensors = criticalSensorsLine ? criticalSensorsLine.split(':')[1]?.trim() : '';
        const goodSensors = goodSensorsLine ? goodSensorsLine.split(':')[1]?.trim() : '';
        
        // Generate sensor summary visualization
        sensorSummary = (
          <div className="mb-6 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">Sensor Status Overview</h4>
              <span className="text-xs text-gray-500">Total: {goodCount + warningCount + criticalCount}</span>
            </div>
            
            {/* Status counts */}
            <div className="flex space-x-2 mb-4">
              {goodCount > 0 && (
                <div className="flex-1 bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                  <div className="text-xl font-bold text-green-600">{goodCount}</div>
                  <div className="text-xs text-green-700">Good</div>
                </div>
              )}
              
              {warningCount > 0 && (
                <div className="flex-1 bg-amber-50 p-3 rounded-lg border border-amber-100 text-center">
                  <div className="text-xl font-bold text-amber-600">{warningCount}</div>
                  <div className="text-xs text-amber-700">Warning</div>
                </div>
              )}
              
              {criticalCount > 0 && (
                <div className="flex-1 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                  <div className="text-xl font-bold text-red-600">{criticalCount}</div>
                  <div className="text-xs text-red-700">Critical</div>
                </div>
              )}
            </div>
            
            {/* Affected sensors - simplified to focus just on warning sensors */}
            {(warningSensors || criticalSensors) && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Warning Sensors:</h5>
                <div className="flex flex-wrap gap-2">
                  {warningSensors.split(',').map((sensor, i) => {
                    const sensorName = sensor.trim();
                    if (!sensorName) return null;
                    const { icon, color } = getSensorTypeInfo(sensorName);
                    return (
                      <span key={`warning-${i}`} className="px-2 py-1 bg-amber-50 rounded-md text-xs border border-amber-200 shadow-sm flex items-center text-amber-700">
                        {icon}
                        {sensorName}
                      </span>
                    );
                  })}
                  
                  {criticalSensors.split(',').map((sensor, i) => {
                    const sensorName = sensor.trim();
                    if (!sensorName) return null;
                    const { icon, color } = getSensorTypeInfo(sensorName);
                    return (
                      <span key={`critical-${i}`} className="px-2 py-1 bg-red-50 rounded-md text-xs border border-red-200 shadow-sm flex items-center text-red-700">
                        {icon}
                        {sensorName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    
    // Special formatting for System Insights
    if (isSystemInsight) {
      // Group lines by sections
      const sections: {[key: string]: string[]} = {
        'Warning insights': [],
        'Performance insights': [],
        'General insights': []
      };
      
      // Current section being processed
      let currentSection = 'General insights';
      
      // Process lines to categorize by section
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        // Check if line is a section header
        if (trimmedLine.toLowerCase().includes('warning') && trimmedLine.endsWith(':')) {
          currentSection = 'Warning insights';
          return;
        } else if (trimmedLine.toLowerCase().includes('performance') && trimmedLine.endsWith(':')) {
          currentSection = 'Performance insights';
          return;
        }
        
        // Add line to current section
        sections[currentSection].push(trimmedLine);
      });
      
      return (
        <div className="space-y-6">
          {/* Render Warning Insights Section */}
          {sections['Warning insights'].length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">
                Warning insights
              </h3>
              <div className="space-y-2">
                {sections['Warning insights'].map((line, idx) => {
                  // Remove bullet point if present and trim the content
                  const content = line.startsWith('•') ? line.substring(1).trim() : line;
                  return (
                    <div key={`warning-${idx}`} className="pl-4 relative py-1">
                      <span className="absolute left-0 top-1.5">•</span>
                      <span className="text-sm text-gray-800">{content}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Render Performance Insights Section */}
          {sections['Performance insights'].length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">
                Performance insights
              </h3>
              <div className="space-y-2">
                {sections['Performance insights'].map((line, idx) => {
                  // Remove bullet point if present and trim the content
                  const content = line.startsWith('•') ? line.substring(1).trim() : line;
                  return (
                    <div key={`perf-${idx}`} className="pl-4 relative py-1">
                      <span className="absolute left-0 top-1.5">•</span>
                      <span className="text-sm text-gray-800">{content}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Render General Insights Section */}
          {sections['General insights'].length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">
                General insights
              </h3>
              <div className="space-y-2">
                {sections['General insights'].map((line, idx) => {
                  // Remove bullet point if present and trim the content
                  const content = line.startsWith('•') ? line.substring(1).trim() : line;
                  return (
                    <div key={`general-${idx}`} className="pl-4 relative py-1">
                      <span className="absolute left-0 top-1.5">•</span>
                      <span className="text-sm text-gray-800">{content}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Process lines for better display for non-System insights (keep original logic)
    return (
      <div className="space-y-5">
        {/* Show sensor summary if available */}
        {isSensorReport && sensorSummary}
        
        {/* Show performance summary if available */}
        {isPerformanceReport && performanceSummary}
        
        {/* Show panel summary if available */}
        {isPanelReport && panelSummary}
        
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          // Skip empty lines
          if (!trimmedLine) return null;
          
          // Skip lines we've already processed in the specialized summaries
          if ((isSensorReport && 
              (trimmedLine.includes('sensors monitored') || 
               trimmedLine.toLowerCase().includes('warning sensors:') || 
               trimmedLine.toLowerCase().includes('critical sensors:'))) ||
              (isPerformanceReport && 
              (trimmedLine.includes('Generated') || 
               trimmedLine.includes('efficiency') || 
               trimmedLine.includes('Efficiency') ||
               trimmedLine.includes('Peak generation') ||
               (trimmedLine.includes('compared') && 
                (trimmedLine.includes('increase') || trimmedLine.includes('decrease'))))) ||
              (isPanelReport && 
              (trimmedLine.includes('panels monitored') || 
               trimmedLine.includes('Average panel temperature') ||
               trimmedLine.includes('Highest temperature') ||
               trimmedLine.includes('Best panel efficiency') ||
               trimmedLine.includes('Lowest panel efficiency')))) {
            return null;
          }
          
          // Check if line is a header (ends with colon)
          if (trimmedLine.endsWith(':') && !trimmedLine.toLowerCase().includes('warning sensors') && !trimmedLine.toLowerCase().includes('critical sensors')) {
            return (
              <div key={index} className="pt-2">
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-2">
                  {trimmedLine}
                </h3>
              </div>
            );
          }
          
          // Check if line is a bullet point
          if (trimmedLine.startsWith('•')) {
            const bulletContent = trimmedLine.substring(1).trim();
            
            // Check if it's a warning or error bullet
            let bulletIcon = <span className="text-amber-500 mr-2">•</span>;
            let bulletClass = "text-gray-700";
            
            if (bulletContent.toLowerCase().includes('warning') || 
                bulletContent.toLowerCase().includes('low') ||
                bulletContent.includes('degrad')) {
              bulletIcon = <AlertTriangle size={16} className="text-amber-500 mr-2 flex-shrink-0" />;
              bulletClass = "text-amber-700";
            } else if (bulletContent.toLowerCase().includes('critical') || 
                      bulletContent.toLowerCase().includes('error') ||
                      bulletContent.includes('issue')) {
              bulletIcon = <AlertTriangle size={16} className="text-red-500 mr-2 flex-shrink-0" />;
              bulletClass = "text-red-700";
            } else if (bulletContent.toLowerCase().includes('good') ||
                      bulletContent.toLowerCase().includes('optimal') ||
                      bulletContent.includes('best')) {
              bulletIcon = <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />;
              bulletClass = "text-green-700";
            }
            
            return (
              <div key={index} className="ml-2 flex items-start p-2 rounded hover:bg-gray-50">
                {bulletIcon}
                <span className={bulletClass}>{bulletContent}</span>
              </div>
            );
          }
          
          // Check if it's a statistic with increase/decrease (contains number with % or unit)
          if (/\d+(\.\d+)?(%|kWh|°C)/.test(trimmedLine)) {
            const isIncrease = trimmedLine.toLowerCase().includes('increase');
            const isDecrease = trimmedLine.toLowerCase().includes('decrease');
            
            let trendIcon = null;
            let trendClass = "";
            
            if (isIncrease) {
              trendIcon = <ArrowUp size={16} className="text-green-500 ml-2" />;
              trendClass = "text-green-600";
            } else if (isDecrease) {
              trendIcon = <ArrowDown size={16} className="text-red-500 ml-2" />;
              trendClass = "text-red-600";
            }
            
            // Extract the numerical value
            const matches = trimmedLine.match(/\d+(\.\d+)?(%|kWh|°C)/g);
            if (matches && matches.length > 0) {
              const value = matches[0];
              let formattedLine = trimmedLine;
              
              // Replace the value with a stylized version
              formattedLine = formattedLine.replace(
                value, 
                `<span class="font-semibold ${trendClass}">${value}</span>`
              );
              
              return (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded">
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: formattedLine }} />
                  {trendIcon}
                </div>
              );
            }
          }
          
          // If line contains a colon, treat it as a label-value pair
          if (trimmedLine.includes(':') && !trimmedLine.endsWith(':')) {
            const parts = trimmedLine.split(':');
            if (parts.length === 2) {
              const label = parts[0].trim();
              const value = parts[1].trim();
              
              return (
                <div key={index} className="flex justify-between items-center py-2 px-3 border-b border-gray-100 hover:bg-gray-50 rounded group">
                  <span className="text-gray-600 group-hover:text-gray-800">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              );
            }
          }
          
          // Regular line
          return (
            <p key={index} className="text-gray-700 py-1 px-2">
              {trimmedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] p-0 overflow-hidden min-h-[200px] rounded-xl">
        {/* Special Header Layout for System Insights */}
        {title.includes('System') || title.includes('Insight') ? (
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200 p-6 pt-9 rounded-t-lg">
            <DialogHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                  </div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {title}
                  </DialogTitle>
                </div>
                <span className="text-sm font-medium text-gray-500 mt-1">
                  {date} · {time}
                </span>
              </div>
            </DialogHeader>
          </div>
        ) : (
          <div className={`p-6 pt-9 ${color}`}>
            <DialogHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    {icon}
                  </div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {title}
                  </DialogTitle>
                </div>
                <span className="text-sm font-medium text-gray-500 mt-1">
                  {date} · {time}
                </span>
              </div>
            </DialogHeader>
          </div>
        )}
        
        {/* Content area with structured sections */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-5">
          {formatContent(content)}
        </div>

        <DialogFooter className="p-4 bg-gray-50 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto hover:bg-[#FFF9EF] hover:border-[#F0C87A]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InsightDetailModal; 
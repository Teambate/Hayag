import { useState, useEffect } from "react";
import { TrendingUp, ArrowUp, SunIcon, GaugeIcon, CircleOff, Battery, AlertTriangle, FileText, CircleCheck, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";

// Import graph components
import PanelPerformance from "../components/graphs/PanelPerformance";
import EfficiencyEnvironment from "../components/graphs/EfficiencyEnvironment";
import LuxIrradianceGraph from "../components/graphs/LuxIrradianceGraph";
import PeakSolarHours from "../components/graphs/PeakSolarHours";
import BatteryChargeDischarge from "../components/graphs/BatteryChargeDischarge";
import PanelTemperatureOverheating from "../components/graphs/PanelTemperatureOverheating";
import IrradianceGraph from "../components/graphs/IrradianceGraph";
import Banner from "../components/layout/Banner";
import { TimePeriod } from "../components/graphs/EnergyProduction";
import { useDevice } from "../context/DeviceContext";
import { InsightItem, formatReportData } from "../utils/insightUtils";
import InsightDetailModal from "../components/ui/InsightDetailModal";
import api from "../utils/api";

// Analytics data interface
interface AnalyticsData {
  timeInterval: string;
  startDate: string;
  endDate: string;
  summaryValues: {
    efficiency: {
      value: number;
      unit: string;
    };
    totalYield: {
      value: number;
      predicted: number;
      trend: number;
      remark: string;
      unit: string;
    };
    peakSolarHours: {
      start: string;
      end: string;
      bestTime: string;
    };
  };
  data: {
    panelPerformance: any[];
    batteryCharge: any[];
    panelTemperature: any[];
    irradiance: any[];
    peakSolarHours: any[];
    efficiencyEnvironment: any[];
    irradiancePower?: any[];
    luxIrradiance?: any[];
  };
}

// Expand icon component
const ExpandIcon = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className}
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    strokeWidth="2" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" x2="14" y1="3" y2="10" />
    <line x1="3" x2="10" y1="21" y2="14" />
  </svg>
);

// Add this new tooltip component after ExpandIcon component
const Tooltip = ({ content, children }: { content: React.ReactNode, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-10 w-64 p-2 text-sm text-white bg-gray-800 rounded-md shadow-lg -left-24 top-full mt-2">
          {content}
          <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 -top-1 left-24"></div>
        </div>
      )}
    </div>
  );
};

// Props for accessing the setActiveTab function
interface AnalyticsProps {
  setActiveTab?: (tab: string) => void;
}

export default function Analytics({ setActiveTab }: AnalyticsProps) {
  const { deviceId } = useDevice();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // State for insights data
  const [insightReports, setInsightReports] = useState<any[]>([]);
  const [insightLoading, setInsightLoading] = useState<boolean>(true);
  const [insightError, setInsightError] = useState<string | null>(null);
  
  // State for insight detail modal
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // State for selections from Banner
  const [selectedPanel, setSelectedPanel] = useState<string>("All Panels");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("24h");
  
  // Remove default initialization and keep unset until Banner provides it
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

  // Update navbar active tab when component mounts
  useEffect(() => {
    if (setActiveTab) {
      setActiveTab("Analytics");
    }
  }, [setActiveTab]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!deviceId || !selectedDateRange) return;

      setIsLoading(true);
      setError(null);

      try {
        // Prepare query parameters
        const params = new URLSearchParams();
        params.append('deviceId', deviceId);
        
        // Add panel filter if specific panel is selected
        if (selectedPanel !== 'All Panels') {
          // Don't add "Panel_" prefix - use the panel ID as-is
          params.append('panelIds', selectedPanel);
        }
        
        // Add date range
        if (selectedDateRange.from) {
          params.append('startDateTime', selectedDateRange.from.toISOString());
        }
        if (selectedDateRange.to) {
          params.append('endDateTime', selectedDateRange.to.toISOString());
        }
        
        // Add timezone information
        params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

        const response = await fetch(`/api/readings/analytics?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAnalyticsData(data);
        } else {
          throw new Error(data.message || 'Failed to fetch analytics data');
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching analytics data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [deviceId, selectedPanel, selectedDateRange, selectedTimePeriod]);

  // Fetch insight reports when time range changes
  useEffect(() => {
    const fetchInsightReports = async () => {
      if (!deviceId || !selectedDateRange) return;

      setInsightLoading(true);
      setInsightError(null);

      try {
        // Prepare query parameters for insights API
        const params = new URLSearchParams();
        params.append('deviceId', deviceId);
        
        // Add date range parameters if available
        if (selectedDateRange.from) {
          params.append('startDate', selectedDateRange.from.toISOString());
        }
        if (selectedDateRange.to) {
          params.append('endDate', selectedDateRange.to.toISOString());
        }

        const response = await api.get(`/insights/reports?${params.toString()}`);
        
        if (response.data && response.data.success) {
          setInsightReports(response.data.reports || []);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch insight reports');
        }
      } catch (err) {
        setInsightError((err as Error).message);
        console.error('Error fetching insight reports:', err);
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsightReports();
  }, [deviceId, selectedDateRange]);

  // Handle panel selection change
  const handlePanelChange = (panel: string) => {
    setSelectedPanel(panel);
  };

  // Handle time period change
  const handleTimePeriodChange = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
  };

  // Handle date range change with time adjustment
  const handleDateRangeChange = (range: DateRange) => {
    if (!range.from || !range.to) {
      setSelectedDateRange(range);
      return;
    }
    
    // Set start date to beginning of day in local timezone (00:00:00)
    const startDate = new Date(range.from);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of day in local timezone (23:59:59)
    const endDate = new Date(range.to);
    endDate.setHours(23, 59, 59, 999);
    
    setSelectedDateRange({ from: startDate, to: endDate });
  };

  // Handle viewing an insight's details
  const handleViewInsightDetails = (insight: InsightItem, date: string, time: string) => {
    setSelectedInsight(insight);
    setSelectedDate(date);
    setSelectedTime(time);
    setIsDetailModalOpen(true);
  };

  // Format a date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Format a time string
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return "";
    }
  };

  // Helper to get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'normal':
      case 'info':
      case 'note':
        return <CircleCheck className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <Battery className="h-5 w-5 text-red-500" />;
      case 'offline':
        return <CircleOff className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  // Helper to get background color based on insight type
  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'normal':
      case 'info':
      case 'note':
        return 'bg-green-50 border-green-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'critical':
        return 'bg-red-50 border-red-100';
      case 'offline':
        return 'bg-gray-50 border-gray-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  // Loading state - now also check if selectedDateRange is undefined
  if ((isLoading && !analyticsData) || !selectedDateRange) {
    return (
      <>
        <Banner 
          activeTab="Analytics"
          onPanelChange={handlePanelChange}
          onTimePeriodChange={handleTimePeriodChange}
          onDateRangeChange={handleDateRangeChange}
          selectedTimePeriod={selectedTimePeriod}
          selectedPanel={selectedPanel}
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading analytics data...</div>
        </div>
      </>
    );
  }

  // Error state
  if (error && !analyticsData) {
    return (
      <>
        <Banner 
          activeTab="Analytics"
          onPanelChange={handlePanelChange}
          onTimePeriodChange={handleTimePeriodChange}
          onDateRangeChange={handleDateRangeChange}
          selectedTimePeriod={selectedTimePeriod}
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </>
    );
  }

  // Process insight reports to display them
  const processedInsights: {
    insight: InsightItem;
    displayDate: string;
    displayTime: string;
    type: string;
  }[] = [];

  // Add formatted insights to the array
  insightReports.forEach(report => {
    const formattedReport = formatReportData(report);
    const displayDate = formatDate(report.date);
    const displayTime = formatTime(report.date);
    
    // Add most important insights first
    if (formattedReport.panelHealthInsight && formattedReport.panelHealthInsight.type === 'critical') {
      processedInsights.push({
        insight: formattedReport.panelHealthInsight,
        displayDate,
        displayTime,
        type: formattedReport.panelHealthInsight.type
      });
    }
    
    if (formattedReport.sensorHealthInsight && formattedReport.sensorHealthInsight.type === 'critical') {
      processedInsights.push({
        insight: formattedReport.sensorHealthInsight,
        displayDate,
        displayTime,
        type: formattedReport.sensorHealthInsight.type
      });
    }
    
    // Add system insights
    formattedReport.systemInsights.forEach(insight => {
      processedInsights.push({
        insight,
        displayDate,
        displayTime,
        type: insight.type
      });
    });
    
    // Add remaining health insights
    if (formattedReport.panelHealthInsight.type !== 'critical') {
      processedInsights.push({
        insight: formattedReport.panelHealthInsight,
        displayDate,
        displayTime,
        type: formattedReport.panelHealthInsight.type
      });
    }
    
    if (formattedReport.sensorHealthInsight.type !== 'critical') {
      processedInsights.push({
        insight: formattedReport.sensorHealthInsight,
        displayDate,
        displayTime,
        type: formattedReport.sensorHealthInsight.type
      });
    }
    
    // Add daily performance insight
    processedInsights.push({
      insight: formattedReport.infoInsight,
      displayDate,
      displayTime,
      type: formattedReport.infoInsight.type
    });
  });

  // Sort insights by date (newest first)
  const displayInsights = processedInsights.sort((a, b) => {
    // Sort by date (newest first)
    return new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime();
  });

  return (
    <>
      <Banner 
        activeTab="Analytics"
        onPanelChange={handlePanelChange}
        onTimePeriodChange={handleTimePeriodChange}
        onDateRangeChange={handleDateRangeChange}
        selectedTimePeriod={selectedTimePeriod}
      />
      <div>
        {/* Row 1: First section (3-panels) and Insights & Notes sidebar */}
        <section className="border-b border-gray-200">
          <div className="grid grid-cols-12 gap-0">
            {/* Left Column (Overview Section and Panel Performance Comparison) */}
            <div className="col-span-12 lg:col-span-8 border-r border-gray-200">
              {/* Overview Section */}
              <div className="grid grid-cols-12 gap-0 border-b border-gray-200">
                
                {/* Efficiency */}
                <div className="col-span-4 border-r border-gray-200">
                  <div className="flex items-start space-x-3 p-4 py-5">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <GaugeIcon size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-500 text-xs mb-1">Efficiency</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl sm:text-3xl font-bold">
                          {analyticsData?.summaryValues.efficiency.value || 0}
                        </span>
                        <span className="text-base sm:text-lg ml-0.5">%</span>
                        <div className="ml-2 text-xs text-green-500 flex items-center">
                          <ArrowUp size={12} className="mr-0.5" />
                          <span className="hidden md:inline">
                            Optimized
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Peak Solar Hours */}
                <div className="col-span-4 border-r border-gray-200">
                  <div className="flex items-start space-x-3 p-4 py-5">
                    <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                      <SunIcon size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-500 text-xs mb-1">Peak Solar Hours</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl sm:text-3xl font-bold">
                          {analyticsData?.summaryValues.peakSolarHours.start || 'N/A'}
                        </span>
                        <span className="text-base sm:text-lg mx-1">-</span>
                        <span className="text-2xl sm:text-3xl font-bold">
                          {analyticsData?.summaryValues.peakSolarHours.end || 'N/A'}
                        </span>
                        <div className="ml-2 text-xs text-green-500 flex items-center">
                          <ArrowUp size={12} className="mr-0.5" />
                          <span className="hidden md:inline">Best Solar Time</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Total Yield */}
                <div className="col-span-4">
                  <div className="flex items-start space-x-3 p-4 py-5">
                    <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                      <TrendingUp size={18} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-500 text-xs mb-1">Total Yield</div>
                      <div className="flex items-baseline">
                        <Tooltip 
                          content={
                            (() => {
                              // Safely get values for the tooltip
                              const actualValue = analyticsData?.summaryValues.totalYield?.value ?? 0;
                              const predictedValue = analyticsData?.summaryValues.totalYield?.predicted ?? 0;
                              const trendValue = analyticsData?.summaryValues.totalYield?.trend ?? 0;
                              const unit = analyticsData?.summaryValues.totalYield?.unit || 'kWh';
                              
                              return (
                                <div>
                                  <div className="font-medium mb-1">Total Energy Yield</div>
                                  <div className="flex justify-between mb-1">
                                    <span>Actual:</span>
                                    <span>{actualValue.toFixed(2)} {unit}</span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span>Predicted:</span>
                                    <span>{predictedValue.toFixed(2)} {unit}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Trend:</span>
                                    <span>
                                      {trendValue > 0 ? '+' : ''}{trendValue.toFixed(2)} {unit} 
                                      {predictedValue > 0 ? ` (${(trendValue / predictedValue * 100).toFixed(1)}%)` : ''}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()
                          }
                        >
                          <span className="text-2xl sm:text-3xl font-bold">
                            {analyticsData?.summaryValues.totalYield?.value.toFixed(2) || '0.00'}
                          </span>
                        </Tooltip>
                        <span className="text-sm sm:text-base ml-1 text-gray-500">
                          {analyticsData?.summaryValues.totalYield?.unit || 'kWh'}
                        </span>
                        {/* Use a safe trend value derived from optional chaining */}
                        {(() => {
                          // Calculate trend safely to fix TypeScript errors
                          const trendValue = analyticsData?.summaryValues.totalYield?.trend ?? 0;
                          const predictedValue = analyticsData?.summaryValues.totalYield?.predicted ?? 0;
                          const percentageDiff = predictedValue > 0 ? (trendValue / predictedValue * 100).toFixed(1) : '0';
                          const trendColor = trendValue > 0 
                            ? 'rgb(34, 197, 94)' // green-500
                            : trendValue < 0 
                              ? 'rgb(239, 68, 68)' // red-500
                              : 'rgb(107, 114, 128)'; // gray-500
                          
                          // Create enhanced remark with percentage
                          let enhancedRemark = analyticsData?.summaryValues.totalYield?.remark || '';
                          if (predictedValue > 0 && trendValue !== 0) {
                            if (enhancedRemark) {
                              enhancedRemark = `${Math.abs(Number(percentageDiff))}% ${enhancedRemark}`;
                            }
                          }
                          
                          return (
                            <div className="ml-2 text-xs flex items-center" style={{ color: trendColor }}>
                              {trendValue > 0 ? (
                                <ArrowUp size={12} className="mr-0.5" />
                              ) : trendValue < 0 ? (
                                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              ) : null}
                              <span className="hidden md:inline">
                                {enhancedRemark}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Panel Performance Comparison Graph */}
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Panel Performance Comparison</h3>
                <p className="text-sm text-gray-500 mb-4">Comparing power output between panels and identifying anomalies</p>
                <div className="h-72 sm:h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <PanelPerformance 
                      chartData={analyticsData?.data.panelPerformance || []}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column: Insights & Notes Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Insights & Notes</h3>
                  <div className="flex items-center gap-2">
                    <Link 
                      to="/insights" 
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center"
                    >
                      <ExpandIcon className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
                
                {insightLoading && (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw size={24} className="text-gray-400 animate-spin" />
                  </div>
                )}
                
                {insightError && (
                  <div className="p-4 rounded-lg border border-red-100 bg-red-50 text-red-700 text-sm">
                    Error loading insights: {insightError}
                  </div>
                )}
                
                {!insightLoading && !insightError && displayInsights.length === 0 && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">
                    No insights available for the selected time period.
                  </div>
                )}
                
                {!insightLoading && !insightError && (
                  <div className="h-80 overflow-y-auto pr-1 space-y-3">
                    {displayInsights.map((item, index) => (
                      <div
                        key={index} 
                        className={`p-4 rounded-lg border ${getInsightBgColor(item.type)} flex items-start gap-3 cursor-pointer`}
                        onClick={() => handleViewInsightDetails(item.insight, item.displayDate, item.displayTime)}
                      >
                        <div className="mt-0.5">
                          {getInsightIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900">{item.insight.title}</h4>
                            <span className="text-xs text-gray-600">{item.displayDate} · {item.displayTime}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{item.insight.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* "Overview of Sensors" banner is handled by Banner.tsx */}
        
        {/* Row 3: Two-Column Graphs */}
        <section className="border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Efficiency vs Environment */}
            <div className="border-r border-gray-200">
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Efficiency vs Environment</h3>
                <p className="text-sm text-gray-500 mb-4">Impact of temperature and humidity on efficiency</p>
                <div className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <EfficiencyEnvironment 
                      chartData={analyticsData?.data.efficiencyEnvironment || []}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Lux vs Irradiance */}
            <div>
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Light Intensity vs Solar Irradiance</h3>
                <p className="text-sm text-gray-500 mb-4">Correlation between light levels and solar energy potential</p>
                <div className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <LuxIrradianceGraph 
                      chartData={analyticsData?.data.luxIrradiance || []}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Row 4: Two-Column Data View */}
        <section className="border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Peak Solar Hours Breakdown */}
            <div className="border-r border-gray-200">
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Peak Solar Hours & Off-Peak Analysis</h3>
                <p className="text-sm text-gray-500 mb-4">Solar energy generation trends throughout the week</p>
                <div className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <PeakSolarHours 
                      chartData={analyticsData?.data.peakSolarHours || []}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Battery Charge & Discharge Graph */}
            <div>
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Battery Charge & Discharge</h3>
                <p className="text-sm text-gray-500 mb-4">Tracking battery charge levels and energy consumption</p>
                <div className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <BatteryChargeDischarge 
                      chartData={analyticsData?.data.batteryCharge || []}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Row 5: Two-Column Graphs */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Panel Temperature & Overheating Graph */}
            <div className="border-r border-gray-200">
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Panel Temperature & Overheating</h3>
                <p className="text-sm text-gray-500 mb-4">Monitoring temperature fluctuations and overheating risks</p>
                <div className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <PanelTemperatureOverheating 
                      chartData={analyticsData?.data.panelTemperature || []}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Solar Irradiance vs Power Output */}
            <div>
              <div className="px-4 py-6">
                <h3 className="text-lg font-medium mb-1">Solar Irradiance vs Power Output</h3>
                <p className="text-sm text-gray-500 mb-4">Comparing sunlight intensity with generated power</p>
                <div className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                  ) : (
                    <IrradianceGraph 
                      chartData={analyticsData?.data.irradiance || []}
                      showAverageOnly={true}
                      irradiancePowerData={analyticsData?.data.irradiancePower || []}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <InsightDetailModal
          isOpen={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          title={selectedInsight.title}
          content={selectedInsight.content || selectedInsight.detail}
          type={selectedInsight.type}
          date={selectedDate}
          time={selectedTime}
        />
      )}
    </>
  );
} 
import { useState, useEffect } from "react";
import { TrendingUp, ArrowUp, SunIcon, GaugeIcon, CircleOff, Battery, AlertTriangle, FileText, CircleCheck } from "lucide-react";
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

// Analytics data interface
interface AnalyticsData {
  timeInterval: string;
  startDate: string;
  endDate: string;
  summaryValues: {
    efficiency: {
      value: number;
      trend: number;
      unit: string;
    };
    dailyYield: {
      value: number;
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

  // Mock data for insights with updated structure to match design
  const insights = [
    {
      type: "normal",
      title: "Panel 1 is stable",
      detail: "Efficiency: 80%, with no detected issues.",
      date: "22 Oct 2024",
      time: "3:42am"
    },
    {
      type: "critical",
      title: "Battery low!",
      detail: "Output is at 15%, plug in now",
      date: "22 Oct 2024",
      time: "3:42am"
    },
    {
      type: "offline",
      title: "UV Sensor offline",
      detail: "No data since 3:42 AM.",
      date: "22 Oct 2024",
      time: "3:42am"
    },
    {
      type: "warning",
      title: "Panel 2 drop",
      detail: "Efficiency: 85% → 75%. Monitoring is advised",
      date: "22 Oct 2024",
      time: "3:42am"
    },
    {
      type: "note",
      title: "Maintenance scheduled",
      detail: "Panel cleaning and inspection set for next Monday.",
      date: "22 Oct 2024",
      time: "9:42am"
    },
    {
      type: "normal",
      title: "Panel 3 performance optimal",
      detail: "Efficiency holding steady at 92%.",
      date: "22 Oct 2024",
      time: "9:42pm"
    }
  ];

  // Helper to get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'normal':
        return <CircleCheck className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <Battery className="h-5 w-5 text-red-500" />;
      case 'offline':
        return <CircleOff className="h-5 w-5 text-gray-500" />;
      case 'note':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <CircleCheck className="h-5 w-5 text-green-500" />;
    }
  };

  // Helper to get background color based on insight type
  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'normal':
        return 'bg-green-50 border-green-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'critical':
        return 'bg-red-50 border-red-100';
      case 'offline':
        return 'bg-gray-50 border-gray-100';
      case 'note':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-gray-50 border-gray-100';
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
                            +{analyticsData?.summaryValues.efficiency.trend || 0}% Today
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
                
                {/* Daily Yield */}
                <div className="col-span-4">
                  <div className="flex items-start space-x-3 p-4 py-5">
                    <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                      <TrendingUp size={18} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-500 text-xs mb-1">Daily Yield</div>
                      <div className="flex items-baseline">
                        <span className="text-2xl sm:text-3xl font-bold">
                          {analyticsData?.summaryValues.dailyYield.value.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-sm sm:text-base ml-1 text-gray-500">
                          {analyticsData?.summaryValues.dailyYield.unit || 'kWh'}
                        </span>
                        <div className="ml-2 text-xs text-green-500 flex items-center">
                          <ArrowUp size={12} className="mr-0.5" />
                          <span className="hidden md:inline"></span>
                        </div>
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
                
                <div className="space-y-3">
                  {insights.slice(0, 5).map((insight, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${getInsightBgColor(insight.type)} flex items-start gap-3`}
                    >
                      <div className="mt-0.5">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          <span className="text-xs text-gray-600">{insight.date} · {insight.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{insight.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
    </>
  );
} 
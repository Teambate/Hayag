import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw, Grid, ArrowUpDown, Cog, SquareActivity, Lightbulb } from "lucide-react";
import Banner from "../components/layout/Banner";
import { useNotes, Report } from "../context/NotesContext";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";
import InsightCard from "../components/ui/InsightCard";
import InsightDetailModal from "../components/ui/InsightDetailModal";
import { formatReportData, InsightItem } from "../utils/insightUtils";

// Custom icon component for BarChartNoAxes (not available in Lucide)
const BarChartNoAxes = ({ className = "h-5 w-5" }: { className?: string }) => (
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

// Category types
type InsightCategory = "all" | "performance" | "sensor" | "panel" | "insights";

// Props for accessing the setActiveTab function
interface NotesProps {
  setActiveTab?: (tab: string) => void;
}

export default function Notes({ setActiveTab }: NotesProps) {
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  
  // Get reports data and functions from context
  const { reports, fetchReports, loading, error } = useNotes();
  
  // Get device data from DeviceContext and user data from AuthContext
  const { deviceId } = useDevice();
  const { user, isAuthenticated } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Notes component mounted - fetching reports for device:', deviceId);
      fetchReports(); // Fetch reports on mount
    }
  }, [deviceId, fetchReports, isAuthenticated]);

  // Update navbar active tab when component mounts
  useEffect(() => {
    if (setActiveTab) {
      setActiveTab("Insights");
    }
  }, [setActiveTab]);

  // Handle viewing an insight's details
  const handleViewInsightDetails = useCallback((
    insight: InsightItem, 
    date: string, 
    time: string
  ) => {
    setSelectedInsight(insight);
    setSelectedDate(date);
    setSelectedTime(time);
    setIsDetailModalOpen(true);
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered for device:', deviceId);
    fetchReports(); // Refetch reports
  }, [fetchReports, deviceId]);

  // Handle sort toggle
  const handleToggleSort = useCallback(() => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  }, []);

  // Get current device name for display
  const getCurrentDeviceName = useCallback(() => {
    if (!user || !user.devices) return deviceId;
    
    const device = user.devices.find(d => d.deviceId === deviceId);
    return device ? device.name : deviceId;
  }, [user, deviceId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "";
    }
  };

  // Format date for grouping
  const formatDateForGrouping = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  // Helper to get category title for display
  const getCategoryTitle = (category: InsightCategory): string => {
    switch (category) {
      case "all": return "All Insights";
      case "performance": return "Daily Performance";
      case "sensor": return "Sensor Health";
      case "panel": return "Panel Health";
      case "insights": return "System Insights";
      default: return "Insights";
    }
  };

  // Helper to get category icon
  const getCategoryIcon = (category: InsightCategory) => {
    switch (category) {
      case "all":
        return <Grid className="h-5 w-5" />;
      case "performance":
        return <BarChartNoAxes className="h-5 w-5" />;
      case "sensor":
        return <Cog className="h-5 w-5" />;
      case "panel":
        return <SquareActivity className="h-5 w-5" />;
      case "insights":
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Helper to get category icon color
  const getCategoryIconColor = (category: InsightCategory): string => {
    switch (category) {
      case "all":
        return "text-blue-500";
      case "performance":
        return "text-blue-500";
      case "sensor":
        return "text-gray-500";
      case "panel":
        return "text-green-500";
      case "insights":
        return "text-amber-500";
      default:
        return "text-gray-500";
    }
  };

  // Handle category change
  const handleCategoryChange = (category: InsightCategory) => {
    setSelectedCategory(category);
  };

  // Helper function to extract first relevant value from insight detail
  const getHighlightValue = (detail: string): React.ReactNode => {
    // Look for numbers with units or percentages
    const valueMatch = detail.match(/\d+(\.\d+)?(%|kWh|°C)/);
    if (valueMatch) {
      const value = valueMatch[0];
      const beforeValue = detail.substring(0, detail.indexOf(value));
      const afterValue = detail.substring(detail.indexOf(value) + value.length);
      
      return (
        <>
          {beforeValue}
          <span className="font-semibold">{value}</span>
          {afterValue}
        </>
      );
    }
    
    // Check for "decrease" or "increase"
    if (detail.includes('decrease') || detail.includes('increase')) {
      const changeTerms = ['decrease', 'increase'];
      let foundTerm = '';
      let position = -1;
      
      for (const term of changeTerms) {
        const pos = detail.indexOf(term);
        if (pos !== -1 && (position === -1 || pos < position)) {
          position = pos;
          foundTerm = term;
        }
      }
      
      if (position !== -1) {
        // Try to find percentage near the term
        const percentMatch = detail.substring(position - 10, position + 20).match(/\d+(\.\d+)?%/);
        if (percentMatch) {
          const percent = percentMatch[0];
          return (
            <>
              {detail.substring(0, detail.indexOf(percent))}
              <span className={`font-semibold ${foundTerm === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {percent}
              </span>
              {detail.substring(detail.indexOf(percent) + percent.length)}
            </>
          );
        }
      }
    }
    
    // Default case - return as is
    return detail;
  };

  // Render loading state
  if (loading && reports.length === 0) {
    return (
      <>
        <Banner activeTab="Notes" />
        <div className="max-w-5xl mx-auto py-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-[#1e3a29]">Insights</h1>
          </div>
          <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-3">
              <RefreshCw size={48} className="mx-auto animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              Loading reports for {getCurrentDeviceName()}...
            </h3>
          </div>
        </div>
      </>
    );
  }

  // Render error state
  if (error && reports.length === 0) {
    return (
      <>
        <Banner activeTab="Notes" />
        <div className="max-w-5xl mx-auto py-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-[#1e3a29]">Insights</h1>
            <button 
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              Try Again
            </button>
          </div>
          <div className="text-center py-10 bg-white rounded-lg border border-red-200">
            <div className="text-red-400 mb-3">
              <FileText size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-red-700">
              Error loading reports
            </h3>
            <p className="text-red-500 mt-1">
              {error}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Render no reports state
  if (reports.length === 0) {
    return (
      <>
        <Banner activeTab="Notes" />
        <div className="max-w-5xl mx-auto py-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-[#1e3a29]">Insights</h1>
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                {getCurrentDeviceName()}
              </span>
            </div>

            <button 
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm flex items-center"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading && <RefreshCw size={14} className="mr-2 animate-spin" />}
              {loading ? 'Refreshing...' : 'Refresh Reports'}
            </button>
          </div>

          <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-3">
              <FileText size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              No reports found
            </h3>
            <p className="text-gray-500 mt-1">
              No system reports are available for {getCurrentDeviceName()}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Sort reports by date
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Process reports to get formatted insights
  const formattedReports = sortedReports.map(report => {
    const formattedReport = formatReportData(report);
    const displayDate = formatDate(report.date);
    const displayTime = formatTime(report.date);
    const groupDate = formatDateForGrouping(report.date);
    
    return {
      report,
      displayDate,
      displayTime,
      groupDate,
      formattedReport
    };
  });

  // Group insights by date for "All" category
  const reportsByDate = formattedReports.reduce((acc, item) => {
    if (!acc[item.groupDate]) {
      acc[item.groupDate] = [];
    }
    acc[item.groupDate].push(item);
    return acc;
  }, {} as Record<string, typeof formattedReports>);

  // Get sorted dates
  const sortedDates = Object.keys(reportsByDate);
  if (sortOrder === "desc") {
    sortedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  } else {
    sortedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }

  // Generate a list of all insights based on category
  const getAllInsightsForCategory = () => {
    if (selectedCategory === "all") {
      return null; // Will be handled separately
    }

    let allInsights: Array<{
      insight: InsightItem;
      displayDate: string;
      displayTime: string;
      reportId: string | number;
      index: number;
    }> = [];

    formattedReports.forEach((item, reportIndex) => {
      const { formattedReport, displayDate, displayTime, report } = item;
      
      if (selectedCategory === "performance") {
        allInsights.push({
          insight: formattedReport.infoInsight,
          displayDate,
          displayTime,
          reportId: report.id || reportIndex,
          index: 0
        });
      } else if (selectedCategory === "sensor") {
        allInsights.push({
          insight: formattedReport.sensorHealthInsight,
          displayDate,
          displayTime,
          reportId: report.id || reportIndex,
          index: 0
        });
      } else if (selectedCategory === "panel") {
        allInsights.push({
          insight: formattedReport.panelHealthInsight,
          displayDate,
          displayTime,
          reportId: report.id || reportIndex,
          index: 0
        });
      } else if (selectedCategory === "insights") {
        formattedReport.systemInsights.forEach((insight, insightIndex) => {
          allInsights.push({
            insight,
            displayDate,
            displayTime,
            reportId: report.id || reportIndex,
            index: insightIndex
          });
        });
      }
    });

    return allInsights;
  };

  const categoryInsights = getAllInsightsForCategory();

  // Custom card style
  const cardStyle = "p-4 rounded-lg border border-gray-200 bg-white hover:bg-[#FFF9EF] hover:border-[#F0C87A] transition-all";

  // Main content with reports
  return (
    <>
      <Banner activeTab="Notes" />
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-[#1e3a29]">Insights</h1>
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
              {getCurrentDeviceName()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm flex items-center"
              onClick={handleToggleSort}
            >
              <ArrowUpDown size={14} className="mr-2" />
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </button>
            <button 
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm flex items-center"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading && <RefreshCw size={14} className="mr-2 animate-spin" />}
              {loading ? 'Refreshing...' : 'Refresh Reports'}
            </button>
          </div>
        </div>

        {/* Segmented Control for Categories */}
        <div className="flex overflow-x-auto mb-6 border border-gray-200 rounded-lg p-1 bg-gray-50 -mx-1">
          {(["all", "performance", "sensor", "panel", "insights"] as InsightCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-1 ${
                selectedCategory === category
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center">
                <span className={`mr-2 ${selectedCategory === category ? getCategoryIconColor(category) : "text-gray-400"}`}>
                  {getCategoryIcon(category)}
                </span>
                {getCategoryTitle(category)}
              </span>
            </button>
          ))}
        </div>

        {/* Header for current category */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-[#1e3a29] mb-1">
            {getCategoryTitle(selectedCategory)}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedCategory === "all" && "All insights across your system, organized by date"}
            {selectedCategory === "performance" && "Daily energy production and efficiency metrics"}
            {selectedCategory === "sensor" && "Health status of all system sensors"}
            {selectedCategory === "panel" && "Solar panel status and efficiency"}
            {selectedCategory === "insights" && "Automatically generated system insights"}
          </p>
        </div>

        {/* Display insights based on selected category */}
        {selectedCategory === "all" ? (
          // Group all insights by date
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-md font-medium text-gray-700 mb-3 border-b pb-2">{date}</h3>
                <div className="space-y-4">
                  {reportsByDate[date].map(({ report, formattedReport, displayDate, displayTime }, reportIndex) => (
                    <div key={`report-${report.id || reportIndex}`} className="space-y-4">
                      {/* Performance Report */}
                      <div 
                        className={cardStyle + " flex items-start space-x-3 cursor-pointer"}
                        onClick={() => handleViewInsightDetails(
                          formattedReport.infoInsight,
                          displayDate,
                          displayTime
                        )}
                      >
                        <div className="mt-0.5 text-blue-500">
                          <BarChartNoAxes className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900">{formattedReport.infoInsight.title}</h4>
                            <span className="text-xs text-gray-600">{displayDate} · {displayTime}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{getHighlightValue(formattedReport.infoInsight.detail)}</p>
                        </div>
                      </div>

                      {/* Sensor Health */}
                      <div 
                        className={cardStyle + " flex items-start space-x-3 cursor-pointer"}
                        onClick={() => handleViewInsightDetails(
                          formattedReport.sensorHealthInsight,
                          displayDate,
                          displayTime
                        )}
                      >
                        <div className="mt-0.5 text-gray-500">
                          <Cog className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900">{formattedReport.sensorHealthInsight.title}</h4>
                            <span className="text-xs text-gray-600">{displayDate} · {displayTime}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{getHighlightValue(formattedReport.sensorHealthInsight.detail)}</p>
                        </div>
                      </div>

                      {/* Panel Health */}
                      <div 
                        className={cardStyle + " flex items-start space-x-3 cursor-pointer"}
                        onClick={() => handleViewInsightDetails(
                          formattedReport.panelHealthInsight,
                          displayDate,
                          displayTime
                        )}
                      >
                        <div className="mt-0.5 text-green-500">
                          <SquareActivity className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900">{formattedReport.panelHealthInsight.title}</h4>
                            <span className="text-xs text-gray-600">{displayDate} · {displayTime}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{getHighlightValue(formattedReport.panelHealthInsight.detail)}</p>
                        </div>
                      </div>

                      {/* System Insights */}
                      {formattedReport.systemInsights.map((insight, insightIndex) => (
                        <div 
                          key={`insight-${report.id || reportIndex}-${insightIndex}`}
                          className={cardStyle + " flex items-start space-x-3 cursor-pointer"}
                          onClick={() => handleViewInsightDetails(
                            insight,
                            displayDate,
                            displayTime
                          )}
                        >
                          <div className="mt-0.5 text-amber-500">
                            <Lightbulb className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-gray-900">System Insight</h4>
                              <span className="text-xs text-gray-600">{displayDate} · {displayTime}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{getHighlightValue(insight.detail)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sortedDates.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <div className="text-gray-400 mb-3">
                  <FileText size={36} className="mx-auto" />
                </div>
                <h3 className="text-base font-medium text-gray-700">
                  No insights available
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  No insights found for {getCurrentDeviceName()}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Filtered insights for specific category
          <div className="space-y-4">
            {categoryInsights && categoryInsights.length > 0 ? (
              categoryInsights.map(({ insight, displayDate, displayTime, reportId, index }) => (
                <div 
                  key={`${selectedCategory}-${reportId}-${index}`}
                  className={cardStyle + " flex items-start space-x-3 cursor-pointer"}
                  onClick={() => handleViewInsightDetails(
                    insight,
                    displayDate,
                    displayTime
                  )}
                >
                  <div className={`mt-0.5 ${getCategoryIconColor(selectedCategory)}`}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <span className="text-xs text-gray-600">{displayDate} · {displayTime}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{getHighlightValue(insight.detail)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <div className="text-gray-400 mb-3">
                  <FileText size={36} className="mx-auto" />
                </div>
                <h3 className="text-base font-medium text-gray-700">
                  No {getCategoryTitle(selectedCategory).toLowerCase()} available
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  No insights in this category for {getCurrentDeviceName()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
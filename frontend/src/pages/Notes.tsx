import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw } from "lucide-react";
import Banner from "../components/layout/Banner";
import NoteCard from "../components/ui/NoteCard";
import NoteDetailModal from "../components/ui/NoteDetailModal";
import { useNotes, Report } from "../context/NotesContext";
import { useDevice } from "../context/DeviceContext";
import { useAuth } from "../context/AuthContext";

// Props for accessing the setActiveTab function
interface NotesProps {
  setActiveTab?: (tab: string) => void;
}

export default function Notes({ setActiveTab }: NotesProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isNoteDetailModalOpen, setIsNoteDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get reports data and functions from context
  const { reports, fetchReports, loading, error } = useNotes();
  
  // Get device data from DeviceContext and user data from AuthContext
  const { deviceId } = useDevice();
  const { user } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    console.log('Notes component mounted - fetching reports for device:', deviceId);
    fetchReports(true); // Explicitly fetch reports when the component mounts
  }, [deviceId, fetchReports]);

  // Update navbar active tab when component mounts
  useEffect(() => {
    if (setActiveTab) {
      setActiveTab("Insights");
    }
  }, [setActiveTab]);

  // Handle viewing a report's details
  const handleViewReportDetails = useCallback((report: Report) => {
    setSelectedReport(report);
    setIsNoteDetailModalOpen(true);
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    console.log('Manual refresh triggered for device:', deviceId);
    setIsRefreshing(true);
    try {
      await fetchReports(true); // Pass true to force refresh
    } finally {
      // Set a timeout to ensure UI updates properly
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [fetchReports, deviceId]);

  // Reset refreshing state when loading changes
  useEffect(() => {
    if (!loading && isRefreshing) {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  }, [loading, isRefreshing]);

  // Get current device name for display
  const getCurrentDeviceName = useCallback(() => {
    if (!user || !user.devices) return deviceId;
    
    const device = user.devices.find(d => d.deviceId === deviceId);
    return device ? device.name : deviceId;
  }, [user, deviceId]);

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
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing && <RefreshCw size={14} className="mr-2 animate-spin" />}
              {isRefreshing ? 'Refreshing...' : 'Refresh Reports'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reports.map(report => (
            <NoteCard 
              key={report.id} 
              report={report}
              onViewDetails={handleViewReportDetails}
            />
          ))}
        </div>

        {reports.length === 0 && !loading && !error && (
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
        )}
      </div>

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={isNoteDetailModalOpen}
        onOpenChange={setIsNoteDetailModalOpen}
        report={selectedReport}
      />
    </>
  );
} 
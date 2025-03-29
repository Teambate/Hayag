import { useState, useEffect } from "react";
import { AlertTriangle, Info, Check, Bell, Filter, MoreHorizontal } from "lucide-react";
import Banner from "../components/layout/Banner";
import { useNavigate } from "react-router-dom";

type NoteType = "alert" | "warning" | "info" | "success";

interface Note {
  id: number;
  type: NoteType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Props for accessing the setActiveTab function
interface NotesProps {
  setActiveTab?: (tab: string) => void;
}

export default function Notes({ setActiveTab }: NotesProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();

  // Update navbar active tab when component mounts
  useEffect(() => {
    if (setActiveTab) {
      setActiveTab("Notes");
    }
  }, [setActiveTab]);

  // Mock data for system notes/notifications
  const [notes] = useState<Note[]>([
    {
      id: 1,
      type: "alert",
      title: "Panel 1 Overheating",
      message: "Temperature threshold exceeded for Panel 1. Cooling system activated.",
      timestamp: "Today, 11:23 AM",
      read: false
    },
    {
      id: 2,
      type: "warning",
      title: "Battery Charge Low",
      message: "Battery charge level dropped below 30%. Consider reducing load or increasing charge rate.",
      timestamp: "Today, 10:05 AM",
      read: false
    },
    {
      id: 3,
      type: "info",
      title: "System Maintenance",
      message: "Scheduled maintenance will be performed tomorrow at 2:00 PM. System may experience brief downtime.",
      timestamp: "Yesterday, 4:30 PM",
      read: true
    },
    {
      id: 4,
      type: "success",
      title: "Optimal Production Achieved",
      message: "Energy production has reached optimal levels. All systems operating at peak efficiency.",
      timestamp: "Yesterday, 2:15 PM",
      read: true
    },
    {
      id: 5,
      type: "alert",
      title: "Connectivity Issue",
      message: "Brief connection loss detected with sensor array. Connection restored automatically.",
      timestamp: "Oct 12, 9:45 AM",
      read: true
    },
  ]);

  const filters = ["All", "Alerts", "Warnings", "Info"];

  const getIconForType = (type: NoteType) => {
    switch (type) {
      case "alert":
        return <AlertTriangle size={16} className="text-red-500" />;
      case "warning":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "info":
        return <Info size={16} className="text-blue-500" />;
      case "success":
        return <Check size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const filteredNotes = activeFilter === "All" 
    ? notes 
    : notes.filter(note => note.type.toLowerCase() === activeFilter.toLowerCase());

  return (
    <>
      <Banner activeTab="Notes" />
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell size={20} className="mr-2 text-amber-500" />
            <h1 className="text-xl font-medium">System Notifications</h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-md p-1 bg-gray-50">
              {filters.map(filter => (
                <button
                  key={filter}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeFilter === filter 
                      ? "bg-white shadow-sm text-amber-600" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-md hover:bg-gray-100">
              <Filter size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotes.map(note => (
            <div 
              key={note.id}
              className={`flex p-4 border rounded-md ${note.read ? 'bg-white' : 'bg-amber-50 border-amber-100'}`}
            >
              <div className="flex-shrink-0 mr-3 mt-1">
                {getIconForType(note.type)}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <h3 className="font-medium">{note.title}</h3>
                    {!note.read && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">New</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{note.timestamp}</div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{note.message}</p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <button className="p-1 rounded-full hover:bg-gray-100">
                  <MoreHorizontal size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 
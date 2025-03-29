import { useState, useEffect } from "react";
import { Bell, Filter, Plus, CircleOff, AlertTriangle, Battery, FileText, CircleCheck } from "lucide-react";
import Banner from "../components/layout/Banner";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/ui/NoteCard";
import AddNoteModal, { AddNoteButton } from "../components/ui/AddNoteModal";
import NoteDetailModal from "../components/ui/NoteDetailModal";

export type NoteType = "normal" | "warning" | "critical" | "offline" | "note";

export interface NoteItem {
  id: number;
  type: NoteType;
  title: string;
  detail: string;
  date: string;
  time: string;
  read: boolean;
  system: boolean; // Indicates if the note was created by the system
}

// Props for accessing the setActiveTab function
interface NotesProps {
  setActiveTab?: (tab: string) => void;
}

export default function Notes({ setActiveTab }: NotesProps) {
  const [activeFilter, setActiveFilter] = useState<NoteType | "All">("All");
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isNoteDetailModalOpen, setIsNoteDetailModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<NoteItem | null>(null);
  const navigate = useNavigate();

  // Update navbar active tab when component mounts
  useEffect(() => {
    if (setActiveTab) {
      setActiveTab("Notes");
    }
  }, [setActiveTab]);

  // Mock data for system notes/notifications with updated structure to match insights
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 1,
      type: "critical",
      title: "Panel 1 Overheating",
      detail: "Temperature threshold exceeded for Panel 1. Cooling system activated.",
      date: "Today",
      time: "11:23 AM",
      read: false,
      system: true
    },
    {
      id: 2,
      type: "warning",
      title: "Battery Charge Low",
      detail: "Battery charge level dropped below 30%. Consider reducing load or increasing charge rate.",
      date: "Today",
      time: "10:05 AM",
      read: false,
      system: true
    },
    {
      id: 3,
      type: "note",
      title: "System Maintenance",
      detail: "Scheduled maintenance will be performed tomorrow at 2:00 PM. System may experience brief downtime.",
      date: "Yesterday",
      time: "4:30 PM",
      read: true,
      system: true
    },
    {
      id: 4,
      type: "normal",
      title: "Optimal Production Achieved",
      detail: "Energy production has reached optimal levels. All systems operating at peak efficiency.",
      date: "Yesterday",
      time: "2:15 PM",
      read: true,
      system: true
    },
    {
      id: 5,
      type: "offline",
      title: "Connectivity Issue",
      detail: "Brief connection loss detected with sensor array. Connection restored automatically.",
      date: "Oct 12",
      time: "9:45 AM",
      read: true,
      system: true
    },
  ]);

  // Create filter definitions with icons and colors
  const filterOptions = [
    { 
      value: "All", 
      label: "All Notes", 
      count: notes.length,
      activeColor: "bg-amber-100 text-amber-800" 
    },
    { 
      value: "critical", 
      label: "Critical", 
      icon: <Battery className="h-4 w-4 text-red-500" />,
      count: notes.filter(note => note.type === "critical").length,
      activeColor: "bg-red-100 text-red-800"
    },
    { 
      value: "warning", 
      label: "Warning", 
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      count: notes.filter(note => note.type === "warning").length,
      activeColor: "bg-amber-100 text-amber-800"
    },
    { 
      value: "normal", 
      label: "Normal", 
      icon: <CircleCheck className="h-4 w-4 text-green-500" />,
      count: notes.filter(note => note.type === "normal").length,
      activeColor: "bg-green-100 text-green-800"
    },
    { 
      value: "note", 
      label: "Notes", 
      icon: <FileText className="h-4 w-4 text-blue-500" />,
      count: notes.filter(note => note.type === "note").length,
      activeColor: "bg-blue-100 text-blue-800"
    },
    { 
      value: "offline", 
      label: "Offline", 
      icon: <CircleOff className="h-4 w-4 text-gray-500" />,
      count: notes.filter(note => note.type === "offline").length,
      activeColor: "bg-gray-200 text-gray-800"
    }
  ];

  const filteredNotes = activeFilter === "All" 
    ? notes 
    : notes.filter(note => note.type === activeFilter);

  // Calculate unread count
  const unreadCount = notes.filter(note => !note.read).length;

  // Handle marking a note as read
  const handleMarkAsRead = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, read: true } : note
    ));
  };

  // Handle deleting a note
  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
    // If the deleted note is currently being viewed, close the modal
    if (selectedNote && selectedNote.id === id) {
      setIsNoteDetailModalOpen(false);
      setSelectedNote(null);
    }
  };

  // Handle marking all as read
  const handleMarkAllAsRead = () => {
    setNotes(notes.map(note => ({ ...note, read: true })));
  };

  // Handle viewing a note's details
  const handleViewNoteDetails = (note: NoteItem) => {
    setSelectedNote(note);
    setIsNoteDetailModalOpen(true);
  };

  // Handle editing a note
  const handleEditNote = (note: NoteItem) => {
    setNoteToEdit(note);
    setIsAddNoteModalOpen(true);
  };

  // Handle adding a new note or updating an existing one
  const handleAddNote = (newNote: Omit<NoteItem, "id" | "read" | "date" | "time" | "system">) => {
    // If editing an existing note
    if (noteToEdit) {
      const updatedNotes = notes.map(note => 
        note.id === noteToEdit.id 
          ? { 
              ...note, 
              ...newNote,
              // Keep the original date and time
            } 
          : note
      );
      
      setNotes(updatedNotes);
      setNoteToEdit(null);
      return;
    }
    
    // Otherwise, create a new note
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    const note: NoteItem = {
      id: Date.now(),
      ...newNote,
      date: "Today",
      time: time,
      read: false,
      system: false // User-created notes are not system notes
    };
    
    setNotes([note, ...notes]);
  };

  return (
    <>
      <Banner activeTab="Notes" />
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center"> {/*DO NOT PUT BELL ICON HERE*/}
            <h1 className="text-2xl font-semibold text-[#1e3a29]">Insights & Notes</h1>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <AddNoteButton onClick={() => setIsAddNoteModalOpen(true)} />
            
            <button 
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filter section with visual indicators */}
        <div className="mb-4">
          <div className="inline-flex p-0.5 rounded-lg bg-gray-100 flex-wrap">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value as NoteType | "All")}
                className={`rounded-md py-1.5 px-3 flex items-center text-sm font-medium transition-colors ${
                  activeFilter === filter.value 
                    ? filter.activeColor || "bg-amber-100 text-amber-800" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {filter.icon && <span className="mr-1.5">{filter.icon}</span>}
                {filter.label}
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs ${
                  activeFilter === filter.value 
                    ? "bg-white bg-opacity-50" 
                    : "bg-white bg-opacity-60"
                } rounded-full`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNote}
              onViewDetails={handleViewNoteDetails}
              onEdit={handleEditNote}
            />
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-3">
              <CircleOff size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} notes found
            </h3>
            <p className="text-gray-500 mt-1">
              Try changing your filter or add a new note
            </p>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      <AddNoteModal 
        isOpen={isAddNoteModalOpen}
        onOpenChange={setIsAddNoteModalOpen}
        onSave={handleAddNote}
        noteToEdit={noteToEdit}
      />

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={isNoteDetailModalOpen}
        onOpenChange={setIsNoteDetailModalOpen}
        note={selectedNote}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
      />
    </>
  );
} 
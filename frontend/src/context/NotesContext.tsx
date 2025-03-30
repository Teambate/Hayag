import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Import types from Notes page
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

interface NotesContextType {
  notes: NoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  unreadCount: number;
  navigateToNotes: () => void;
  markAllAsRead: () => void;
  markAsRead: (id: number) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  // Initial mock data for notes
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

  // Calculate unread count
  const unreadCount = notes.filter(note => !note.read).length;

  // Function to navigate to the notes page
  const navigateToNotes = () => {
    navigate('/notes');
  };

  // Function to mark all notes as read
  const markAllAsRead = () => {
    setNotes(notes.map(note => ({ ...note, read: true })));
  };

  // Function to mark a specific note as read
  const markAsRead = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, read: true } : note
    ));
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        setNotes,
        unreadCount,
        navigateToNotes,
        markAllAsRead,
        markAsRead
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use the notes context
export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export default NotesContext; 
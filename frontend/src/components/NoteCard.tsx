import { AlertTriangle, CircleCheck, CircleOff, Battery, FileText, MoreHorizontal } from "lucide-react";
import { NoteType, NoteItem } from "../pages/Notes";

interface NoteCardProps {
  note: NoteItem;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const NoteCard = ({ note, onMarkAsRead, onDelete }: NoteCardProps) => {
  // Helper to get icon based on note type
  const getInsightIcon = (type: NoteType) => {
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

  // Helper to get background color based on note type
  const getInsightBgColor = (type: NoteType) => {
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

  return (
    <div 
      className={`p-4 rounded-lg border ${getInsightBgColor(note.type)} flex items-start gap-3 ${!note.read ? 'ring-1 ring-amber-300' : ''}`}
    >
      <div className="mt-0.5">
        {getInsightIcon(note.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-gray-900">
            {note.title}
            {!note.read && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">New</span>
            )}
          </h4>
          <span className="text-xs text-gray-600">{note.date} · {note.time}</span>
        </div>
        <p className="text-sm text-gray-700 mt-1">{note.detail}</p>
      </div>
      <div className="flex-shrink-0">
        <button 
          className="p-1 rounded-full hover:bg-gray-200"
          onClick={() => {
            const menu = document.createElement("div");
            menu.className = "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg";
            // Add functionality for dropdown menu
          }}
        >
          <MoreHorizontal size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default NoteCard; 
import { AlertTriangle, CircleCheck, CircleOff, Battery, FileText } from "lucide-react";
import { NoteType, NoteItem } from "../../context/NotesContext";

interface NoteCardProps {
  note: NoteItem;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
  onViewDetails?: (note: NoteItem) => void;
  onEdit?: (note: NoteItem) => void;
}

const NoteCard = ({ note, onMarkAsRead, onViewDetails }: NoteCardProps) => {
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

  // Get shadow and border styling based on read status
  const getCardStyle = (_type: NoteType, read: boolean) => {
    if (!read) {
      return "border-amber-200 shadow-md";
    }
    return "border-gray-200 shadow-sm";
  };

  return (
    <div 
      className={`p-4 rounded-md border ${getCardStyle(note.type, note.read)} bg-white hover:bg-amber-50/30 transition-all flex items-start gap-3 cursor-pointer`}
      onClick={() => {
        if (!note.read && onMarkAsRead) {
          onMarkAsRead(note.id);
        }
        if (onViewDetails) {
          onViewDetails(note);
        }
      }}
    >
      <div className="mt-0.5">
        {getInsightIcon(note.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900">
            {note.title}
            {!note.read && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">New</span>
            )}
          </h4>
          <span className="text-xs text-gray-500">{note.date} · {note.time}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{note.detail}</p>
      </div>
      <div className="flex-shrink-0">
      </div>
    </div>
  );
};

export default NoteCard; 
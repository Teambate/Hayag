import { AlertTriangle, CircleCheck, CircleOff, Battery, FileText, Pencil, Trash2 } from "lucide-react";
import { NoteType, NoteItem } from "../../pages/Notes";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "./dialog";
import { Button } from "./button";

interface NoteDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteItem | null;
  onEdit?: (note: NoteItem) => void;
  onDelete?: (id: number) => void;
}

const NoteDetailModal = ({ isOpen, onOpenChange, note, onEdit, onDelete }: NoteDetailModalProps) => {
  if (!note) return null;

  // Helper to get icon based on note type
  const getInsightIcon = (type: NoteType) => {
    switch (type) {
      case 'normal':
        return <CircleCheck className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'critical':
        return <Battery className="h-6 w-6 text-red-500" />;
      case 'offline':
        return <CircleOff className="h-6 w-6 text-gray-500" />;
      case 'note':
        return <FileText className="h-6 w-6 text-blue-500" />;
      default:
        return <CircleCheck className="h-6 w-6 text-green-500" />;
    }
  };

  // Get color scheme based on note type
  const getTypeColor = (type: NoteType) => {
    switch (type) {
      case 'normal':
        return "bg-green-50 text-green-700 border-green-200";
      case 'warning':
        return "bg-amber-50 text-amber-700 border-amber-200";
      case 'critical':
        return "bg-red-50 text-red-700 border-red-200";
      case 'offline':
        return "bg-gray-50 text-gray-700 border-gray-200";
      case 'note':
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-green-50 text-green-700 border-green-200";
    }
  };

  // Get type label
  const getTypeLabel = (type: NoteType) => {
    switch (type) {
      case 'normal':
        return "Normal";
      case 'warning':
        return "Warning";
      case 'critical':
        return "Critical";
      case 'offline':
        return "Offline";
      case 'note':
        return "Note";
      default:
        return "Normal";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] p-8 min-h-[200px]">
        <DialogHeader className="pt-2 pb-2">
          <DialogTitle className="text-xl font-semibold text-[#1e3a29] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getInsightIcon(note.type)}
              <span>{note.title}</span>
            </div>
            <span className="text-sm font-normal text-gray-500 mr-8">{note.date} · {note.time}</span>
          </DialogTitle>
          <div className="mt-2 ml-7">
            <span className={`px-3 py-1 text-sm rounded-full ${getTypeColor(note.type)}`}>
              {getTypeLabel(note.type)}
            </span>
          </div>
        </DialogHeader>
        
        <div className="py-2 flex-grow">
          <div className="mt-6 mb-6 min-h-[50px]">
            <div className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
              {note.detail}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-end mt-4 pt-2">
          <div className="flex gap-3">
            {!note.system && (
              <>
                {onEdit && (
                  <Button 
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(note);
                    }}
                    className="bg-white hover:bg-gray-50 text-[#1e3a29] border border-gray-200 px-4 py-2 h-9 text-sm"
                  >
                    <Pencil size={14} className="mr-1.5 text-gray-700" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    onClick={() => {
                      onOpenChange(false);
                      onDelete(note.id);
                    }}
                    className="bg-white hover:bg-red-50 text-red-600 border border-gray-200 px-4 py-2 h-9 text-sm"
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteDetailModal; 
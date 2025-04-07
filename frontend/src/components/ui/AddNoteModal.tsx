import { useState, useEffect } from "react";
import { AlertTriangle, Battery, FileText, CircleCheck, CircleOff, Plus } from "lucide-react";
import { NoteType, NoteItem } from "../../pages/Notes";
import { 
  Dialog, 
  DialogContentWithoutCloseButton, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "./dialog";
import { Button } from "./button";

interface AddNoteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: Omit<NoteItem, "id" | "read" | "date" | "time" | "system">) => void;
  noteToEdit?: NoteItem | null;
}

const AddNoteModal = ({ isOpen, onOpenChange, onSave, noteToEdit }: AddNoteModalProps) => {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [type, setType] = useState<NoteType>("note");
  
  // Reset form when modal opens or when noteToEdit changes
  useEffect(() => {
    if (noteToEdit) {
      // If editing an existing note, populate the form
      setTitle(noteToEdit.title);
      setDetail(noteToEdit.detail);
      setType(noteToEdit.type);
    } else {
      // If creating a new note, reset the form
      setTitle("");
      setDetail("");
      setType("note");
    }
  }, [noteToEdit, isOpen]);

  const noteTypes = [
    { 
      value: "normal", 
      label: "Normal",
      icon: <CircleCheck className="h-5 w-5 text-green-500" />,
      description: "Regular updates or standard information"
    },
    { 
      value: "warning", 
      label: "Warning",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      description: "Potential issues that need attention"
    },
    { 
      value: "critical", 
      label: "Critical",
      icon: <Battery className="h-5 w-5 text-red-500" />,
      description: "Urgent matters requiring immediate action"
    },
    { 
      value: "note", 
      label: "Note",
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      description: "General information or reminders"
    },
    { 
      value: "offline", 
      label: "Offline",
      icon: <CircleOff className="h-5 w-5 text-gray-500" />,
      description: "Systems or components that are offline"
    }
  ];

  const handleSave = () => {
    if (!title.trim() || !detail.trim()) {
      alert("Please fill in all fields");
      return;
    }

    onSave({
      title,
      detail,
      type
    });

    // Reset form and close modal
    setTitle("");
    setDetail("");
    setType("note");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContentWithoutCloseButton className="sm:max-w-[550px] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1e3a29] text-center">
            {noteToEdit ? "Edit Note" : "Add Note"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-5">
            <label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1 block">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6CBC92] focus:border-transparent"
              placeholder="Enter note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-5">
            <label htmlFor="note" className="text-sm font-medium text-gray-700 mb-1 block">
              Note
            </label>
            <textarea
              id="note"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6CBC92] focus:border-transparent h-40"
              placeholder="Enter your observations, findings, or reminders"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Note Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {noteTypes.map((noteType) => (
                <label 
                  key={noteType.value} 
                  className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
                    type === noteType.value 
                      ? 'border-[#6CBC92] bg-[#FAFDFB]' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="noteType"
                    className="sr-only"
                    value={noteType.value}
                    checked={type === noteType.value}
                    onChange={() => setType(noteType.value as NoteType)}
                  />
                  <div className="flex-shrink-0 mt-0.5 mr-3">
                    {noteType.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{noteType.label}</div>
                    <div className="text-sm text-gray-500">{noteType.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-600 px-5 py-2 h-auto text-base"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSave}
            className="bg-[#6CBC92] hover:bg-[#5CA980] text-white px-6 py-2.5 h-auto text-base"
          >
            {noteToEdit ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContentWithoutCloseButton>
    </Dialog>
  );
};

// Export as both default and named export for flexibility
export default AddNoteModal;

// ButtonTrigger component for use in pages
export const AddNoteButton = ({ onClick }: { onClick: () => void }) => (
  <Button 
    onClick={onClick}
    className="text-sm bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#1e3a29] px-3 py-2 rounded-md flex items-center shadow-sm"
  >
    <Plus size={16} className="mr-1.5 text-gray-700" />
    Add Note
  </Button>
); 
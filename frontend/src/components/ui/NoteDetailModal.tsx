import { FileText } from "lucide-react";
import { Report } from "../../context/NotesContext";
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
  report: Report | null;
}

const NoteDetailModal = ({ isOpen, onOpenChange, report }: NoteDetailModalProps) => {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] p-8 min-h-[200px]">
        <DialogHeader className="pt-2 pb-2">
          <DialogTitle className="text-xl font-semibold text-[#1e3a29] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              <span>{report.insights.title}</span>
            </div>
            <span className="text-sm font-normal text-gray-500 mr-8">{report.time}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2 flex-grow">
          <div className="mt-6 mb-6">
            <h3 className="text-base font-medium mb-2">Performance Report</h3>
            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800">{report.performance_report.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{report.performance_report.sub_title}</p>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mt-2">
                {report.performance_report.content}
              </div>
            </div>
            
            <h3 className="text-base font-medium mb-2">Sensor Health</h3>
            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800">{report.sensorhealth_report.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{report.sensorhealth_report.sub_title}</p>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mt-2">
                {report.sensorhealth_report.content}
              </div>
            </div>
            
            <h3 className="text-base font-medium mb-2">Panel Health</h3>
            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800">{report.panelhealth_report.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{report.panelhealth_report.sub_title}</p>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mt-2">
                {report.panelhealth_report.content}
              </div>
            </div>
            
            <h3 className="text-base font-medium mb-2">Insights</h3>
            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800">{report.insights.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{report.insights.sub_title}</p>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mt-2">
                {report.insights.content}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteDetailModal; 
import { FileText, Battery, AlertTriangle, BarChart2 } from "lucide-react";
import { Report } from "../../context/NotesContext";

interface NoteCardProps {
  report: Report;
  onViewDetails?: (report: Report) => void;
}

const NoteCard = ({ report, onViewDetails }: NoteCardProps) => {
  // Format the date for display
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
  const formatDate2 = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Get individual date components
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const day = date.toLocaleDateString('en-US', { day: 'numeric' });
      const year = date.toLocaleDateString('en-US', { year: 'numeric' });
      
      // Combine without comma after weekday
      return `${weekday} ${month} ${day}, ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Extract warning count from sensor health subtitle
  const getSensorHealthInfo = (subTitle: string) => {
    try {
      const parts = subTitle.split(',');
      if (parts.length >= 2) {
        return parts[1].trim();
      }
      return subTitle;
    } catch (error) {
      return subTitle;
    }
  };

  // Extract energy value from performance subtitle
  const getEnergyValue = (subTitle: string) => {
    try {
      return subTitle.replace('Energy:', '').trim();
    } catch (error) {
      return subTitle;
    }
  };

  return (
    <div 
      className="p-4 rounded-md border border-gray-200 shadow-sm bg-white hover:bg-amber-50/30 transition-all cursor-pointer"
      onClick={() => {
        if (onViewDetails) {
          onViewDetails(report);
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h4 className="font-medium text-gray-900">
            {formatDate(report.date)}
          </h4>
        </div>
        <span className="text-xs text-gray-500">{formatDate2(report.date)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
        {/* Performance Report */}
        <div className="flex gap-2 items-start">
          <BarChart2 className="h-4 w-4 text-green-500 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700">{report.performance_report.title}</p>
            <p className="text-xs text-gray-600">{getEnergyValue(report.performance_report.sub_title)}</p>
          </div>
        </div>

        {/* Sensor Health */}
        <div className="flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700">{report.sensorhealth_report.title}</p>
            <p className="text-xs text-gray-600">{getSensorHealthInfo(report.sensorhealth_report.sub_title)}</p>
          </div>
        </div>

        {/* Panel Health */}
        <div className="flex gap-2 items-start">
          <Battery className="h-4 w-4 text-red-500 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700">{report.panelhealth_report.title}</p>
            <p className="text-xs text-gray-600">{report.panelhealth_report.sub_title}</p>
          </div>
        </div>

        {/* Insights */}
        <div className="flex gap-2 items-start">
          <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700">{report.insights.title}</p>
            <p className="text-xs text-gray-600">{report.insights.sub_title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard; 
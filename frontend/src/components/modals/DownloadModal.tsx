import { useState } from "react";
import { Dialog, DialogContent, DialogContentWithoutCloseButton, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download, ArrowRight, CheckCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, eachDayOfInterval } from "date-fns";

// Define the format options
const formats = [
  { id: "csv", name: "CSV", description: "Comma Separated Values" },
  { id: "xlsx", name: "Excel", description: "Microsoft Excel Spreadsheet" },
  { id: "json", name: "JSON", description: "JavaScript Object Notation" },
  { id: "pdf", name: "PDF", description: "Portable Document Format" }
];

// Define the props for the component
interface DownloadModalProps {
  dateRange?: DateRange;
  sensors: string[];
}

// Helper function to generate mock data
const generateMockData = (sensors: string[], dateRange?: DateRange) => {
  // Default to a week if no date range
  const startDate = dateRange?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.to || new Date();
  
  // Get all days in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Generate mock readings for each sensor on each day
  return days.map(day => {
    const entry: Record<string, any> = {
      timestamp: format(day, "yyyy-MM-dd HH:mm:ss"),
    };
    
    // Add readings for each selected sensor
    sensors.forEach(sensor => {
      let value;
      let unit = "";
      
      // Generate plausible values based on sensor type
      switch(sensor) {
        case "Light":
          value = Math.floor(Math.random() * 8000) + 2000;
          unit = "lux";
          break;
        case "Irradiance":
          value = Math.floor(Math.random() * 400) + 600;
          unit = "W/m²";
          break;
        case "Humidity":
          value = Math.floor(Math.random() * 40) + 40;
          unit = "%";
          break;
        case "Rain":
          value = Math.floor(Math.random() * 40);
          unit = "mm";
          break;
        case "Ambient Temperature":
          value = Math.floor(Math.random() * 15) + 25;
          unit = "°C";
          break;
        case "Battery":
          value = Math.floor(Math.random() * 30) + 70;
          unit = "%";
          break;
        case "Panel Temperature":
          value = Math.floor(Math.random() * 20) + 35;
          unit = "°C";
          break;
        case "Panel Voltage":
          value = (Math.random() * 5 + 20).toFixed(1);
          unit = "V";
          break;
        case "Panel Current":
          value = (Math.random() * 3 + 4).toFixed(1);
          unit = "A";
          break;
        default:
          value = Math.floor(Math.random() * 100);
      }
      
      entry[sensor] = value + (unit ? ` ${unit}` : "");
    });
    
    return entry;
  });
};

// Convert data to CSV format
const convertToCSV = (data: any[]) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  const rows = data.map(row => {
    return headers.map(header => {
      const cell = row[header];
      // Escape commas and quotes
      return typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
        ? `"${cell.replace(/"/g, '""')}"`
        : cell;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
};

// Convert data to JSON format
const convertToJSON = (data: any[]) => {
  return JSON.stringify(data, null, 2);
};

// Function to create and download a file
const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

export default function DownloadModal({ dateRange, sensors }: DownloadModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Handle download action
  const handleDownload = () => {
    if (sensors.length === 0) return;
    
    setIsDownloading(true);
    
    // Generate the mock data
    const mockData = generateMockData(sensors, dateRange);
    
    // Create timestamp for filename
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    
    setTimeout(() => {
      // Process based on selected format
      try {
        switch (selectedFormat) {
          case "csv":
            const csvContent = convertToCSV(mockData);
            downloadFile(csvContent, `sensor_data_${timestamp}.csv`, 'text/csv;charset=utf-8;');
            break;
            
          case "json":
            const jsonContent = convertToJSON(mockData);
            downloadFile(jsonContent, `sensor_data_${timestamp}.json`, 'application/json');
            break;
            
          case "xlsx":
            // For XLSX, we'd need a library like xlsx or exceljs
            // Since we can't add dependencies here, we'll mock it with a message
            alert("Excel export would require the xlsx library. Using CSV format instead.");
            const xlsxMockContent = convertToCSV(mockData);
            downloadFile(xlsxMockContent, `sensor_data_${timestamp}.csv`, 'text/csv;charset=utf-8;');
            break;
            
          case "pdf":
            // For PDF, we'd need a library like jspdf
            // Since we can't add dependencies here, we'll mock it with a message
            alert("PDF export would require the jsPDF library. Using CSV format instead.");
            const pdfMockContent = convertToCSV(mockData);
            downloadFile(pdfMockContent, `sensor_data_${timestamp}.csv`, 'text/csv;charset=utf-8;');
            break;
            
          default:
            const defaultContent = convertToCSV(mockData);
            downloadFile(defaultContent, `sensor_data_${timestamp}.csv`, 'text/csv;charset=utf-8;');
        }
        
        setIsDownloading(false);
        setDownloadComplete(true);
        
        // Reset after a short delay
        setTimeout(() => {
          setDownloadComplete(false);
          setIsOpen(false);
        }, 1500);
      } catch (error) {
        console.error("Error during download:", error);
        setIsDownloading(false);
        alert("An error occurred during download.");
      }
    }, 1000); // Simulate processing time
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-[#FAFDFB] border-transparent hover:border-[#6CBC92] hover:bg-[#FAFDFB]"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContentWithoutCloseButton className="sm:max-w-[550px] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1e3a29] text-center">
            Export Sensor Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* Selected sensors */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected Sensors</p>
            <div className="flex flex-wrap gap-2 p-3 bg-[#F5F7FA] rounded-lg">
              {sensors.length > 0 ? (
                sensors.map((sensor) => (
                  <span 
                    key={sensor} 
                    className="px-3 py-1.5 text-sm bg-[#FFEFD7] text-[#F6AE0E] rounded-md border border-[#FFD984]"
                  >
                    {sensor}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No sensors selected</span>
              )}
            </div>
          </div>

          {/* Date range display */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Date Range</p>
            <div className="flex items-center p-3 bg-[#F5F7FA] rounded-lg">
              <span className="text-sm text-gray-800 font-medium">
                {dateRange?.from 
                  ? format(dateRange.from, "MMMM dd, yyyy") 
                  : "Start date"}
              </span>
              <ArrowRight className="h-4 w-4 mx-3 text-gray-400" />
              <span className="text-sm text-gray-800 font-medium">
                {dateRange?.to 
                  ? format(dateRange.to, "MMMM dd, yyyy") 
                  : "End date"}
              </span>
            </div>
          </div>
          
          {/* Format selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Choose Format</p>
            <div className="grid grid-cols-4 gap-3">
              {formats.map((format) => (
                <div 
                  key={format.id}
                  className={`p-4 rounded-lg cursor-pointer border transition-all ${
                    selectedFormat === format.id 
                      ? "border-[#6CBC92] bg-[#F0F9F4]" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="font-medium text-gray-900">{format.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-gray-600 px-5 py-2 h-auto text-base"
            disabled={isDownloading}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            className="bg-[#6CBC92] hover:bg-[#5CA980] text-white px-6 py-2.5 h-auto text-base"
            onClick={handleDownload}
            disabled={isDownloading || downloadComplete || sensors.length === 0}
          >
            {isDownloading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Downloading...
              </>
            ) : downloadComplete ? (
              <>
                <CheckCircle className="mr-3 h-5 w-5" />
                Downloaded
              </>
            ) : (
              <>
                <Download className="mr-3 h-5 w-5" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContentWithoutCloseButton>
    </Dialog>
  );
} 
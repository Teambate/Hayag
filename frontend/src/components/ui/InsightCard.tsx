import React from 'react';
import { FileText, AlertTriangle, Battery, CircleOff, CircleCheck } from 'lucide-react';

export type InsightType = 'info' | 'warning' | 'critical' | 'offline' | 'note';

interface InsightCardProps {
  type: InsightType;
  title: string;
  detail: string;
  date: string;
  time: string;
  onClick?: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ 
  type, 
  title, 
  detail, 
  date, 
  time, 
  onClick 
}) => {
  // Helper to get icon based on insight type
  const getInsightIcon = () => {
    switch (type) {
      case 'info':
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

  // Helper to get background color based on insight type
  const getInsightBgColor = () => {
    switch (type) {
      case 'info':
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
      className={`p-4 rounded-lg border ${getInsightBgColor()} flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="mt-0.5">
        {getInsightIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className="text-xs text-gray-600">{date} · {time}</span>
        </div>
        <p className="text-sm text-gray-700 mt-1">{detail}</p>
      </div>
    </div>
  );
};

export default InsightCard; 
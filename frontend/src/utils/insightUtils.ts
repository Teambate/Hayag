import { InsightType } from "../components/ui/InsightCard";

export interface InsightItem {
  type: InsightType;
  title: string;
  detail: string;
  content?: string;
}

export interface FormattedReport {
  infoInsight: InsightItem;
  sensorHealthInsight: InsightItem;
  panelHealthInsight: InsightItem;
  systemInsights: InsightItem[];
}

// Determines the sensor health insight type based on report data
export const determineSensorHealthType = (subTitle: string): InsightType => {
  if (subTitle.includes('0 Warning') && subTitle.includes('0 Critical')) {
    return 'info';
  } else if (subTitle.includes('Critical')) {
    return 'critical';
  } else {
    return 'warning';
  }
};

// Determines the panel health insight type based on report data
export const determinePanelHealthType = (subTitle: string): InsightType => {
  if (subTitle.includes('0 Warning') && subTitle.includes('0 Critical')) {
    return 'info';
  } else if (subTitle.includes('Critical')) {
    return 'critical';
  } else {
    return 'warning';
  }
};

// Parse system insights from content text
export const parseSystemInsights = (insightsContent: string): InsightItem[] => {
  const insights: InsightItem[] = [];
  
  // Split the content by lines
  const lines = insightsContent.split('\n');
  
  // Find the sections (Warning insights, Performance insights, etc.)
  let currentSection = '';
  
  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is a section header
    if (line.endsWith('insights:')) {
      currentSection = line;
      continue;
    }
    
    // Process bullet point items
    if (line.startsWith('•')) {
      const detail = line.substring(1).trim();
      let type: InsightType = 'info';
      
      // Determine insight type based on content and section
      if (currentSection.includes('Warning') || detail.toLowerCase().includes('warning')) {
        type = 'warning';
      } else if (
        currentSection.includes('Critical') || 
        detail.toLowerCase().includes('critical') ||
        detail.toLowerCase().includes('low efficiency') ||
        detail.toLowerCase().includes('panel issues') ||
        detail.toLowerCase().includes('battery low')
      ) {
        type = 'critical';
      } else if (detail.toLowerCase().includes('offline')) {
        type = 'offline';
      } else if (detail.toLowerCase().includes('generated') || detail.toLowerCase().includes('performance')) {
        type = 'note';
      }
      
      insights.push({
        type,
        title: 'System Insight',
        detail,
        content: insightsContent
      });
    }
  }
  
  return insights;
};

// Format API report data into our internal format
export const formatReportData = (report: any): FormattedReport => {
  // Format info insight
  const infoInsight: InsightItem = {
    type: 'note',
    title: report.performance_report.title,
    detail: report.performance_report.sub_title,
    content: report.performance_report.content
  };
  
  // Format sensor health insight
  const sensorHealthType = determineSensorHealthType(report.sensorhealth_report.sub_title);
  const sensorHealthInsight: InsightItem = {
    type: sensorHealthType,
    title: report.sensorhealth_report.title,
    detail: report.sensorhealth_report.sub_title,
    content: report.sensorhealth_report.content
  };
  
  // Format panel health insight
  const panelHealthType = determinePanelHealthType(report.panelhealth_report.sub_title);
  const panelHealthInsight: InsightItem = {
    type: panelHealthType,
    title: report.panelhealth_report.title,
    detail: report.panelhealth_report.sub_title,
    content: report.panelhealth_report.content
  };
  
  // Parse and format system insights
  const systemInsights = parseSystemInsights(report.insights.content);
  
  return {
    infoInsight,
    sensorHealthInsight,
    panelHealthInsight,
    systemInsights
  };
}; 
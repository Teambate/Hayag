import React from 'react';
import { CheckIcon, AlertTriangleIcon, BatteryLowIcon, XIcon, PlugIcon, LightbulbIcon, PlusIcon } from 'lucide-react';

// Define notification types
export type NotificationType = 'normal' | 'warning' | 'critical' | 'offline';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  details: string;
  timestamp: string;
  date: string;
  icon?: React.ReactNode;
}

interface SystemHealthProps {
  maxVisible?: number;
  notifications?: SystemNotification[];
}

const SystemHealth: React.FC<SystemHealthProps> = ({ maxVisible = 4, notifications = [] }) => {
  // Sample notifications data if none provided (would come from API in real implementation)
  const defaultNotifications: SystemNotification[] = [
    {
      id: '1',
      type: 'normal',
      title: 'Panel 1 is stable',
      details: 'Efficiency: 80%, with no detected issues.',
      timestamp: '3:42am',
      date: '22 Oct 2024',
      icon: <LightbulbIcon size={24} className="text-green-500" />
    },
    {
      id: '2',
      type: 'critical',
      title: 'Battery low!',
      details: 'Output is at 15%, plug in now',
      timestamp: '3:42am',
      date: '22 Oct 2024',
      icon: <BatteryLowIcon size={24} className="text-red-500" />
    },
    {
      id: '3',
      type: 'offline',
      title: 'UV Sensor offline',
      details: 'No data since 3:42 AM.',
      timestamp: '3:42am',
      date: '22 Oct 2024',
      icon: <XIcon size={24} className="text-gray-500" />
    },
    {
      id: '4',
      type: 'warning',
      title: 'Panel 2 drop',
      details: 'Efficiency: 85% → 75%. Monitoring is advised',
      timestamp: '3:42am',
      date: '22 Oct 2024',
      icon: <AlertTriangleIcon size={24} className="text-amber-500" />
    }
  ];

  const notificationsToShow = notifications.length > 0 ? notifications : defaultNotifications;

  // Calculate how many notifications are hidden
  const visibleNotifications = notificationsToShow.slice(0, maxVisible);
  const hiddenCount = Math.max(0, notificationsToShow.length - maxVisible);

  return (
    <div className="space-y-2">
      {visibleNotifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}
      
      {hiddenCount > 0 && (
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <PlusIcon size={12} className="mr-1" />
          <span>{hiddenCount} more notification{hiddenCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

// Get icon based on notification type
export const getNotificationIcon = (type: NotificationType, size: number = 24) => {
  switch (type) {
    case 'normal':
      return <LightbulbIcon size={size} className="text-green-500" />;
    case 'warning':
      return <AlertTriangleIcon size={size} className="text-amber-500" />;
    case 'critical':
      return <BatteryLowIcon size={size} className="text-red-500" />;
    case 'offline':
      return <XIcon size={size} className="text-gray-500" />;
    default:
      return null;
  }
};

// Reusable notification card component
export const NotificationCard: React.FC<{ notification: SystemNotification, compact?: boolean }> = ({ notification, compact = false }) => {
  // Set background color based on notification type
  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'normal': return 'bg-green-50';
      case 'warning': return 'bg-amber-50';
      case 'critical': return 'bg-red-50';
      case 'offline': return 'bg-gray-100';
      default: return 'bg-white';
    }
  };

  // Set border color based on notification type
  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'normal': return 'border-green-200';
      case 'warning': return 'border-amber-200';
      case 'critical': return 'border-red-200';
      case 'offline': return 'border-gray-200';
      default: return 'border-gray-200';
    }
  };

  // Use provided icon or generate one based on type
  const icon = notification.icon || getNotificationIcon(notification.type, compact ? 20 : 24);

  return (
    <div className={`relative rounded-md border ${getBorderColor(notification.type)} ${getBgColor(notification.type)} ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex justify-between">
        <div className="flex items-start">
          <div className={`${compact ? 'mr-2' : 'mr-3'} flex-shrink-0`}>
            {icon}
          </div>
          <div>
            <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>{notification.title}</h4>
            <p className={`text-xs text-gray-600 ${compact ? 'mt-0' : 'mt-0.5'}`}>{notification.details}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {notification.date} · {notification.timestamp}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth; 
import { useState, ReactNode } from 'react';
import { SystemNotification } from '../components/graphs/SystemHealth';
import { LightbulbIcon, AlertTriangleIcon, BatteryLowIcon, XIcon } from 'lucide-react';

// Create icon mappings without JSX
const createIcon = (type: 'normal' | 'warning' | 'critical' | 'offline'): ReactNode => {
  switch (type) {
    case 'normal':
      return <LightbulbIcon size={24} className="text-green-500" />;
    case 'critical':
      return <BatteryLowIcon size={24} className="text-red-500" />;
    case 'offline':
      return <XIcon size={24} className="text-gray-500" />;
    case 'warning':
      return <AlertTriangleIcon size={24} className="text-amber-500" />;
  }
};

// Default notifications for demo purposes
const defaultNotifications: SystemNotification[] = [
  {
    id: '1',
    type: 'normal',
    title: 'Panel 1 is stable',
    details: 'Efficiency: 80%, with no detected issues.',
    timestamp: '3:42am',
    date: '22 Oct 2024'
  },
  {
    id: '2',
    type: 'critical',
    title: 'Battery low!',
    details: 'Output is at 15%, plug in now',
    timestamp: '3:42am',
    date: '22 Oct 2024'
  },
  {
    id: '3',
    type: 'offline',
    title: 'UV Sensor offline',
    details: 'No data since 3:42 AM.',
    timestamp: '3:42am',
    date: '22 Oct 2024'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Panel 2 drop',
    details: 'Efficiency: 85% → 75%. Monitoring is advised',
    timestamp: '3:42am',
    date: '22 Oct 2024'
  }
];

export function useSystemNotifications(initialNotifications = defaultNotifications) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(
    // Add icons to initial notifications
    initialNotifications.map(notification => ({
      ...notification,
      icon: notification.icon || createIcon(notification.type)
    }))
  );

  // Add a new notification
  const addNotification = (notification: Omit<SystemNotification, 'id'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(), // Simple ID generation
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      icon: notification.icon || createIcon(notification.type as 'normal' | 'warning' | 'critical' | 'offline')
    };
    
    setNotifications(prev => [newNotification as SystemNotification, ...prev]);
  };

  // Remove a notification by ID
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Get notifications by type
  const getNotificationsByType = (type: SystemNotification['type']) => {
    return notifications.filter(notification => notification.type === type);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    getNotificationsByType
  };
} 
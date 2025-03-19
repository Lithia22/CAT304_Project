// PatientNotification.js
import React, { createContext, useState, useContext } from 'react';
import { buildApiUrl } from './src/configuration/config';

const PatientNotificationContext = createContext();

export const PatientNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (patientId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/notifications/patient/${patientId}`));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/notifications/${notificationId}`), {
        method: 'PATCH'
      });
      
      if (!response.ok) throw new Error('Failed to mark notification as read');
      
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    clearNotifications
  };

  return (
    <PatientNotificationContext.Provider value={value}>
      {children}
    </PatientNotificationContext.Provider>
  );
};

export const usePatientNotifications = () => {
  const context = useContext(PatientNotificationContext);
  if (!context) {
    throw new Error('usePatientNotifications must be used within a PatientNotificationProvider');
  }
  return context;
};
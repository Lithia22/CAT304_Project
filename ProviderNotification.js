// NotificationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { buildApiUrl } from './src/configuration/config';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  const fetchMedicationsAndNotifications = async () => {
    try {
      const categories = [
        { endpoint: 'medications', name: 'Diabetes' },
        { endpoint: 'cardiovascular-medications', name: 'Cardiovascular' },
        { endpoint: 'cancer-medications', name: 'Cancer' },
        { endpoint: 'kidney-disease-medicines', name: 'Kidney Disease' },
        { endpoint: 'stroke-medications', name: 'Stroke' },
        { endpoint: 'arthritis-medications', name: 'Arthritis' }
      ];

      const medications = [];
      for (const category of categories) {
        const response = await fetch(buildApiUrl(`/api/${category.endpoint}`));
        if (!response.ok) throw new Error(`Failed to fetch ${category.name} medications`);
        const categoryMeds = await response.json();
        categoryMeds.forEach(med => {
          med.category = category.name;
        });
        medications.push(...categoryMeds);
      }

      const currentDate = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

      let newNotifications = [];

      medications.forEach(medication => {
        if (medication.quantity <= medication.reorderPoint) {
          newNotifications.push({
            id: `lowstock-${medication.category}-${medication.id}`,
            type: 'lowStock',
            title: `Low Stock Warning - ${medication.category}`,
            message: `${medication.name} is running low (${medication.quantity} units remaining)`,
            timestamp: new Date(),
            priority: medication.quantity === 0 ? 'high' : 'medium',
            category: medication.category
          });
        }

        const expirationDate = new Date(medication.expirationDate);
        if (expirationDate <= thirtyDaysFromNow) {
          newNotifications.push({
            id: `expiring-${medication.category}-${medication.id}`,
            type: 'expiring',
            title: `Expiration Warning - ${medication.category}`,
            message: `${medication.name} expires on ${expirationDate.toLocaleDateString()}`,
            timestamp: new Date(),
            priority: expirationDate <= currentDate ? 'high' : 'medium',
            category: medication.category
          });
        }
      });

      newNotifications.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return b.timestamp - a.timestamp;
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  useEffect(() => {
    fetchMedicationsAndNotifications();
    const interval = setInterval(fetchMedicationsAndNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
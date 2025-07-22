import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ReminderItem from '../../components/ReminderItem/ReminderItem';
import ReminderForm from '../../components/ReminderForm/ReminderForm';
import styles from './Reminders.module.css';

const Reminders = () => {
  const { reminders, todos, events, loading } = useApp();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, upcoming, overdue, completed
  const [sortBy, setSortBy] = useState('reminderTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Set up notification checking
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const upcomingReminders = reminders.filter(reminder => {
        if (reminder.completed) return false;
        const reminderTime = new Date(reminder.reminderTime.toDate?.() || reminder.reminderTime);
        const timeDiff = reminderTime.getTime() - now.getTime();
        // Notify 5 minutes before
        return timeDiff > 0 && timeDiff <= 5 * 60 * 1000;
      });

      upcomingReminders.forEach(reminder => {
        const reminderTime = new Date(reminder.reminderTime.toDate?.() || reminder.reminderTime);
        new Notification(`Reminder: ${reminder.title}`, {
          body: `Scheduled for ${reminderTime.toLocaleTimeString()}${reminder.description ? '\n' + reminder.description : ''}`,
          icon: '/favicon.ico',
          requireInteraction: true
        });
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, notificationPermission]);

  // Filter and sort reminders
  const filteredAndSortedReminders = useMemo(() => {
    const now = new Date();
    
    let filtered = reminders.filter(reminder => {
      // Search filter
      const matchesSearch = !searchTerm || 
        reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reminder.description && reminder.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const reminderTime = new Date(reminder.reminderTime.toDate?.() || reminder.reminderTime);
      let matchesType = true;
      
      switch (filterType) {
        case 'upcoming':
          matchesType = !reminder.completed && reminderTime > now;
          break;
        case 'overdue':
          matchesType = !reminder.completed && reminderTime < now;
          break;
        case 'completed':
          matchesType = reminder.completed;
          break;
        default:
          matchesType = true;
      }

      return matchesSearch && matchesType;
    });

    // Sort reminders
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date objects
      if (aValue && aValue.toDate) aValue = aValue.toDate();
      if (bValue && bValue.toDate) bValue = bValue.toDate();

      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return sortOrder === 'asc' ? 1 : -1;
      if (!bValue) return sortOrder === 'asc' ? -1 : 1;

      // Compare values
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [reminders, searchTerm, filterType, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const total = reminders.length;
    const completed = reminders.filter(r => r.completed).length;
    const upcoming = reminders.filter(r => {
      const reminderTime = new Date(r.reminderTime.toDate?.() || r.reminderTime);
      return !r.completed && reminderTime > now;
    }).length;
    const overdue = reminders.filter(r => {
      const reminderTime = new Date(r.reminderTime.toDate?.() || r.reminderTime);
      return !r.completed && reminderTime < now;
    }).length;

    return { total, completed, upcoming, overdue };
  }, [reminders]);

  // Handle reminder completion
  const handleToggleComplete = async (reminderId, completed) => {
    try {
      const reminderRef = doc(db, 'reminders', reminderId);
      await updateDoc(reminderRef, {
        completed: !completed,
        completedAt: !completed ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  // Handle reminder deletion
  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteDoc(doc(db, 'reminders', reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  // Get linked item details
  const getLinkedItem = (reminder) => {
    if (reminder.linkedTodoId) {
      return todos.find(todo => todo.id === reminder.linkedTodoId);
    }
    if (reminder.linkedEventId) {
      return events.find(event => event.id === reminder.linkedEventId);
    }
    return null;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setSortBy('reminderTime');
    setSortOrder('asc');
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading reminders..." />
      </div>
    );
  }

  return (
    <div className={styles.reminders}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Reminders</h1>
          <div className={styles.stats}>
            <span className={styles.stat}>Total: {stats.total}</span>
            <span className={styles.stat}>Upcoming: {stats.upcoming}</span>
            <span className={styles.stat}>Completed: {stats.completed}</span>
            {stats.overdue > 0 && (
              <span className={`${styles.stat} ${styles.overdue}`}>
                Overdue: {stats.overdue}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className={styles.addButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Reminder
          </Button>
        </div>
      </div>

      {notificationPermission !== 'granted' && (
        <motion.div
          className={styles.notificationBanner}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.notificationContent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 01-3.46 0"></path>
            </svg>
            <span>Enable notifications to receive reminders on time</span>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={requestNotificationPermission}
          >
            Enable
          </Button>
        </motion.div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchSection}>
          <Input
            type="text"
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterControls}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Reminders</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="reminderTime">Reminder Time</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
          </select>

          <Button
            variant="ghost"
            size="small"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={styles.sortButton}
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {sortOrder === 'asc' ? (
                <path d="M12 19V6m-7 7l7-7 7 7"/>
              ) : (
                <path d="M12 5v13m7-7l-7 7-7-7"/>
              )}
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="small"
            onClick={clearFilters}
            className={styles.clearButton}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className={styles.remindersList}>
        <AnimatePresence>
          {filteredAndSortedReminders.length > 0 ? (
            filteredAndSortedReminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <ReminderItem
                  reminder={reminder}
                  linkedItem={getLinkedItem(reminder)}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteReminder}
                  onEdit={setEditingReminder}
                />
              </motion.div>
            ))
          ) : (
            <div className={styles.empty}>
              <p>No reminders found</p>
              {(searchTerm || filterType !== 'all') ? (
                <Button
                  variant="outline"
                  size="small"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setShowForm(true)}
                >
                  Add Your First Reminder
                </Button>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {(showForm || editingReminder) && (
        <ReminderForm
          reminder={editingReminder}
          todos={todos}
          events={events}
          onClose={() => {
            setShowForm(false);
            setEditingReminder(null);
          }}
        />
      )}
    </div>
  );
};

export default Reminders;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button/Button';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Widget from '../../components/Widget/Widget';
import QuickAddModal from '../../components/QuickAddModal/QuickAddModal';
import FirebaseTest from '../../components/FirebaseTest/FirebaseTest';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { todos, events, reminders, loading } = useApp();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState('todo');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    };
    
    setGreeting(getGreeting());
  }, []);

  // Get today's data
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  const todaysTodos = todos.filter(todo => {
    try {
      return !todo.completed && 
        (!todo.dueDate || todo.dueDate >= todayString);
    } catch (error) {
      console.warn('Error filtering todos:', error);
      return false;
    }
  }).slice(0, 5);

  const todaysEvents = events.filter(event => {
    try {
      if (!event.startDate) return false;
      const eventDate = new Date(event.startDate.toDate?.() || event.startDate);
      if (isNaN(eventDate.getTime())) return false;
      return eventDate.toISOString().split('T')[0] === todayString;
    } catch (error) {
      console.warn('Error filtering events:', error);
      return false;
    }
  }).slice(0, 3);

  const upcomingReminders = reminders.filter(reminder => {
    try {
      if (!reminder.reminderTime) return false;
      const reminderDate = new Date(reminder.reminderTime.toDate?.() || reminder.reminderTime);
      if (isNaN(reminderDate.getTime())) return false;
      return reminderDate >= today;
    } catch (error) {
      console.warn('Error filtering reminders:', error);
      return false;
    }
  }).slice(0, 3);

  const openQuickAdd = (type) => {
    setQuickAddType(type);
    setShowQuickAdd(true);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <div className={styles.greeting}>
            <h1>{greeting}, {currentUser?.displayName || 'User'}!</h1>
            <p>Here's what's on your schedule today</p>
          </div>
          
          <div className={styles.quickActions}>
            <Button
              variant="primary"
              onClick={() => openQuickAdd('todo')}
              className={styles.quickAddButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Todo
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => openQuickAdd('event')}
              className={styles.quickAddButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Event
            </Button>
          </div>
        </div>

        {/* Firebase Connection Test - Remove after testing */}
        <FirebaseTest />

        <div className={styles.widgets}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={styles.widgetContainer}
          >
            <Widget
              title="Today's Tasks"
              count={todaysTodos.length}
              items={todaysTodos}
              type="todos"
              onViewAll={() => navigate('/todos')}
              onAdd={() => openQuickAdd('todo')}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={styles.widgetContainer}
          >
            <Widget
              title="Today's Events"
              count={todaysEvents.length}
              items={todaysEvents}
              type="events"
              onViewAll={() => navigate('/schedule')}
              onAdd={() => openQuickAdd('event')}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={styles.widgetContainer}
          >
            <Widget
              title="Upcoming Reminders"
              count={upcomingReminders.length}
              items={upcomingReminders}
              type="reminders"
              onViewAll={() => navigate('/reminders')}
              onAdd={() => navigate('/reminders')}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={styles.stats}
        >
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Tasks</h3>
              <p className={styles.statNumber}>{todos.length}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Completed Today</h3>
              <p className={styles.statNumber}>
                {todos.filter(todo => 
                  todo.completed && 
                  todo.completedAt &&
                  new Date(todo.completedAt.toDate?.() || todo.completedAt)
                    .toISOString().split('T')[0] === todayString
                ).length}
              </p>
            </div>
            <div className={styles.statCard}>
              <h3>Events This Week</h3>
              <p className={styles.statNumber}>
                {events.filter(event => {
                  const eventDate = new Date(event.startDate.toDate?.() || event.startDate);
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  return eventDate >= today && eventDate <= weekFromNow;
                }).length}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showQuickAdd && (
        <QuickAddModal
          type={quickAddType}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;

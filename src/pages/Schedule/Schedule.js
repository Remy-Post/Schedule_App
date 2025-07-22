import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button/Button';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import EventForm from '../../components/EventForm/EventForm';
import EventItem from '../../components/EventItem/EventItem';
import WeekView from '../../components/WeekView/WeekView';
import styles from './Schedule.module.css';
import 'react-calendar/dist/Calendar.css';

const Schedule = () => {
  const { events, loading } = useApp();
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week'
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateString = selectedDate.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate.toDate?.() || event.startDate);
      return eventDate.toISOString().split('T')[0] === dateString;
    }).sort((a, b) => {
      const timeA = new Date(a.startDate.toDate?.() || a.startDate);
      const timeB = new Date(b.startDate.toDate?.() || b.startDate);
      return timeA - timeB;
    });
  }, [events, selectedDate]);

  // Get all events for calendar tile content
  const getEventsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate.toDate?.() || event.startDate);
      return eventDate.toISOString().split('T')[0] === dateString;
    });
  };

  // Calendar tile content
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return (
          <div className={styles.tileIndicator}>
            <div className={styles.eventDots}>
              {dayEvents.slice(0, 3).map((_, index) => (
                <div key={index} className={styles.eventDot} />
              ))}
              {dayEvents.length > 3 && (
                <span className={styles.moreEvents}>+{dayEvents.length - 3}</span>
              )}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleCreateEvent = (date = selectedDate) => {
    setEditingEvent(null);
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleCloseForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
  };

  const formatSelectedDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading schedule..." />
      </div>
    );
  }

  return (
    <div className={styles.schedule}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Schedule</h1>
          <div className={styles.viewControls}>
            <Button
              variant={view === 'month' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setView('week')}
            >
              Week
            </Button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => handleCreateEvent()}
            className={styles.addButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Event
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {view === 'month' ? (
          <div className={styles.monthView}>
            <div className={styles.calendarContainer}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  tileContent={tileContent}
                  className={styles.calendar}
                  calendarType="gregory"
                  showNeighboringMonth={false}
                  onClickDay={(date) => {
                    setSelectedDate(date);
                  }}
                />
              </motion.div>

              <div className={styles.quickActions}>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setSelectedDate(new Date())}
                  className={styles.todayButton}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleCreateEvent()}
                  className={styles.quickAdd}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Quick Add
                </Button>
              </div>
            </div>

            <div className={styles.dayEvents}>
              <div className={styles.dayHeader}>
                <h2 className={styles.dayTitle}>
                  {formatSelectedDate(selectedDate)}
                </h2>
                <span className={styles.eventCount}>
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className={styles.eventsList}>
                <AnimatePresence>
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <EventItem
                          event={event}
                          selected={selectedEvent?.id === event.id}
                          onClick={() => handleEventClick(event)}
                          onEdit={() => handleEditEvent(event)}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className={styles.noEvents}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>No events scheduled for this day</p>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleCreateEvent()}
                      >
                        Add Event
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            onEventClick={handleEventClick}
            onEventEdit={handleEditEvent}
            onDateChange={handleDateChange}
            onCreateEvent={handleCreateEvent}
            selectedEvent={selectedEvent}
          />
        )}
      </div>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          initialDate={selectedDate}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Schedule;

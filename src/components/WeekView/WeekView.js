import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import styles from './WeekView.module.css';

const WeekView = ({ selectedDate, events, onDateSelect, onEventClick }) => {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start week on Monday
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'HH:mm');
    } catch {
      return timeString;
    }
  };

  return (
    <div className={styles.weekView}>
      <div className={styles.weekHeader}>
        {weekDays.map((day, index) => (
          <div
            key={day.toISOString()}
            className={`${styles.dayHeader} ${
              isSameDay(day, selectedDate) ? styles.selectedDay : ''
            }`}
            onClick={() => onDateSelect(day)}
          >
            <div className={styles.dayName}>
              {format(day, 'EEE')}
            </div>
            <div className={styles.dayNumber}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.weekGrid}>
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`${styles.dayColumn} ${
                isSameDay(day, selectedDate) ? styles.selectedDayColumn : ''
              }`}
              onClick={() => onDateSelect(day)}
            >
              <div className={styles.eventsContainer}>
                {dayEvents.map((event, eventIndex) => (
                  <motion.div
                    key={event.id}
                    className={`${styles.eventCard} ${
                      styles[`priority-${event.priority}`] || styles['priority-medium']
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: eventIndex * 0.1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <div className={styles.eventTime}>
                      {event.startTime && formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                    <div className={styles.eventTitle}>
                      {event.title}
                    </div>
                    {event.description && (
                      <div className={styles.eventDescription}>
                        {event.description.length > 50
                          ? `${event.description.substring(0, 50)}...`
                          : event.description}
                      </div>
                    )}
                  </motion.div>
                ))}
                {dayEvents.length === 0 && (
                  <div className={styles.emptyDay}>
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;

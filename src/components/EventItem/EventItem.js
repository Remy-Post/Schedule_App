import React from 'react';
import { motion } from 'framer-motion';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Button from '../Button/Button';
import styles from './EventItem.module.css';

const EventItem = ({ event, selected, onClick, onEdit }) => {
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', event.id));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(event);
  };

  const formatTime = (date) => {
    return new Date(date.toDate?.() || date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = () => {
    const start = new Date(event.startDate.toDate?.() || event.startDate);
    const end = new Date(event.endDate.toDate?.() || event.endDate);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0 && diffMinutes > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return (
    <motion.div
      className={`${styles.eventItem} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.timeSection}>
        <div className={styles.startTime}>
          {formatTime(event.startDate)}
        </div>
        <div className={styles.duration}>
          {formatDuration()}
        </div>
      </div>

      <div className={styles.contentSection}>
        <h3 className={styles.title}>{event.title}</h3>
        {event.description && (
          <p className={styles.description}>{event.description}</p>
        )}
        
        <div className={styles.metadata}>
          <span className={styles.timeRange}>
            {formatTime(event.startDate)} - {formatTime(event.endDate)}
          </span>
          {event.allDay && (
            <span className={styles.allDayBadge}>All Day</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="ghost"
          size="small"
          onClick={handleEdit}
          className={styles.actionButton}
          aria-label="Edit event"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="small"
          onClick={handleDelete}
          className={`${styles.actionButton} ${styles.deleteButton}`}
          aria-label="Delete event"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </Button>
      </div>

      {selected && event.description && (
        <motion.div
          className={styles.expandedContent}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.fullDescription}>
            <h4>Description</h4>
            <p>{event.description}</p>
          </div>
          
          {event.location && (
            <div className={styles.location}>
              <h4>Location</h4>
              <p>{event.location}</p>
            </div>
          )}
          
          <div className={styles.eventDetails}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Created:</span>
              <span className={styles.detailValue}>
                {new Date(event.createdAt.toDate?.() || event.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {event.updatedAt && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Updated:</span>
                <span className={styles.detailValue}>
                  {new Date(event.updatedAt.toDate?.() || event.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EventItem;

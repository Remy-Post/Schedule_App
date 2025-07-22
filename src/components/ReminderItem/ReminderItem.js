import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import styles from './ReminderItem.module.css';

const ReminderItem = ({ 
  reminder, 
  linkedItem, 
  onToggleComplete, 
  onDelete, 
  onEdit 
}) => {
  const handleToggleComplete = (e) => {
    e.stopPropagation();
    onToggleComplete(reminder.id, reminder.completed);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(reminder);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      onDelete(reminder.id);
    }
  };

  // Check if reminder is overdue
  const reminderTime = new Date(reminder.reminderTime.toDate?.() || reminder.reminderTime);
  const isOverdue = !reminder.completed && reminderTime < new Date();
  const isUpcoming = !reminder.completed && reminderTime > new Date();

  // Format reminder time
  const formatReminderTime = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeString = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (reminderDate.getTime() === today.getTime()) {
      return `Today at ${timeString}`;
    } else if (reminderDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${timeString}`;
    } else if (reminderDate < today) {
      const diffDays = Math.floor((today - reminderDate) / (24 * 60 * 60 * 1000));
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago at ${timeString}`;
    } else {
      return `${date.toLocaleDateString()} at ${timeString}`;
    }
  };

  // Get time until reminder
  const getTimeUntil = () => {
    if (reminder.completed || isOverdue) return null;
    
    const now = new Date();
    const diffMs = reminderTime - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'now';
    }
  };

  return (
    <motion.div
      className={`${styles.reminderItem} ${reminder.completed ? styles.completed : ''} ${isOverdue ? styles.overdue : ''} ${isUpcoming ? styles.upcoming : ''}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      role="article"
    >
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`${styles.completeButton} ${reminder.completed ? styles.completed : ''}`}
            aria-label={reminder.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {reminder.completed && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </button>

          <div className={styles.statusIcon}>
            {isOverdue ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626" stroke="#dc2626">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ) : isUpcoming ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            )}
          </div>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{reminder.title}</h3>
            
            <div className={styles.timeInfo}>
              <span className={`${styles.reminderTime} ${isOverdue ? styles.overdue : ''}`}>
                {formatReminderTime(reminderTime)}
              </span>
              {getTimeUntil() && (
                <span className={styles.timeUntil}>
                  {getTimeUntil()}
                </span>
              )}
            </div>
          </div>

          {reminder.description && (
            <p className={styles.description}>{reminder.description}</p>
          )}

          {linkedItem && (
            <div className={styles.linkedItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              <span className={styles.linkedText}>
                Linked to: {linkedItem.title}
              </span>
            </div>
          )}

          <div className={styles.metadata}>
            <span className={styles.metaItem}>
              Created: {new Date(reminder.createdAt.toDate?.() || reminder.createdAt).toLocaleDateString()}
            </span>
            {reminder.completedAt && (
              <span className={styles.metaItem}>
                Completed: {new Date(reminder.completedAt.toDate?.() || reminder.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="small"
            onClick={handleEdit}
            className={styles.actionButton}
            aria-label="Edit reminder"
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
            aria-label="Delete reminder"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReminderItem;

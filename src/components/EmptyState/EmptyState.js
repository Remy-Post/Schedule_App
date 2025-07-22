import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import styles from './EmptyState.module.css';

/**
 * Reusable empty state component for different scenarios
 */
const EmptyState = ({
  type = 'default',
  title,
  description,
  actionText,
  onAction,
  icon,
  illustration,
  className = ''
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'todos':
        return {
          title: 'No tasks yet',
          description: 'Create your first task to get started with organizing your day',
          actionText: 'Add Task',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3 8-8"/>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.74 0 1.44.09 2.13.25"/>
            </svg>
          )
        };
      case 'events':
        return {
          title: 'No events scheduled',
          description: 'Schedule your first event to start planning your calendar',
          actionText: 'Add Event',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          )
        };
      case 'notes':
        return {
          title: 'No notes created',
          description: 'Start capturing your thoughts and ideas by creating your first note',
          actionText: 'Create Note',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          )
        };
      case 'reminders':
        return {
          title: 'No reminders set',
          description: 'Set up reminders to stay on top of important tasks and events',
          actionText: 'Add Reminder',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="13" r="8"/>
              <path d="M12 9l0 4l2.5 2.5"/>
              <path d="M16.5 7.5L16.5 4.5 15.5 3.5"/>
              <path d="M7.5 7.5L7.5 4.5 8.5 3.5"/>
            </svg>
          )
        };
      case 'search':
        return {
          title: 'No results found',
          description: 'Try adjusting your search terms or filters',
          actionText: 'Clear Filters',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          )
        };
      case 'error':
        return {
          title: 'Something went wrong',
          description: 'We encountered an error loading your data. Please try again.',
          actionText: 'Try Again',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )
        };
      case 'offline':
        return {
          title: 'You\'re offline',
          description: 'Please check your internet connection and try again',
          actionText: 'Retry',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10.09 4.01L4.94 9.07A15.03 15.03 0 0 0 3.66 10a15.92 15.92 0 0 0-1.09 1.84l-.09.15a2 2 0 0 0 .07 2.19 2 2 0 0 0 1.74 1 2 2 0 0 0 1.74-1l.09-.15a11.97 11.97 0 0 1 .8-1.39A11.03 11.03 0 0 1 10.09 8.01"/>
              <path d="M21.93 10.12a15.92 15.92 0 0 0-1.09-1.84 15.03 15.03 0 0 0-1.28-1.06L13.91 4.01"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M1 1l22 22"/>
            </svg>
          )
        };
      default:
        return {
          title: 'Nothing here yet',
          description: 'Get started by creating your first item',
          actionText: 'Get Started',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          )
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;
  const finalActionText = actionText || defaultContent.actionText;
  const finalIcon = icon || defaultContent.icon;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className={`${styles.emptyState} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {(finalIcon || illustration) && (
        <motion.div
          className={styles.iconContainer}
          variants={itemVariants}
        >
          {illustration ? (
            <div className={styles.illustration}>
              {illustration}
            </div>
          ) : (
            <div className={styles.icon}>
              {finalIcon}
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        className={styles.content}
        variants={itemVariants}
      >
        <h3 className={styles.title}>{finalTitle}</h3>
        <p className={styles.description}>{finalDescription}</p>
      </motion.div>

      {onAction && finalActionText && (
        <motion.div
          className={styles.actionContainer}
          variants={itemVariants}
        >
          <Button
            onClick={onAction}
            variant="primary"
            size="medium"
          >
            {finalActionText}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;

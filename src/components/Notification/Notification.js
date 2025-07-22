import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Notification.module.css';

/**
 * Notification component for displaying user-friendly messages
 * Supports different types: success, error, warning, info
 */
const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  isVisible = false, 
  onClose,
  autoClose = true,
  duration = 5000,
  actions = []
}) => {
  const [shouldShow, setShouldShow] = useState(isVisible);

  useEffect(() => {
    setShouldShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (shouldShow && autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [shouldShow, autoClose, duration]);

  const handleClose = () => {
    setShouldShow(false);
    setTimeout(() => {
      onClose?.();
    }, 200); // Wait for exit animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        );
      case 'error':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      default: // info
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
    }
  };

  const variants = {
    hidden: {
      opacity: 0,
      y: -50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={`${styles.notification} ${styles[type]}`}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeOut' }}
          role="alert"
          aria-live="polite"
        >
          <div className={styles.iconContainer}>
            {getIcon()}
          </div>
          
          <div className={styles.content}>
            {title && <h4 className={styles.title}>{title}</h4>}
            {message && <p className={styles.message}>{message}</p>}
            
            {actions.length > 0 && (
              <div className={styles.actions}>
                {actions.map((action, index) => (
                  <button
                    key={index}
                    className={`${styles.actionButton} ${styles[action.variant || 'primary']}`}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close notification"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook for managing notifications
 */
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (config) => {
    setNotification({
      ...config,
      id: Date.now() + Math.random(),
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null);
    setTimeout(() => setNotification(null), 200);
  };

  const showSuccess = (title, message, options = {}) => {
    showNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  };

  const showError = (title, message, options = {}) => {
    showNotification({
      type: 'error',
      title,
      message,
      autoClose: false, // Errors should be manually dismissed
      ...options
    });
  };

  const showWarning = (title, message, options = {}) => {
    showNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  };

  const showInfo = (title, message, options = {}) => {
    showNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Notification;

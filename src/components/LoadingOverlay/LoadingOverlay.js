import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingOverlay.module.css';

/**
 * Enhanced loading overlay with different states and messages
 */
const LoadingOverlay = ({ 
  isLoading, 
  message = 'Loading...', 
  type = 'default', // 'default', 'saving', 'deleting', 'processing'
  children 
}) => {
  if (!isLoading) return children;

  const getLoadingIcon = () => {
    switch (type) {
      case 'saving':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
        );
      case 'deleting':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        );
      case 'processing':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M4.93 4.93l4.24 4.24m5.66 0l4.24-4.24M1 12h6m6 0h6M4.93 19.07l4.24-4.24m5.66 0l4.24 4.24"/>
          </svg>
        );
      default:
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
        );
    }
  };

  const getLoadingMessage = () => {
    switch (type) {
      case 'saving':
        return 'Saving...';
      case 'deleting':
        return 'Deleting...';
      case 'processing':
        return 'Processing...';
      default:
        return message;
    }
  };

  return (
    <div className={styles.container}>
      {/* Render children in background with overlay */}
      <div className={styles.content}>
        {children}
      </div>
      
      {/* Loading overlay */}
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={styles.loadingCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.div
            className={styles.iconContainer}
            animate={{ rotate: type === 'default' ? 360 : 0 }}
            transition={{ 
              duration: type === 'default' ? 1.5 : 0,
              repeat: type === 'default' ? Infinity : 0,
              ease: 'linear'
            }}
          >
            {getLoadingIcon()}
          </motion.div>
          
          <p className={styles.message}>
            {getLoadingMessage()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingOverlay;

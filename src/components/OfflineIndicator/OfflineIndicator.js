import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import styles from './OfflineIndicator.module.css';

/**
 * Component to show offline status to users
 */
const OfflineIndicator = () => {
  const { isOffline, wasOffline } = useOnlineStatus();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          className={styles.offlineBar}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className={styles.content}>
            <div className={styles.iconContainer}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.09 4.01L4.94 9.07A15.03 15.03 0 0 0 3.66 10a15.92 15.92 0 0 0-1.09 1.84l-.09.15a2 2 0 0 0 .07 2.19 2 2 0 0 0 1.74 1 2 2 0 0 0 1.74-1l.09-.15a11.97 11.97 0 0 1 .8-1.39A11.03 11.03 0 0 1 10.09 8.01"/>
                <path d="M21.93 10.12a15.92 15.92 0 0 0-1.09-1.84 15.03 15.03 0 0 0-1.28-1.06L13.91 4.01"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M1 1l22 22"/>
              </svg>
            </div>
            <div className={styles.messageContainer}>
              <span className={styles.title}>You're offline</span>
              <span className={styles.message}>
                Changes will be saved when connection is restored
              </span>
            </div>
          </div>
          <div className={styles.statusDot} />
        </motion.div>
      )}
      
      {/* Show brief "back online" message */}
      {!isOffline && wasOffline && (
        <motion.div
          className={styles.onlineBar}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className={styles.content}>
            <div className={styles.iconContainer}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <div className={styles.messageContainer}>
              <span className={styles.title}>Back online</span>
              <span className={styles.message}>
                Syncing your changes...
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;

import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClass = styles[size];

  return (
    <div className={styles.container} role="status" aria-label={text}>
      <motion.div
        className={`${styles.spinner} ${sizeClass}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <span className={styles.text} aria-hidden="true">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;

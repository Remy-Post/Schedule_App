import React from 'react';
import styles from './SkeletonLoader.module.css';

const SkeletonLoader = ({ type = 'card', count = 1, height = 'auto' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'todo':
        return (
          <div className={`${styles.skeleton} ${styles.todoSkeleton}`}>
            <div className={`${styles.skeletonElement} ${styles.checkbox}`}></div>
            <div className={styles.content}>
              <div className={`${styles.skeletonElement} ${styles.title}`}></div>
              <div className={`${styles.skeletonElement} ${styles.description}`}></div>
              <div className={styles.meta}>
                <div className={`${styles.skeletonElement} ${styles.priority}`}></div>
                <div className={`${styles.skeletonElement} ${styles.date}`}></div>
              </div>
            </div>
          </div>
        );
      case 'note':
        return (
          <div className={`${styles.skeleton} ${styles.noteSkeleton}`}>
            <div className={`${styles.skeletonElement} ${styles.noteTitle}`}></div>
            <div className={`${styles.skeletonElement} ${styles.noteContent}`}></div>
            <div className={`${styles.skeletonElement} ${styles.noteDate}`}></div>
          </div>
        );
      case 'event':
        return (
          <div className={`${styles.skeleton} ${styles.eventSkeleton}`}>
            <div className={`${styles.skeletonElement} ${styles.eventTime}`}></div>
            <div className={styles.eventDetails}>
              <div className={`${styles.skeletonElement} ${styles.eventTitle}`}></div>
              <div className={`${styles.skeletonElement} ${styles.eventDescription}`}></div>
            </div>
          </div>
        );
      default:
        return (
          <div 
            className={`${styles.skeleton} ${styles.cardSkeleton}`}
            style={{ height }}
          >
            <div className={`${styles.skeletonElement} ${styles.cardHeader}`}></div>
            <div className={`${styles.skeletonElement} ${styles.cardBody}`}></div>
            <div className={`${styles.skeletonElement} ${styles.cardFooter}`}></div>
          </div>
        );
    }
  };

  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.skeletonWrapper}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default React.memo(SkeletonLoader);

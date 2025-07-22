import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import styles from './Widget.module.css';

const Widget = ({ title, count, items, type, onViewAll, onAdd }) => {
  const renderItem = (item, index) => {
    switch (type) {
      case 'todos':
        return (
          <motion.div
            key={item.id}
            className={styles.item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <div className={styles.itemContent}>
              <h4 className={styles.itemTitle}>{item.title}</h4>
              <div className={styles.itemMeta}>
                {item.priority && (
                  <span className={`${styles.priority} ${styles[item.priority]}`}>
                    {item.priority}
                  </span>
                )}
                {item.dueDate && (
                  <span className={styles.dueDate}>
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      
      case 'events':
        return (
          <motion.div
            key={item.id}
            className={styles.item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <div className={styles.itemContent}>
              <h4 className={styles.itemTitle}>{item.title}</h4>
              <div className={styles.itemMeta}>
                <span className={styles.eventTime}>
                  {new Date(item.startDate.toDate?.() || item.startDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {item.description && (
                  <span className={styles.description}>{item.description}</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      
      case 'reminders':
        return (
          <motion.div
            key={item.id}
            className={styles.item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <div className={styles.itemContent}>
              <h4 className={styles.itemTitle}>{item.title}</h4>
              <div className={styles.itemMeta}>
                <span className={styles.reminderTime}>
                  {new Date(item.reminderTime.toDate?.() || item.reminderTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={styles.widget}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.count}>{count}</span>
        </div>
        
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="small"
            onClick={onAdd}
            className={styles.addButton}
            aria-label={`Add new ${type.slice(0, -1)}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {items.length > 0 ? (
          <div className={styles.itemList}>
            {items.map((item, index) => renderItem(item, index))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No {type} for today</p>
            <Button
              variant="outline"
              size="small"
              onClick={onAdd}
              className={styles.emptyAction}
            >
              Add {type.slice(0, -1)}
            </Button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="small"
            onClick={onViewAll}
            className={styles.viewAllButton}
          >
            View all {type}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default Widget;

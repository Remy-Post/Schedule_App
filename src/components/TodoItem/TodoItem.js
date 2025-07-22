import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import styles from './TodoItem.module.css';

const TodoItem = ({ 
  todo, 
  selected, 
  onToggleComplete, 
  onDelete, 
  onEdit, 
  onSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    onToggleComplete(todo.id, todo.completed);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(todo);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this todo?')) {
      onDelete(todo.id);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(todo.id, e.target.checked);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Check if todo is overdue
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <motion.div
      className={`${styles.todoItem} ${todo.completed ? styles.completed : ''} ${isOverdue ? styles.overdue : ''}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      onClick={handleToggleExpand}
      role="article"
      aria-expanded={isExpanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggleExpand();
        }
      }}
    >
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <div className={styles.selectSection}>
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelect}
              onClick={(e) => e.stopPropagation()}
              className={styles.selectCheckbox}
              aria-label={`Select ${todo.title}`}
            />
            
            <button
              type="button"
              className={styles.dragHandle}
              aria-label="Drag to reorder"
              tabIndex={-1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="9" cy="12" r="1"></circle>
                <circle cx="9" cy="5" r="1"></circle>
                <circle cx="9" cy="19" r="1"></circle>
                <circle cx="15" cy="12" r="1"></circle>
                <circle cx="15" cy="5" r="1"></circle>
                <circle cx="15" cy="19" r="1"></circle>
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleComplete}
            className={`${styles.completeButton} ${todo.completed ? styles.completed : ''}`}
            aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {todo.completed && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </button>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{todo.title}</h3>
            
            <div className={styles.badges}>
              {todo.priority && (
                <span className={`${styles.priority} ${styles[todo.priority]}`}>
                  {todo.priority}
                </span>
              )}
              
              {todo.dueDate && (
                <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}>
                  {formatDueDate(todo.dueDate)}
                </span>
              )}
            </div>
          </div>

          {todo.description && isExpanded && (
            <motion.p
              className={styles.description}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {todo.description}
            </motion.p>
          )}

          {isExpanded && (
            <motion.div
              className={styles.metadata}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <span className={styles.metaItem}>
                Created: {new Date(todo.createdAt.toDate?.() || todo.createdAt).toLocaleDateString()}
              </span>
              {todo.completedAt && (
                <span className={styles.metaItem}>
                  Completed: {new Date(todo.completedAt.toDate?.() || todo.completedAt).toLocaleDateString()}
                </span>
              )}
            </motion.div>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="small"
            onClick={handleEdit}
            className={styles.actionButton}
            aria-label="Edit todo"
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
            aria-label="Delete todo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="small"
            onClick={handleToggleExpand}
            className={styles.expandButton}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              className={isExpanded ? styles.rotated : ''}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TodoItem;

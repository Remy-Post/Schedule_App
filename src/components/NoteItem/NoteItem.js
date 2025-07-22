import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import styles from './NoteItem.module.css';

const NoteItem = ({ note, onEdit, onDelete, getTagColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Strip HTML tags for preview
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getPreviewText = (content) => {
    if (!content) return '';
    const plainText = stripHtml(content);
    return plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate?.() || new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(note);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <motion.div
      className={styles.noteItem}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={toggleExpanded}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{note.title}</h3>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="small"
            onClick={handleEdit}
            className={styles.actionButton}
            title="Edit note"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={handleDelete}
            className={`${styles.actionButton} ${styles.deleteButton}`}
            title="Delete note"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </Button>
        </div>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className={styles.tags}>
          {note.tags.map(tag => (
            <span 
              key={tag} 
              className={styles.tag}
              style={{ 
                backgroundColor: getTagColor(tag) + '20',
                borderColor: getTagColor(tag) + '40',
                color: getTagColor(tag)
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.content}>
        {isExpanded ? (
          <div 
            className={styles.fullContent}
            dangerouslySetInnerHTML={{ __html: note.content || '' }}
          />
        ) : (
          <p className={styles.preview}>
            {getPreviewText(note.content)}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.metadata}>
          <span className={styles.date}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            {formatDate(note.updatedAt)}
          </span>
          {note.createdAt && note.updatedAt && 
           formatDate(note.createdAt) !== formatDate(note.updatedAt) && (
            <span className={styles.created}>
              Created {formatDate(note.createdAt)}
            </span>
          )}
        </div>

        <div className={styles.expandToggle}>
          <Button
            variant="ghost"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            className={styles.expandButton}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </motion.svg>
          </Button>
        </div>
      </div>

      {note.content && getPreviewText(note.content).endsWith('...') && !isExpanded && (
        <div className={styles.readMore}>
          <Button variant="ghost" size="small" onClick={toggleExpanded}>
            Read more
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default NoteItem;

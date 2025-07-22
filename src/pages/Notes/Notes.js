import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import NoteItem from '../../components/NoteItem/NoteItem';
import NoteForm from '../../components/NoteForm/NoteForm';
import styles from './Notes.module.css';

const Notes = () => {
  const { currentUser } = useAuth();
  const { notes, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Get all unique tags from notes
  const allTags = [...new Set(notes.flatMap(note => note.tags || []))].sort();

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = !searchTerm || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesTag = selectedTag === 'all' || 
        (note.tags && note.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt);
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt);
          break;
        case 'updatedAt':
        default:
          aValue = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
          bValue = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleAddNote = () => {
    setEditingNote(null);
    setShowNoteForm(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleCloseForm = () => {
    setShowNoteForm(false);
    setEditingNote(null);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getTagColor = (tag) => {
    // Generate a consistent color based on the tag name
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    return colors[hash % colors.length];
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading notes..." />
      </div>
    );
  }

  return (
    <motion.div
      className={styles.notes}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Notes</h1>
          <p className={styles.subtitle}>
            Create and organize your notes with rich text and tags
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={handleAddNote}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Note
          </Button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{notes.length}</p>
          <p className={styles.statLabel}>Total Notes</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{allTags.length}</p>
          <p className={styles.statLabel}>Tags</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNumber}>{filteredNotes.length}</p>
          <p className={styles.statLabel}>Filtered Results</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Input
            type="text"
            placeholder="Search notes by title, content, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="medium"
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tag:</span>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.select}
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Title</option>
          </select>
          <Button
            variant="outline"
            size="small"
            onClick={toggleSortOrder}
            className={styles.sortToggle}
            title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {sortOrder === 'asc' ? (
                <path d="m3 8 4-4 4 4M7 4v16" />
              ) : (
                <path d="m3 16 4 4 4-4M7 20V4" />
              )}
            </svg>
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {filteredNotes.length > 0 ? (
          <div className={styles.noteGrid}>
            <AnimatePresence>
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <NoteItem
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    getTagColor={getTagColor}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <h3 className={styles.emptyTitle}>
              {searchTerm || selectedTag !== 'all' ? 'No matching notes found' : 'No notes yet'}
            </h3>
            <p className={styles.emptySubtitle}>
              {searchTerm || selectedTag !== 'all' 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first note to get started organizing your thoughts and ideas'
              }
            </p>
            {!searchTerm && selectedTag === 'all' && (
              <Button variant="primary" onClick={handleAddNote}>
                Create Your First Note
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNoteForm && (
          <NoteForm
            note={editingNote}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Notes;

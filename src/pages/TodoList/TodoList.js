import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTodos } from '../../contexts/TodosContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import TodoItem from '../../components/TodoItem/TodoItem';
import TodoForm from '../../components/TodoForm/TodoForm';
import styles from './TodoList.module.css';

// Custom hook for debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const TodoList = () => {
  const { todos, loading } = useTodos();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter and sort todos
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos.filter(todo => {
      // Search filter (using debounced search term)
      const matchesSearch = !debouncedSearchTerm || 
        todo.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      // Priority filter
      const matchesPriority = selectedPriority === 'all' || todo.priority === selectedPriority;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'completed' && todo.completed) ||
        (selectedStatus === 'pending' && !todo.completed);

      // Show completed filter
      const showThisTodo = showCompleted || !todo.completed;

      return matchesSearch && matchesPriority && matchesStatus && showThisTodo;
    });

    // Sort todos
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date objects
      if (aValue && aValue.toDate) aValue = aValue.toDate();
      if (bValue && bValue.toDate) bValue = bValue.toDate();

      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return sortOrder === 'asc' ? 1 : -1;
      if (!bValue) return sortOrder === 'asc' ? -1 : 1;

      // Compare values
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [todos, debouncedSearchTerm, selectedPriority, selectedStatus, showCompleted, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(t => {
      if (t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < new Date();
    }).length;

    return { total, completed, pending, overdue };
  }, [todos]);

  // Handle drag and drop
  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredAndSortedTodos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order in Firebase
    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        const todoRef = doc(db, 'todos', item.id);
        batch.update(todoRef, { order: index, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error reordering todos:', error);
    }
  }, [filteredAndSortedTodos]);

  // Handle todo completion
  const handleToggleComplete = useCallback(async (todoId, completed) => {
    try {
      const todoRef = doc(db, 'todos', todoId);
      await updateDoc(todoRef, {
        completed: !completed,
        completedAt: !completed ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }, []);

  // Handle todo deletion
  const handleDeleteTodo = useCallback(async (todoId) => {
    try {
      await deleteDoc(doc(db, 'todos', todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }, []);

  // Handle bulk operations
  const handleBulkDelete = async () => {
    if (selectedTodos.size === 0) return;
    
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedTodos.forEach(todoId => {
        const todoRef = doc(db, 'todos', todoId);
        batch.delete(todoRef);
      });
      await batch.commit();
      setSelectedTodos(new Set());
    } catch (error) {
      console.error('Error bulk deleting todos:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTodos.size === 0) return;
    
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedTodos.forEach(todoId => {
        const todoRef = doc(db, 'todos', todoId);
        batch.update(todoRef, {
          completed: true,
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      setSelectedTodos(new Set());
    } catch (error) {
      console.error('Error bulk completing todos:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle selection
  const handleSelectTodo = (todoId, selected) => {
    const newSelected = new Set(selectedTodos);
    if (selected) {
      newSelected.add(todoId);
    } else {
      newSelected.delete(todoId);
    }
    setSelectedTodos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === filteredAndSortedTodos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(filteredAndSortedTodos.map(t => t.id)));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading todos..." />
      </div>
    );
  }

  return (
    <div className={styles.todoList}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Todo List</h1>
          <div className={styles.stats}>
            <span className={styles.stat}>Total: {stats.total}</span>
            <span className={styles.stat}>Pending: {stats.pending}</span>
            <span className={styles.stat}>Completed: {stats.completed}</span>
            {stats.overdue > 0 && (
              <span className={`${styles.stat} ${styles.overdue}`}>
                Overdue: {stats.overdue}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className={styles.addButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Todo
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchSection}>
          <Input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterControls}>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="createdAt">Created Date</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>

          <Button
            variant="ghost"
            size="small"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={styles.sortButton}
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {sortOrder === 'asc' ? (
                <path d="M12 19V6m-7 7l7-7 7 7"/>
              ) : (
                <path d="M12 5v13m7-7l-7 7-7-7"/>
              )}
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="small"
            onClick={clearFilters}
            className={styles.clearButton}
          >
            Clear
          </Button>
        </div>

        <div className={styles.viewOptions}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className={styles.checkbox}
            />
            Show Completed
          </label>
        </div>
      </div>

      {selectedTodos.size > 0 && (
        <motion.div
          className={styles.bulkActions}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <span className={styles.bulkInfo}>
            {selectedTodos.size} todo{selectedTodos.size !== 1 ? 's' : ''} selected
          </span>
          
          <div className={styles.bulkButtons}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleBulkComplete}
              disabled={isProcessing}
            >
              Complete Selected
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? <LoadingSpinner size="small" text="" /> : 'Delete Selected'}
            </Button>
          </div>
        </motion.div>
      )}

      <div className={styles.listControls}>
        <Button
          variant="ghost"
          size="small"
          onClick={handleSelectAll}
          className={styles.selectAllButton}
        >
          {selectedTodos.size === filteredAndSortedTodos.length && filteredAndSortedTodos.length > 0 
            ? 'Deselect All' 
            : 'Select All'
          }
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todoList">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`${styles.todoItems} ${snapshot.isDraggingOver ? styles.dragging : ''}`}
            >
              <AnimatePresence>
                {filteredAndSortedTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className={`${styles.todoItemWrapper} ${snapshot.isDragging ? styles.dragging : ''}`}
                      >
                        <TodoItem
                          todo={todo}
                          selected={selectedTodos.has(todo.id)}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTodo}
                          onEdit={setEditingTodo}
                          onSelect={handleSelectTodo}
                        />
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
              
              {filteredAndSortedTodos.length === 0 && (
                <div className={styles.empty}>
                  <p>No todos found</p>
                  {(searchTerm || selectedPriority !== 'all' || selectedStatus !== 'all') ? (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setShowForm(true)}
                    >
                      Add Your First Todo
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {(showForm || editingTodo) && (
        <TodoForm
          todo={editingTodo}
          onClose={() => {
            setShowForm(false);
            setEditingTodo(null);
          }}
        />
      )}
    </div>
  );
};

export default TodoList;

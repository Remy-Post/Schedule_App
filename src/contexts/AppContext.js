import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Initial state
const initialState = {
  todos: [],
  events: [],
  reminders: [],
  notes: [],
  loading: true,
  error: null
};

// Actions
const actions = {
  SET_TODOS: 'SET_TODOS',
  SET_EVENTS: 'SET_EVENTS',
  SET_REMINDERS: 'SET_REMINDERS',
  SET_NOTES: 'SET_NOTES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TODO: 'ADD_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  ADD_REMINDER: 'ADD_REMINDER',
  UPDATE_REMINDER: 'UPDATE_REMINDER',
  DELETE_REMINDER: 'DELETE_REMINDER',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_TODOS:
      return { ...state, todos: action.payload };
    case actions.SET_EVENTS:
      return { ...state, events: action.payload };
    case actions.SET_REMINDERS:
      return { ...state, reminders: action.payload };
    case actions.SET_NOTES:
      return { ...state, notes: action.payload };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload };
    case actions.ADD_TODO:
      return { ...state, todos: [...state.todos, action.payload] };
    case actions.UPDATE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id ? action.payload : todo
        )
      };
    case actions.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };
    case actions.ADD_EVENT:
      return { ...state, events: [...state.events, action.payload] };
    case actions.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        )
      };
    case actions.DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    case actions.ADD_REMINDER:
      return { ...state, reminders: [...state.reminders, action.payload] };
    case actions.UPDATE_REMINDER:
      return {
        ...state,
        reminders: state.reminders.map(reminder =>
          reminder.id === action.payload.id ? action.payload : reminder
        )
      };
    case actions.DELETE_REMINDER:
      return {
        ...state,
        reminders: state.reminders.filter(reminder => reminder.id !== action.payload)
      };
    case actions.ADD_NOTE:
      return { ...state, notes: [...state.notes, action.payload] };
    case actions.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id ? action.payload : note
        )
      };
    case actions.DELETE_NOTE:
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload)
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { currentUser } = useAuth();

  // Set up real-time listeners for user data
  useEffect(() => {
    if (!currentUser) {
      // Reset state when user logs out
      dispatch({ type: actions.SET_TODOS, payload: [] });
      dispatch({ type: actions.SET_EVENTS, payload: [] });
      dispatch({ type: actions.SET_REMINDERS, payload: [] });
      dispatch({ type: actions.SET_NOTES, payload: [] });
      dispatch({ type: actions.SET_LOADING, payload: false });
      return;
    }

    const unsubscribes = [];

    try {
      // Listen to todos
      const todosQuery = query(
        collection(db, 'todos'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
        const todos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_TODOS, payload: todos });
      });
      unsubscribes.push(unsubscribeTodos);

      // Listen to events
      const eventsQuery = query(
        collection(db, 'events'),
        where('userId', '==', currentUser.uid),
        orderBy('startDate', 'asc')
      );
      const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_EVENTS, payload: events });
      });
      unsubscribes.push(unsubscribeEvents);

      // Listen to reminders
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('userId', '==', currentUser.uid),
        orderBy('reminderTime', 'asc')
      );
      const unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
        const reminders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_REMINDERS, payload: reminders });
      });
      unsubscribes.push(unsubscribeReminders);

      // Listen to notes
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_NOTES, payload: notes });
      });
      unsubscribes.push(unsubscribeNotes);

      dispatch({ type: actions.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: actions.SET_ERROR, payload: error.message });
      dispatch({ type: actions.SET_LOADING, payload: false });
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  const value = {
    ...state,
    dispatch,
    actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

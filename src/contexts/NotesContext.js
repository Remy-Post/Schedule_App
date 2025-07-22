import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NotesContext = createContext();

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

const initialState = {
  notes: [],
  loading: true,
  error: null
};

const actions = {
  SET_NOTES: 'SET_NOTES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE'
};

const notesReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_NOTES:
      return { ...state, notes: action.payload, loading: false };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actions.ADD_NOTE:
      return { 
        ...state, 
        notes: [action.payload, ...state.notes]
      };
    case actions.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id ? { ...note, ...action.payload } : note
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

export const NotesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      dispatch({ type: actions.SET_NOTES, payload: [] });
      return;
    }

    dispatch({ type: actions.SET_LOADING, payload: true });

    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_NOTES, payload: notes });
        dispatch({ type: actions.SET_ERROR, payload: null });
      },
      (error) => {
        console.error('Error fetching notes:', error);
        dispatch({ type: actions.SET_ERROR, payload: error.message });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const contextValue = React.useMemo(() => ({
    ...state,
    dispatch,
    actions
  }), [state]);

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
};

export { actions as noteActions };

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const TodosContext = createContext();

export const useTodos = () => {
  const context = useContext(TodosContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodosProvider');
  }
  return context;
};

// Initial state
const initialState = {
  todos: [],
  loading: true,
  error: null
};

// Actions
const actions = {
  SET_TODOS: 'SET_TODOS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TODO: 'ADD_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO'
};

// Optimized reducer with immutable updates
const todosReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_TODOS:
      return { ...state, todos: action.payload, loading: false };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actions.ADD_TODO:
      return { 
        ...state, 
        todos: [action.payload, ...state.todos] // Add to beginning for better UX
      };
    case actions.UPDATE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id ? { ...todo, ...action.payload } : todo
        )
      };
    case actions.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };
    default:
      return state;
  }
};

export const TodosProvider = ({ children }) => {
  const [state, dispatch] = useReducer(todosReducer, initialState);
  const { currentUser } = useAuth();

  // Optimized Firebase listener with error handling
  useEffect(() => {
    if (!currentUser) {
      dispatch({ type: actions.SET_TODOS, payload: [] });
      return;
    }

    dispatch({ type: actions.SET_LOADING, payload: true });

    const todosQuery = query(
      collection(db, 'todos'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      todosQuery,
      (snapshot) => {
        const todos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_TODOS, payload: todos });
        dispatch({ type: actions.SET_ERROR, payload: null });
      },
      (error) => {
        console.error('Error fetching todos:', error);
        dispatch({ type: actions.SET_ERROR, payload: error.message });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    ...state,
    dispatch,
    actions
  }), [state]);

  return (
    <TodosContext.Provider value={contextValue}>
      {children}
    </TodosContext.Provider>
  );
};

export { actions as todoActions };

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const EventsContext = createContext();

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

const initialState = {
  events: [],
  loading: true,
  error: null
};

const actions = {
  SET_EVENTS: 'SET_EVENTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT'
};

const eventsReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_EVENTS:
      return { ...state, events: action.payload, loading: false };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actions.ADD_EVENT:
      return { 
        ...state, 
        events: [action.payload, ...state.events]
      };
    case actions.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? { ...event, ...action.payload } : event
        )
      };
    case actions.DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    default:
      return state;
  }
};

export const EventsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventsReducer, initialState);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      dispatch({ type: actions.SET_EVENTS, payload: [] });
      return;
    }

    dispatch({ type: actions.SET_LOADING, payload: true });

    const eventsQuery = query(
      collection(db, 'events'),
      where('userId', '==', currentUser.uid),
      orderBy('startDate', 'asc')
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: actions.SET_EVENTS, payload: events });
        dispatch({ type: actions.SET_ERROR, payload: null });
      },
      (error) => {
        console.error('Error fetching events:', error);
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
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
};

export { actions as eventActions };

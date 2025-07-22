/**
 * Date utility functions to standardize date handling across the app
 * Handles both Firebase Timestamps and JavaScript Date objects safely
 */

import {
  format,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
} from "date-fns";

/**
 * Safely converts Firebase Timestamp or Date object to JavaScript Date
 * @param {*} dateInput - Firebase Timestamp, Date object, or date string
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
export const toJSDate = (dateInput) => {
  if (!dateInput) return null;

  try {
    // Handle Firebase Timestamp
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      return dateInput.toDate();
    }

    // Handle Date object
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }

    // Handle date string
    if (typeof dateInput === "string") {
      const parsed = parseISO(dateInput);
      return isValid(parsed) ? parsed : null;
    }

    // Handle timestamp number
    if (typeof dateInput === "number") {
      const date = new Date(dateInput);
      return isValid(date) ? date : null;
    }

    return null;
  } catch (error) {
    console.error("Error converting date:", error, dateInput);
    return null;
  }
};

/**
 * Formats a date safely with fallback
 * @param {*} dateInput - Date input to format
 * @param {string} formatString - Format string for date-fns
 * @param {string} fallback - Fallback string if date is invalid
 * @returns {string} - Formatted date string or fallback
 */
export const formatDateSafe = (
  dateInput,
  formatString = "MMM dd, yyyy",
  fallback = "Invalid Date"
) => {
  const jsDate = toJSDate(dateInput);
  if (!jsDate) return fallback;

  try {
    return format(jsDate, formatString);
  } catch (error) {
    console.error("Error formatting date:", error, dateInput);
    return fallback;
  }
};

/**
 * Formats a date and time safely
 * @param {*} dateInput - Date input to format
 * @param {boolean} includeTime - Whether to include time in format
 * @returns {string} - Formatted date/time string
 */
export const formatDateTime = (dateInput, includeTime = true) => {
  const formatString = includeTime ? "MMM dd, yyyy h:mm a" : "MMM dd, yyyy";
  return formatDateSafe(dateInput, formatString);
};

/**
 * Gets today's date range (start and end of day)
 * @returns {Object} - Object with start and end Date objects
 */
export const getTodayRange = () => {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today),
  };
};

/**
 * Checks if a date is today
 * @param {*} dateInput - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return false;

  const today = new Date();
  const dateStart = startOfDay(date);
  const todayStart = startOfDay(today);

  return dateStart.getTime() === todayStart.getTime();
};

/**
 * Checks if a date is in the past
 * @param {*} dateInput - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return false;

  return date < new Date();
};

/**
 * Checks if a date is upcoming (within next 7 days)
 * @param {*} dateInput - Date to check
 * @returns {boolean} - True if date is upcoming
 */
export const isUpcoming = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return false;

  const now = new Date();
  const weekFromNow = addDays(now, 7);

  return date >= now && date <= weekFromNow;
};

/**
 * Gets the relative time description (e.g., "2 days ago", "in 3 hours")
 * @param {*} dateInput - Date to get relative time for
 * @returns {string} - Relative time description
 */
export const getRelativeTime = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return "Invalid Date";

  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (Math.abs(diffInMinutes) < 1) {
    return "Just now";
  }

  if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0
      ? `in ${diffInMinutes}m`
      : `${Math.abs(diffInMinutes)}m ago`;
  }

  if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0
      ? `in ${diffInHours}h`
      : `${Math.abs(diffInHours)}h ago`;
  }

  if (Math.abs(diffInDays) <= 7) {
    return diffInDays > 0
      ? `in ${diffInDays}d`
      : `${Math.abs(diffInDays)}d ago`;
  }

  return formatDateSafe(date, "MMM dd, yyyy");
};

/**
 * Creates a date string suitable for HTML date inputs
 * @param {*} dateInput - Date to convert
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const toDateInputValue = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return "";

  try {
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error converting to date input value:", error, dateInput);
    return "";
  }
};

/**
 * Creates a time string suitable for HTML time inputs
 * @param {*} dateInput - Date to convert
 * @returns {string} - Time string in HH:MM format
 */
export const toTimeInputValue = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return "";

  try {
    return format(date, "HH:mm");
  } catch (error) {
    console.error("Error converting to time input value:", error, dateInput);
    return "";
  }
};

/**
 * Validates if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDateString = (dateString) => {
  if (!dateString || typeof dateString !== "string") return false;

  try {
    const date = new Date(dateString);
    return isValid(date) && !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Gets the start and end of a week for a given date
 * @param {*} dateInput - Date within the week
 * @returns {Object} - Object with start and end Date objects
 */
export const getWeekRange = (dateInput) => {
  const date = toJSDate(dateInput);
  if (!date) return null;

  const dayOfWeek = date.getDay();
  const start = subDays(date, dayOfWeek);
  const end = addDays(start, 6);

  return {
    start: startOfDay(start),
    end: endOfDay(end),
  };
};

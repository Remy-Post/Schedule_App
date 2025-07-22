/**
 * Simple, safe error logger without console overrides
 * Prevents recursion issues while still providing error tracking
 */

class SimpleErrorLogger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.maxLogSize = 50; // Reduced size to prevent memory issues
    this.setupBasicErrorHandlers();
  }

  /**
   * Set up basic error handlers without console overrides
   */
  setupBasicErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logErrorSafe("Unhandled Promise Rejection", {
        reason: event.reason?.toString() || "Unknown reason",
        timestamp: new Date().toISOString(),
      });
    });

    // Catch unhandled JavaScript errors
    window.addEventListener("error", (event) => {
      this.logErrorSafe("Unhandled JavaScript Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Safe error logging without console output to prevent recursion
   */
  logErrorSafe(type, details) {
    try {
      const errorEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        timestamp: new Date().toISOString(),
        ...details,
      };

      this.errors.push(errorEntry);

      // Limit log size
      if (this.errors.length > this.maxLogSize) {
        this.errors = this.errors.slice(-this.maxLogSize);
      }
    } catch (e) {
      // Silently fail to prevent further issues
    }
  }

  /**
   * Safe warning logging
   */
  logWarningSafe(type, details) {
    try {
      const warningEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        timestamp: new Date().toISOString(),
        ...details,
      };

      this.warnings.push(warningEntry);

      if (this.warnings.length > this.maxLogSize) {
        this.warnings = this.warnings.slice(-this.maxLogSize);
      }
    } catch (e) {
      // Silently fail to prevent further issues
    }
  }

  /**
   * Get all errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get all warnings
   */
  getWarnings() {
    return [...this.warnings];
  }

  /**
   * Clear all logs
   */
  clear() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Get error summary
   */
  getSummary() {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      lastError: this.errors[this.errors.length - 1],
      lastWarning: this.warnings[this.warnings.length - 1],
    };
  }
}

// Global simple error logger instance
const simpleErrorLogger = new SimpleErrorLogger();

/**
 * Safe Firebase error handler
 */
export const handleFirebaseErrorSafe = (
  error,
  operation = "Firebase operation"
) => {
  let userMessage = "Something went wrong. Please try again.";

  switch (error.code) {
    case "permission-denied":
      userMessage = "You do not have permission to perform this action.";
      break;
    case "not-found":
      userMessage = "The requested item was not found.";
      break;
    case "already-exists":
      userMessage = "This item already exists.";
      break;
    case "unauthenticated":
      userMessage = "Please log in to continue.";
      break;
    case "unavailable":
      userMessage =
        "Service is temporarily unavailable. Please try again later.";
      break;
    case "quota-exceeded":
      userMessage = "Service quota exceeded. Please try again later.";
      break;
    case "invalid-argument":
      userMessage = "Invalid data provided. Please check your input.";
      break;
    case "deadline-exceeded":
      userMessage = "Request timed out. Please try again.";
      break;
    default:
      userMessage = "An unexpected error occurred. Please try again.";
  }

  simpleErrorLogger.logErrorSafe("Firebase Error", {
    operation,
    code: error.code,
    message: error.message,
    userMessage,
  });

  return { userMessage, originalError: error };
};

/**
 * Hook for accessing simple error logger
 */
export const useSimpleErrorLogger = () => {
  return {
    logError: (type, details) => simpleErrorLogger.logErrorSafe(type, details),
    logWarning: (type, details) =>
      simpleErrorLogger.logWarningSafe(type, details),
    getErrors: () => simpleErrorLogger.getErrors(),
    getWarnings: () => simpleErrorLogger.getWarnings(),
    getSummary: () => simpleErrorLogger.getSummary(),
    clear: () => simpleErrorLogger.clear(),
  };
};

export { simpleErrorLogger };
export default simpleErrorLogger;

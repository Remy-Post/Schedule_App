/**
 * Error logging and console error handling utilities
 * Helps identify and track runtime errors for debugging
 */

// Store errors for debugging in development
const errorLog = [];

/**
 * Enhanced error logger with categorization and filtering
 */
export class ErrorLogger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.maxLogSize = 100;
    this.setupGlobalErrorHandlers();
  }

  /**
   * Set up global error handlers to catch unhandled errors
   */
  setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError("Unhandled Promise Rejection", {
        reason: event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      });

      // Prevent the default browser behavior
      if (process.env.NODE_ENV === "development") {
        console.error("Unhandled Promise Rejection:", event.reason);
      }
    });

    // Catch unhandled JavaScript errors
    window.addEventListener("error", (event) => {
      this.logError("Unhandled JavaScript Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // Store original console methods
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
    };

    // Console override disabled to prevent recursion issues
    // Manual error logging should be used instead of automatic console capture
  }

  /**
   * Check if a warning/error should be ignored (known non-critical issues)
   */
  isIgnorableWarning(message) {
    const ignorablePatterns = [
      /Warning: ReactDOM.render is no longer supported/,
      /Warning: componentWillReceiveProps has been renamed/,
      /Warning: componentWillMount has been renamed/,
      /Download the React DevTools/,
      /Consider adding an error boundary/,
      /React Hook useEffect has a missing dependency/,
      /React Hook useMemo has a missing dependency/,
      /validateDOMNesting/,
    ];

    return ignorablePatterns.some((pattern) => pattern.test(message));
  }

  /**
   * Internal logging method to avoid recursion
   */
  logErrorInternal(type, details) {
    const errorEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.errors.push(errorEntry);

    // Limit log size
    if (this.errors.length > this.maxLogSize) {
      this.errors = this.errors.slice(-this.maxLogSize);
    }
  }

  /**
   * Log an error with context
   */
  logError(type, details) {
    this.logErrorInternal(type, details);

    // In development, also log to console for immediate visibility
    // Use original console methods to avoid recursion
    if (process.env.NODE_ENV === "development" && this.originalConsole) {
      this.originalConsole.log(`🚨 ${type}`);
      this.originalConsole.error("Details:", details);
    }
  }

  /**
   * Log a warning
   */
  logWarning(type, details) {
    const warningEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.warnings.push(warningEntry);

    if (this.warnings.length > this.maxLogSize) {
      this.warnings = this.warnings.slice(-this.maxLogSize);
    }

    if (process.env.NODE_ENV === "development" && this.originalConsole) {
      this.originalConsole.warn(`⚠️ ${type}:`, details);
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
   * Get recent errors (last N errors)
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    return {
      errors: this.getErrors(),
      warnings: this.getWarnings(),
      exportTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Get error summary for debugging
   */
  getSummary() {
    const errorTypes = {};
    const warningTypes = {};

    this.errors.forEach((error) => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    this.warnings.forEach((warning) => {
      warningTypes[warning.type] = (warningTypes[warning.type] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorTypes,
      warningTypes,
      lastError: this.errors[this.errors.length - 1],
      lastWarning: this.warnings[this.warnings.length - 1],
    };
  }
}

// Global error logger instance
const errorLogger = new ErrorLogger();

/**
 * Common Firebase error handler
 */
export const handleFirebaseError = (
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

  errorLogger.logError("Firebase Error", {
    operation,
    code: error.code,
    message: error.message,
    stack: error.stack,
    userMessage,
  });

  return { userMessage, originalError: error };
};

/**
 * React component error handler
 */
export const handleComponentError = (error, errorInfo, componentName) => {
  errorLogger.logError("React Component Error", {
    componentName,
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Network error handler
 */
export const handleNetworkError = (error, url, method = "GET") => {
  const networkError = {
    url,
    method,
    message: error.message,
    status: error.status,
    timestamp: new Date().toISOString(),
  };

  if (error.name === "TypeError" && error.message.includes("fetch")) {
    networkError.type = "Network Error";
    networkError.userMessage =
      "Unable to connect. Please check your internet connection.";
  } else if (error.status >= 500) {
    networkError.type = "Server Error";
    networkError.userMessage = "Server error. Please try again later.";
  } else if (error.status >= 400) {
    networkError.type = "Client Error";
    networkError.userMessage = "Invalid request. Please check your input.";
  } else {
    networkError.type = "Unknown Network Error";
    networkError.userMessage = "Network error occurred. Please try again.";
  }

  errorLogger.logError(networkError.type, networkError);
  return networkError;
};

/**
 * Hook for accessing error logger in components
 */
export const useErrorLogger = () => {
  return {
    logError: (type, details) => errorLogger.logError(type, details),
    logWarning: (type, details) => errorLogger.logWarning(type, details),
    getErrors: () => errorLogger.getErrors(),
    getWarnings: () => errorLogger.getWarnings(),
    getSummary: () => errorLogger.getSummary(),
    clear: () => errorLogger.clear(),
    exportLogs: () => errorLogger.exportLogs(),
  };
};

export { errorLogger };
export default errorLogger;

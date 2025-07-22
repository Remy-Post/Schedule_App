/**
 * Rate limiting utilities for Firebase operations
 * Prevents quota exhaustion and improves app performance
 */

class RateLimiter {
  constructor() {
    this.operations = new Map();
    this.defaultLimits = {
      read: { max: 50, window: 60000 }, // 50 reads per minute
      write: { max: 20, window: 60000 }, // 20 writes per minute
      create: { max: 15, window: 60000 }, // 15 creates per minute
      update: { max: 20, window: 60000 }, // 20 updates per minute
      delete: { max: 10, window: 60000 }, // 10 deletes per minute
      batch: { max: 5, window: 60000 }, // 5 batch operations per minute
    };
  }

  /**
   * Check if operation is allowed under rate limit
   * @param {string} operationType - Type of operation (read, write, delete, batch)
   * @param {string} userId - User ID for per-user limiting
   * @param {Object} customLimits - Custom limits for specific operations
   * @returns {Object} - { allowed: boolean, retryAfter?: number }
   */
  checkLimit(operationType, userId, customLimits = {}) {
    const limits = { ...this.defaultLimits, ...customLimits };
    const limit = limits[operationType];

    if (!limit) {
      console.warn(`Unknown operation type: ${operationType}`);
      return { allowed: true };
    }

    const key = `${operationType}:${userId}`;
    const now = Date.now();

    if (!this.operations.has(key)) {
      this.operations.set(key, []);
    }

    const userOperations = this.operations.get(key);

    // Remove operations outside the time window
    const validOperations = userOperations.filter(
      (timestamp) => now - timestamp < limit.window
    );

    this.operations.set(key, validOperations);

    // Check if under limit
    if (validOperations.length < limit.max) {
      validOperations.push(now);
      return { allowed: true };
    }

    // Calculate retry after time
    const oldestOperation = Math.min(...validOperations);
    const retryAfter = Math.ceil((oldestOperation + limit.window - now) / 1000);

    return {
      allowed: false,
      retryAfter: Math.max(retryAfter, 1), // At least 1 second
    };
  }

  /**
   * Reset limits for a user (useful for testing or admin operations)
   * @param {string} userId - User ID to reset
   */
  resetUserLimits(userId) {
    const keys = Array.from(this.operations.keys()).filter((key) =>
      key.endsWith(`:${userId}`)
    );
    keys.forEach((key) => this.operations.delete(key));
  }

  /**
   * Get current usage for a user and operation type
   * @param {string} operationType - Type of operation
   * @param {string} userId - User ID
   * @returns {Object} - Usage information
   */
  getUsage(operationType, userId) {
    const limit = this.defaultLimits[operationType];
    if (!limit) return null;

    const key = `${operationType}:${userId}`;
    const now = Date.now();

    if (!this.operations.has(key)) {
      return { current: 0, max: limit.max, resetTime: now + limit.window };
    }

    const userOperations = this.operations.get(key);
    const validOperations = userOperations.filter(
      (timestamp) => now - timestamp < limit.window
    );

    const oldestOperation =
      validOperations.length > 0 ? Math.min(...validOperations) : now;

    return {
      current: validOperations.length,
      max: limit.max,
      resetTime: oldestOperation + limit.window,
    };
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Wrapper function for Firebase operations with rate limiting
 * @param {string} operationType - Type of operation
 * @param {Function} operation - Firebase operation function
 * @param {string} userId - User ID
 * @param {Object} options - Additional options
 * @returns {Promise} - Operation result or rate limit error
 */
export const withRateLimit = async (
  operationType,
  operation,
  userId,
  options = {}
) => {
  const { customLimits, onRateLimit } = options;

  const limitCheck = rateLimiter.checkLimit(
    operationType,
    userId,
    customLimits
  );

  if (!limitCheck.allowed) {
    const error = new Error(
      `Rate limit exceeded for ${operationType}. Try again in ${limitCheck.retryAfter} seconds.`
    );
    error.code = "RATE_LIMIT_EXCEEDED";
    error.retryAfter = limitCheck.retryAfter;

    if (onRateLimit) {
      onRateLimit(error);
    }

    throw error;
  }

  try {
    return await operation();
  } catch (error) {
    // If operation failed, we might want to not count it against the limit
    // depending on the error type
    if (
      error.code === "permission-denied" ||
      error.code === "unauthenticated"
    ) {
      // Don't count auth errors against rate limit
      const key = `${operationType}:${userId}`;
      const userOperations = rateLimiter.operations.get(key) || [];
      if (userOperations.length > 0) {
        userOperations.pop(); // Remove the most recent operation
      }
    }
    throw error;
  }
};

/**
 * Debounced operation wrapper to prevent rapid-fire operations
 * @param {Function} operation - Operation to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounceFirebaseOperation = (operation, delay = 500) => {
  let timeoutId;
  let lastArgs;

  return (...args) => {
    lastArgs = args;
    clearTimeout(timeoutId);

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await operation(...lastArgs);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Batch operation helper to group multiple writes
 * @param {Array} operations - Array of operation objects
 * @param {string} userId - User ID
 * @param {Object} options - Batching options
 * @returns {Promise} - Batch operation result
 */
export const batchFirebaseOperations = async (
  operations,
  userId,
  options = {}
) => {
  const { maxBatchSize = 500 } = options; // Firestore batch limit is 500

  if (operations.length === 0) return [];

  // Split into chunks if needed
  const chunks = [];
  for (let i = 0; i < operations.length; i += maxBatchSize) {
    chunks.push(operations.slice(i, i + maxBatchSize));
  }

  const results = [];

  for (const chunk of chunks) {
    const result = await withRateLimit(
      "batch",
      async () => {
        // Execute batch operations here
        // This would be implemented based on specific Firebase batch operations
        return chunk; // Placeholder
      },
      userId
    );

    results.push(...result);
  }

  return results;
};

/**
 * Get rate limiter instance for direct access
 */
export const getRateLimiter = () => rateLimiter;

/**
 * Firebase operation types enum
 */
export const FIREBASE_OPERATIONS = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  BATCH: "batch",
};

export default rateLimiter;

/**
 * Input validation and sanitization utilities
 * Helps prevent errors and security issues
 */

/**
 * Sanitizes a string by removing potentially harmful characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') return '';
  
  const {
    maxLength = 1000,
    allowHTML = false,
    trimWhitespace = true
  } = options;
  
  let sanitized = input;
  
  // Trim whitespace if requested
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  // Remove HTML tags if not allowed
  if (!allowHTML) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {Object} - Validation result with isValid and message
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (email.length > 254) {
    return { isValid: false, message: 'Email is too long' };
  }
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid, message, and strength
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required', strength: 'none' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters', strength: 'weak' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password should be at least 8 characters for better security', strength: 'weak' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteria = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
  const metCriteria = criteria.filter(Boolean).length;
  
  let strength = 'weak';
  if (metCriteria >= 3 && password.length >= 8) {
    strength = 'strong';
  } else if (metCriteria >= 2 && password.length >= 6) {
    strength = 'medium';
  }
  
  return { 
    isValid: true, 
    message: strength === 'weak' ? 'Consider using uppercase, lowercase, numbers, and special characters' : '',
    strength 
  };
};

/**
 * Validates required field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} - Validation result
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates string length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {Object} - Validation result
 */
export const validateLength = (value, minLength = 0, maxLength = Infinity, fieldName = 'Field') => {
  if (typeof value !== 'string') {
    return { isValid: false, message: `${fieldName} must be a string` };
  }
  
  const length = value.trim().length;
  
  if (length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (length > maxLength) {
    return { isValid: false, message: `${fieldName} must not exceed ${maxLength} characters` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates date input
 * @param {string} dateString - Date string to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} - Validation result
 */
export const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, message: `${fieldName} is not a valid date` };
  }
  
  // Check if date is reasonable (not too far in past or future)
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  if (dateYear < 1900 || dateYear > currentYear + 50) {
    return { isValid: false, message: `${fieldName} must be between 1900 and ${currentYear + 50}` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @param {boolean} required - Whether URL is required
 * @returns {Object} - Validation result
 */
export const validateURL = (url, required = false) => {
  if (!url || url.trim() === '') {
    if (required) {
      return { isValid: false, message: 'URL is required' };
    }
    return { isValid: true, message: '' };
  }
  
  try {
    new URL(url.trim());
    return { isValid: true, message: '' };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
};

/**
 * Validates form data against a schema
 * @param {Object} formData - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation results with errors object and isValid boolean
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(schema).forEach(fieldName => {
    const fieldValue = formData[fieldName];
    const fieldRules = schema[fieldName];
    
    for (const rule of fieldRules) {
      const result = rule.validator(fieldValue, fieldName);
      if (!result.isValid) {
        errors[fieldName] = result.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });
  
  return { errors, isValid };
};

/**
 * Common validation schemas for different forms
 */
export const validationSchemas = {
  // Todo form validation
  todo: {
    title: [
      { validator: (val) => validateRequired(val, 'Title') },
      { validator: (val) => validateLength(val, 1, 200, 'Title') }
    ],
    description: [
      { validator: (val) => validateLength(val || '', 0, 1000, 'Description') }
    ]
  },
  
  // Event form validation
  event: {
    title: [
      { validator: (val) => validateRequired(val, 'Title') },
      { validator: (val) => validateLength(val, 1, 200, 'Title') }
    ],
    description: [
      { validator: (val) => validateLength(val || '', 0, 2000, 'Description') }
    ],
    location: [
      { validator: (val) => validateLength(val || '', 0, 500, 'Location') }
    ],
    startDate: [
      { validator: (val) => validateRequired(val, 'Start date') },
      { validator: (val) => validateDate(val, 'Start date') }
    ],
    endDate: [
      { validator: (val) => validateRequired(val, 'End date') },
      { validator: (val) => validateDate(val, 'End date') }
    ]
  },
  
  // Note form validation
  note: {
    title: [
      { validator: (val) => validateRequired(val, 'Title') },
      { validator: (val) => validateLength(val, 1, 200, 'Title') }
    ],
    content: [
      { validator: (val) => validateRequired(val, 'Content') },
      { validator: (val) => validateLength(val, 1, 10000, 'Content') }
    ]
  },
  
  // User profile validation
  profile: {
    displayName: [
      { validator: (val) => validateLength(val || '', 0, 100, 'Display name') }
    ],
    email: [
      { validator: (val) => validateRequired(val, 'Email') },
      { validator: validateEmail }
    ]
  },
  
  // Login form validation
  login: {
    email: [
      { validator: (val) => validateRequired(val, 'Email') },
      { validator: validateEmail }
    ],
    password: [
      { validator: (val) => validateRequired(val, 'Password') }
    ]
  },
  
  // Registration form validation
  register: {
    email: [
      { validator: (val) => validateRequired(val, 'Email') },
      { validator: validateEmail }
    ],
    password: [
      { validator: (val) => validateRequired(val, 'Password') },
      { validator: validatePassword }
    ],
    displayName: [
      { validator: (val) => validateRequired(val, 'Display name') },
      { validator: (val) => validateLength(val, 2, 100, 'Display name') }
    ]
  }
};

/**
 * Debounce function to limit validation calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

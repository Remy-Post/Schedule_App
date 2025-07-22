import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error = '',
  label = '',
  size = 'medium',
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const inputClasses = [
    styles.input,
    styles[size],
    fullWidth && styles.fullWidth,
    error && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const inputId = `input-${name || Date.now()}`;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-label="required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <div
          id={`${inputId}-error`}
          className={styles.errorMessage}
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

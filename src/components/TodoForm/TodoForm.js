import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import {
  validateForm,
  validationSchemas,
  sanitizeString,
} from "../../utils/validation";
import { useNotification } from "../Notification/Notification";
import Button from "../Button/Button";
import Input from "../Input/Input";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import styles from "./TodoForm.module.css";

const TodoForm = ({ todo, onClose }) => {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    dueTime: "",
  });

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || "",
        description: todo.description || "",
        priority: todo.priority || "medium",
        dueDate: todo.dueDate || "",
        dueTime: todo.dueTime || "",
      });
    }
  }, [todo]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Sanitize input
    const sanitizedValue = sanitizeString(value, {
      maxLength: name === "title" ? 200 : 1000,
      allowHTML: false,
      trimWhitespace: false, // Keep whitespace during typing
    });

    setFormData({
      ...formData,
      [name]: sanitizedValue,
    });

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validationResult = validateForm(formData, validationSchemas.todo);

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      showError("Validation Error", "Please fix the errors below");
      return;
    }

    // Clear any existing errors
    setErrors({});

    setLoading(true);
    try {
      const todoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        dueTime: formData.dueTime || null,
        updatedAt: serverTimestamp(),
      };

      // Apply rate limiting
      const { withRateLimit } = await import("../../utils/rateLimiter");

      await withRateLimit(
        todo ? "update" : "create",
        async () => {
          if (todo) {
            // Update existing todo
            const todoRef = doc(db, "todos", todo.id);
            await updateDoc(todoRef, todoData);
          } else {
            // Create new todo
            await addDoc(collection(db, "todos"), {
              ...todoData,
              userId: currentUser.uid,
              completed: false,
              createdAt: serverTimestamp(),
              completedAt: null,
              order: Date.now(), // Simple ordering system
            });
          }
        },
        currentUser.uid,
        {
          onRateLimit: () => {
            setErrors({
              general:
                "Too many requests. Please wait a moment before trying again.",
            });
          },
        }
      );

      onClose();
    } catch (error) {
      console.error("Error saving todo:", error);
      if (error.message.includes("rate limit")) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: "Failed to save todo. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-form-title"
      >
        <motion.div
          className={styles.modal}
          variants={contentVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 id="todo-form-title" className={styles.title}>
              {todo ? "Edit Todo" : "Add New Todo"}
            </h2>
            <Button
              variant="ghost"
              size="small"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>

          {errors.general && (
            <div className={styles.error} role="alert">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="text"
              name="title"
              label="Title"
              placeholder="Enter todo title..."
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              required
              autoFocus
            />

            <div className={styles.textareaContainer}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Enter description (optional)..."
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                className={styles.textarea}
                rows={4}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.selectContainer}>
                <label htmlFor="priority" className={styles.label}>
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.select}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <Input
                type="date"
                name="dueDate"
                label="Due Date (Optional)"
                value={formData.dueDate}
                onChange={handleChange}
                disabled={loading}
                size="medium"
              />
            </div>

            {formData.dueDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  type="time"
                  name="dueTime"
                  label="Due Time (Optional)"
                  value={formData.dueTime}
                  onChange={handleChange}
                  disabled={loading}
                />
              </motion.div>
            )}

            <div className={styles.actions}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <LoadingSpinner size="small" text="" />
                ) : todo ? (
                  "Update Todo"
                ) : (
                  "Add Todo"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TodoForm;

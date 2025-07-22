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
import Button from "../Button/Button";
import Input from "../Input/Input";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import styles from "./ReminderForm.module.css";

const ReminderForm = ({ reminder, todos, events, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "",
    linkedType: "none", // none, todo, event
    linkedTodoId: "",
    linkedEventId: "",
  });

  useEffect(() => {
    if (reminder) {
      const reminderTime = new Date(
        reminder.reminderTime.toDate?.() || reminder.reminderTime
      );

      setFormData({
        title: reminder.title || "",
        description: reminder.description || "",
        reminderDate: reminderTime.toISOString().split("T")[0],
        reminderTime: reminderTime.toTimeString().slice(0, 5),
        linkedType: reminder.linkedTodoId
          ? "todo"
          : reminder.linkedEventId
          ? "event"
          : "none",
        linkedTodoId: reminder.linkedTodoId || "",
        linkedEventId: reminder.linkedEventId || "",
      });
    } else {
      // Set default time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);

      setFormData((prev) => ({
        ...prev,
        reminderDate: defaultTime.toISOString().split("T")[0],
        reminderTime: defaultTime.toTimeString().slice(0, 5),
      }));
    }
  }, [reminder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");

    // Clear linked IDs when type changes
    if (name === "linkedType") {
      setFormData((prev) => ({
        ...prev,
        linkedTodoId: "",
        linkedEventId: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.reminderDate || !formData.reminderTime) {
      setError("Reminder date and time are required");
      return;
    }

    const reminderDateTime = new Date(
      `${formData.reminderDate}T${formData.reminderTime}`
    );
    if (reminderDateTime <= new Date()) {
      setError("Reminder time must be in the future");
      return;
    }

    setLoading(true);
    try {
      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        reminderTime: reminderDateTime,
        linkedTodoId:
          formData.linkedType === "todo" ? formData.linkedTodoId : null,
        linkedEventId:
          formData.linkedType === "event" ? formData.linkedEventId : null,
        updatedAt: serverTimestamp(),
      };

      // Apply rate limiting
      const { withRateLimit } = await import("../../utils/rateLimiter");

      await withRateLimit(
        reminder ? "update" : "create",
        async () => {
          if (reminder) {
            // Update existing reminder
            const reminderRef = doc(db, "reminders", reminder.id);
            await updateDoc(reminderRef, reminderData);
          } else {
            // Create new reminder
            await addDoc(collection(db, "reminders"), {
              ...reminderData,
              userId: currentUser.uid,
              completed: false,
              createdAt: serverTimestamp(),
              completedAt: null,
            });
          }
        },
        currentUser.uid,
        {
          onRateLimit: () => {
            setError(
              "Too many requests. Please wait a moment before trying again."
            );
          },
        }
      );

      onClose();
    } catch (error) {
      console.error("Error saving reminder:", error);
      if (error.message.includes("rate limit")) {
        setError(error.message);
      } else {
        setError("Failed to save reminder. Please try again.");
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
        aria-labelledby="reminder-form-title"
      >
        <motion.div
          className={styles.modal}
          variants={contentVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 id="reminder-form-title" className={styles.title}>
              {reminder ? "Edit Reminder" : "Add New Reminder"}
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

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="text"
              name="title"
              label="Reminder Title"
              placeholder="Enter reminder title..."
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
                placeholder="Enter reminder description (optional)..."
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.dateTimeRow}>
              <Input
                type="date"
                name="reminderDate"
                label="Reminder Date"
                value={formData.reminderDate}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <Input
                type="time"
                name="reminderTime"
                label="Reminder Time"
                value={formData.reminderTime}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.linkingSection}>
              <div className={styles.selectContainer}>
                <label htmlFor="linkedType" className={styles.label}>
                  Link to Task or Event (Optional)
                </label>
                <select
                  id="linkedType"
                  name="linkedType"
                  value={formData.linkedType}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.select}
                >
                  <option value="none">No Link</option>
                  <option value="todo">Link to Todo</option>
                  <option value="event">Link to Event</option>
                </select>
              </div>

              {formData.linkedType === "todo" && (
                <motion.div
                  className={styles.selectContainer}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="linkedTodoId" className={styles.label}>
                    Select Todo
                  </label>
                  <select
                    id="linkedTodoId"
                    name="linkedTodoId"
                    value={formData.linkedTodoId}
                    onChange={handleChange}
                    disabled={loading}
                    className={styles.select}
                    required
                  >
                    <option value="">Select a todo...</option>
                    {todos
                      .filter((todo) => !todo.completed)
                      .map((todo) => (
                        <option key={todo.id} value={todo.id}>
                          {todo.title}
                        </option>
                      ))}
                  </select>
                </motion.div>
              )}

              {formData.linkedType === "event" && (
                <motion.div
                  className={styles.selectContainer}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="linkedEventId" className={styles.label}>
                    Select Event
                  </label>
                  <select
                    id="linkedEventId"
                    name="linkedEventId"
                    value={formData.linkedEventId}
                    onChange={handleChange}
                    disabled={loading}
                    className={styles.select}
                    required
                  >
                    <option value="">Select an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} -{" "}
                        {new Date(
                          event.startDate.toDate?.() || event.startDate
                        ).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </div>

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
                ) : reminder ? (
                  "Update Reminder"
                ) : (
                  "Create Reminder"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReminderForm;

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../Button/Button";
import Input from "../Input/Input";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import styles from "./QuickAddModal.module.css";

const QuickAddModal = ({ type, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const baseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Apply rate limiting
      const { withRateLimit } = await import("../../utils/rateLimiter");

      await withRateLimit(
        "create",
        async () => {
          if (type === "todo") {
            const todoData = {
              ...baseData,
              completed: false,
              priority: formData.priority,
              dueDate: formData.dueDate || null,
              completedAt: null,
            };
            await addDoc(collection(db, "todos"), todoData);
          } else if (type === "event") {
            if (!formData.startDate || !formData.startTime) {
              setError("Start date and time are required for events");
              return;
            }

            const startDateTime = new Date(
              `${formData.startDate}T${formData.startTime}`
            );
            let endDateTime = startDateTime;

            if (formData.endDate && formData.endTime) {
              endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
            } else if (formData.endTime) {
              endDateTime = new Date(
                `${formData.startDate}T${formData.endTime}`
              );
            } else {
              // Default to 1 hour duration
              endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
            }

            const eventData = {
              ...baseData,
              startDate: startDateTime,
              endDate: endDateTime,
              allDay: false,
            };
            await addDoc(collection(db, "events"), eventData);
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
      console.error("Error adding item:", error);
      if (error.message.includes("rate limit")) {
        setError(error.message);
      } else {
        setError("Failed to add item. Please try again.");
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
        aria-labelledby="quick-add-title"
      >
        <motion.div
          className={styles.modal}
          variants={contentVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 id="quick-add-title" className={styles.title}>
              Add New {type === "todo" ? "Task" : "Event"}
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
              label="Title"
              placeholder={`Enter ${type} title...`}
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
                rows={3}
              />
            </div>

            {type === "todo" && (
              <>
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <Input
                  type="date"
                  name="dueDate"
                  label="Due Date (Optional)"
                  value={formData.dueDate}
                  onChange={handleChange}
                  disabled={loading}
                />
              </>
            )}

            {type === "event" && (
              <div className={styles.eventFields}>
                <div className={styles.dateTimeRow}>
                  <Input
                    type="date"
                    name="startDate"
                    label="Start Date"
                    value={formData.startDate}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Input
                    type="time"
                    name="startTime"
                    label="Start Time"
                    value={formData.startTime}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className={styles.dateTimeRow}>
                  <Input
                    type="date"
                    name="endDate"
                    label="End Date (Optional)"
                    value={formData.endDate}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Input
                    type="time"
                    name="endTime"
                    label="End Time (Optional)"
                    value={formData.endTime}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
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
                ) : (
                  `Add ${type === "todo" ? "Task" : "Event"}`
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickAddModal;

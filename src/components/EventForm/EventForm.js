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
  toJSDate,
  toDateInputValue,
  toTimeInputValue,
  isValidDateString,
} from "../../utils/dateUtils";
import {
  validateForm,
  validationSchemas,
  sanitizeString,
} from "../../utils/validation";
import { useNotification } from "../Notification/Notification";
import Button from "../Button/Button";
import Input from "../Input/Input";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import styles from "./EventForm.module.css";

const EventForm = ({ event, initialDate, onClose }) => {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
  });

  useEffect(() => {
    if (event) {
      const startDate = toJSDate(event.startDate);
      const endDate = toJSDate(event.endDate);

      setFormData({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split("T")[0],
        endTime: endDate.toTimeString().slice(0, 5),
        allDay: event.allDay || false,
      });
    } else if (initialDate) {
      const dateString = initialDate.toISOString().split("T")[0];
      const defaultStartTime = "09:00";
      const defaultEndTime = "10:00";

      setFormData((prev) => ({
        ...prev,
        startDate: dateString,
        endDate: dateString,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
      }));
    }
  }, [event, initialDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors.general) setErrors((prev) => ({ ...prev, general: "" }));

    // Auto-adjust end date/time when start changes
    if (name === "startDate" && !formData.endDate) {
      setFormData((prev) => ({
        ...prev,
        endDate: value,
      }));
    }

    if (name === "startTime" && !formData.endTime) {
      // Set end time to 1 hour after start time
      const [hours, minutes] = value.split(":");
      const endHour = (parseInt(hours) + 1).toString().padStart(2, "0");
      setFormData((prev) => ({
        ...prev,
        endTime: `${endHour}:${minutes}`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrors({ general: "Title is required" });
      return;
    }

    if (!formData.allDay) {
      if (!formData.startDate || !formData.startTime) {
        setErrors({ general: "Start date and time are required" });
        return;
      }

      if (!formData.endDate || !formData.endTime) {
        setErrors({ general: "End date and time are required" });
        return;
      }
    } else if (!formData.startDate) {
      setErrors({ general: "Date is required" });
      return;
    }

    setLoading(true);
    try {
      let startDateTime, endDateTime;

      if (formData.allDay) {
        startDateTime = new Date(formData.startDate + "T00:00:00");
        endDateTime = new Date(
          (formData.endDate || formData.startDate) + "T23:59:59"
        );
      } else {
        startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      }

      if (endDateTime <= startDateTime) {
        setErrors({ general: "End date/time must be after start date/time" });
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: formData.allDay,
        updatedAt: serverTimestamp(),
      };

      // Apply rate limiting
      const { withRateLimit } = await import("../../utils/rateLimiter");

      await withRateLimit(
        event ? "update" : "create",
        async () => {
          if (event) {
            // Update existing event
            const eventRef = doc(db, "events", event.id);
            await updateDoc(eventRef, eventData);
          } else {
            // Create new event
            await addDoc(collection(db, "events"), {
              ...eventData,
              userId: currentUser.uid,
              createdAt: serverTimestamp(),
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
      console.error("Error saving event:", error);
      if (error.message.includes("rate limit")) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: "Failed to save event. Please try again." });
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
        aria-labelledby="event-form-title"
      >
        <motion.div
          className={styles.modal}
          variants={contentVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 id="event-form-title" className={styles.title}>
              {event ? "Edit Event" : "Add New Event"}
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
              label="Event Title"
              placeholder="Enter event title..."
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
                placeholder="Enter event description (optional)..."
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                className={styles.textarea}
                rows={4}
              />
            </div>

            <Input
              type="text"
              name="location"
              label="Location (Optional)"
              placeholder="Enter event location..."
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
            />

            <div className={styles.allDayContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="allDay"
                  checked={formData.allDay}
                  onChange={handleChange}
                  disabled={loading}
                  className={styles.checkbox}
                />
                All Day Event
              </label>
            </div>

            {!formData.allDay ? (
              <>
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
                    label="End Date"
                    value={formData.endDate}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <Input
                    type="time"
                    name="endTime"
                    label="End Time"
                    value={formData.endTime}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </>
            ) : (
              <div className={styles.dateTimeRow}>
                <Input
                  type="date"
                  name="startDate"
                  label="Date"
                  value={formData.startDate}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <Input
                  type="date"
                  name="endDate"
                  label="End Date (Optional)"
                  value={formData.endDate}
                  onChange={handleChange}
                  disabled={loading}
                />
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
                ) : event ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventForm;

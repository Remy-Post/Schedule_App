import React, { useState, useEffect, useMemo } from "react";
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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styles from "./NoteForm.module.css";

const NoteForm = ({ note, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || "",
        content: note.content || "",
        tags: note.tags || [],
      });
    }
  }, [note]);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "blockquote",
    "code-block",
    "link",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));

    if (error) setError("");
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (
      e.key === "Backspace" &&
      tagInput === "" &&
      formData.tags.length > 0
    ) {
      removeTag(formData.tags.length - 1);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput("");
  };

  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    // Strip HTML tags to check if content is actually empty
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = formData.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    if (!textContent.trim()) {
      setError("Content is required");
      return;
    }

    setLoading(true);
    try {
      const noteData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        updatedAt: serverTimestamp(),
      };

      // Apply rate limiting
      const { withRateLimit } = await import("../../utils/rateLimiter");

      await withRateLimit(
        note ? "update" : "create",
        async () => {
          if (note) {
            // Update existing note
            const noteRef = doc(db, "notes", note.id);
            await updateDoc(noteRef, noteData);
          } else {
            // Create new note
            await addDoc(collection(db, "notes"), {
              ...noteData,
              userId: currentUser.uid,
              createdAt: serverTimestamp(),
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
      console.error("Error saving note:", error);
      if (error.message.includes("rate limit")) {
        setError(error.message);
      } else {
        setError("Failed to save note. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (tag) => {
    // Generate a consistent color based on the tag name
    const hash = tag
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
      "#f97316",
      "#84cc16",
      "#ec4899",
      "#6366f1",
    ];
    return colors[hash % colors.length];
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
        aria-labelledby="note-form-title"
      >
        <motion.div
          className={styles.modal}
          variants={contentVariants}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 id="note-form-title" className={styles.title}>
              {note ? "Edit Note" : "Create New Note"}
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
              label="Note Title"
              placeholder="Enter note title..."
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              required
              autoFocus
            />

            <div className={styles.tagsSection}>
              <label className={styles.label}>Tags</label>
              <div className={styles.tagsContainer}>
                <div className={styles.tagsList}>
                  {formData.tags.map((tag, index) => (
                    <motion.span
                      key={`${tag}-${index}`}
                      className={styles.tag}
                      style={{
                        backgroundColor: getTagColor(tag) + "20",
                        borderColor: getTagColor(tag) + "40",
                        color: getTagColor(tag),
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className={styles.tagRemove}
                        aria-label={`Remove ${tag} tag`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </motion.span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={addTag}
                    placeholder="Add tags..."
                    className={styles.tagInput}
                    disabled={loading}
                  />
                </div>
                <p className={styles.tagsHelp}>
                  Press Enter or comma to add tags. Click on tags to remove
                  them.
                </p>
              </div>
            </div>

            <div className={styles.editorSection}>
              <label className={styles.label}>Content</label>
              <div className={styles.editorContainer}>
                <ReactQuill
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your note content here..."
                  theme="snow"
                  readOnly={loading}
                />
              </div>
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
                ) : note ? (
                  "Update Note"
                ) : (
                  "Create Note"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NoteForm;

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useErrorLogger } from "../../utils/errorLogger";
import Button from "../Button/Button";
import styles from "./ErrorSummary.module.css";

/**
 * Development-only component to display error summary and logs
 * Helps developers identify and debug issues
 */
const ErrorSummary = () => {
  const { getErrors, getWarnings, getSummary, clear, exportLogs } =
    useErrorLogger();
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return;

    const updateData = () => {
      setSummary(getSummary());
      setErrors(getErrors());
      setWarnings(getWarnings());
    };

    updateData();

    // Update every 5 seconds
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, [getSummary, getErrors, getWarnings]);

  // Don't render in production
  if (process.env.NODE_ENV !== "development") return null;

  const handleExport = () => {
    const logs = exportLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clear();
    setSummary(null);
    setErrors([]);
    setWarnings([]);
  };

  const hasIssues =
    summary && (summary.totalErrors > 0 || summary.totalWarnings > 0);

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        className={`${styles.toggleButton} ${
          hasIssues ? styles.hasIssues : ""
        }`}
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={`Error Summary (${summary?.totalErrors || 0} errors, ${
          summary?.totalWarnings || 0
        } warnings)`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {hasIssues && (
          <span className={styles.badge}>
            {summary.totalErrors + summary.totalWarnings}
          </span>
        )}
      </motion.button>

      {/* Error summary panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.header}>
              <h3>Error Summary</h3>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>

            <div className={styles.content}>
              {summary ? (
                <>
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={styles.statNumber}>
                        {summary.totalErrors}
                      </span>
                      <span className={styles.statLabel}>Errors</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statNumber}>
                        {summary.totalWarnings}
                      </span>
                      <span className={styles.statLabel}>Warnings</span>
                    </div>
                  </div>

                  {summary.totalErrors > 0 && (
                    <div className={styles.section}>
                      <h4>Recent Errors</h4>
                      <div className={styles.logList}>
                        {errors.slice(-5).map((error) => (
                          <div key={error.id} className={styles.logItem}>
                            <div className={styles.logType}>{error.type}</div>
                            <div className={styles.logMessage}>
                              {error.message || error.reason || "Unknown error"}
                            </div>
                            <div className={styles.logTime}>
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.totalWarnings > 0 && (
                    <div className={styles.section}>
                      <h4>Recent Warnings</h4>
                      <div className={styles.logList}>
                        {warnings.slice(-3).map((warning) => (
                          <div key={warning.id} className={styles.logItem}>
                            <div className={styles.logType}>{warning.type}</div>
                            <div className={styles.logMessage}>
                              {warning.message || "Unknown warning"}
                            </div>
                            <div className={styles.logTime}>
                              {new Date(warning.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.actions}>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleExport}
                      disabled={!hasIssues}
                    >
                      Export Logs
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleClear}
                      disabled={!hasIssues}
                    >
                      Clear All
                    </Button>
                  </div>
                </>
              ) : (
                <div className={styles.noIssues}>
                  <p>No errors or warnings detected</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ErrorSummary;

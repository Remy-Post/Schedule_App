import { useState, useEffect } from "react";

/**
 * Hook to detect online/offline status and provide utilities
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current status
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // User came back online after being offline
        setWasOffline(false);
        // Dispatch custom event for components that need to know
        window.dispatchEvent(new CustomEvent("app:back-online"));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      // Dispatch custom event for components that need to know
      window.dispatchEvent(new CustomEvent("app:went-offline"));
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Additional check with a test request (more reliable than navigator.onLine)
    const checkOnlineStatus = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        // Try to fetch a small resource from the public folder
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch("/manifest.json?" + Date.now(), {
          method: "HEAD",
          cache: "no-cache",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsOnline(response.ok && response.status < 400);
      } catch (error) {
        // Don't log this as it's expected when offline
        setIsOnline(false);
      }
    };

    // Check status immediately
    checkOnlineStatus();

    // Check status periodically when offline
    const interval = setInterval(() => {
      if (!navigator.onLine || !isOnline) {
        checkOnlineStatus();
      }
    }, 10000); // Check every 10 seconds when offline

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  };
};

/**
 * Hook for handling Firebase operations with offline support
 */
export const useFirebaseWithOfflineSupport = () => {
  const { isOnline, isOffline } = useOnlineStatus();
  const [pendingOperations, setPendingOperations] = useState([]);

  // Queue operation when offline
  const queueOperation = (operation) => {
    if (isOffline) {
      setPendingOperations((prev) => [
        ...prev,
        {
          ...operation,
          timestamp: Date.now(),
          id: Math.random().toString(36).substr(2, 9),
        },
      ]);
      return false; // Indicates operation was queued
    }
    return true; // Indicates operation can proceed
  };

  // Execute pending operations when back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      const executePendingOperations = async () => {
        const operations = [...pendingOperations];
        setPendingOperations([]);

        for (const operation of operations) {
          try {
            await operation.execute();
            console.log(`Executed queued operation: ${operation.type}`);
          } catch (error) {
            console.error(
              `Failed to execute queued operation: ${operation.type}`,
              error
            );
            // Could re-queue failed operations or show error to user
          }
        }
      };

      // Small delay to ensure connection is stable
      setTimeout(executePendingOperations, 1000);
    }
  }, [isOnline, pendingOperations]);

  const executeWithOfflineSupport = async (operationConfig) => {
    const { type, execute, fallback, onOffline } = operationConfig;

    if (isOffline) {
      // Handle offline scenario
      if (onOffline) {
        onOffline();
      }

      if (fallback) {
        return fallback();
      }

      // Queue for later execution
      queueOperation({ type, execute });
      throw new Error("Operation queued due to offline status");
    }

    // Execute immediately when online
    try {
      return await execute();
    } catch (error) {
      // If error might be due to connectivity, queue operation
      if (error.code === "unavailable" || error.message.includes("network")) {
        queueOperation({ type, execute });
        throw new Error("Operation queued due to network error");
      }
      throw error;
    }
  };

  return {
    isOnline,
    isOffline,
    pendingOperations,
    executeWithOfflineSupport,
    queueOperation,
  };
};

export default useOnlineStatus;

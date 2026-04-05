/**
 * useMemoryEvents.js
 * React hook for subscribing to realtime memory events with optional filtering
 */

import { useEffect, useState } from "react";
import { subscribeToMemoryEvents } from "./memory-service";

/**
 * Hook: useMemoryEvents
 * @param {string} userId - The ID of the user whose memory events to subscribe to
 * @param {Object} options - Optional filter configuration
 * @param {Array<string>} options.types - Array of event types to include (e.g., ["conversation", "governance"])
 * @returns {Array} events - Array of realtime events { type, payload }
 */
export function useMemoryEvents(userId, options = {}) {
  const [events, setEvents] = useState([]);
  const { types } = options;

  useEffect(() => {
    if (!userId) return;

    const handleEvent = (type, payload) => {
      // Apply filtering if types are specified
      if (!types || types.includes(type)) {
        setEvents((prev) => [...prev, { type, payload }]);
      }
    };

    // Subscribe to realtime events
    const subscription = subscribeToMemoryEvents(userId, handleEvent);

    // Cleanup on unmount
    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [userId, types]);

  return events;
}

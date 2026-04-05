import { useEffect, useState } from "react";
import { subscribeToMemoryEvents } from "./memory-service";

/**
 * Hook: useMemoryEvents
 * @param {string} userId - The ID of the user whose memory events to subscribe to
 * @param {Object} options - Optional filter configuration
 * @param {Array<string>} options.types - Array of event types to include
 * @returns {Array} events - Array of realtime events { type, payload }
 */
export function useMemoryEvents(userId, options = {}) {
  const [events, setEvents] = useState([]);
  const { types } = options;

  useEffect(() => {
    if (!userId) return;

    // Initial diagnostic
    setEvents((prev) => [
      ...prev,
      { type: "system", payload: { status: "Connecting to Supabase…" } },
    ]);

    const handleEvent = (type, payload) => {
      if (!types || types.includes(type)) {
        setEvents((prev) => [...prev, { type, payload }]);
      }
    };

    try {
      const subscription = subscribeToMemoryEvents(userId, handleEvent);

      setEvents((prev) => [
        ...prev,
        { type: "system", payload: { status: "Connected ✅" } },
      ]);

      // Cleanup
      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
          setEvents((prev) => [
            ...prev,
            { type: "system", payload: { status: "Disconnected ❌" } },
          ]);
        }
      };
    } catch (err) {
      setEvents((prev) => [
        ...prev,
        { type: "system", payload: { status: "Error", details: err.message } },
      ]);
    }
  }, [userId, types]);

  return events;
}

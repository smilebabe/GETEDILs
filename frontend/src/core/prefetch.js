import { useEffect, useState } from "react";
import { prefetchAll } from "../core/prefetch";
import { registry } from "./Registry";

/**
 * usePrefetch
 * React hook to load governance pillars, tutor lessons, and user states.
 * Features:
 * - SWR caching
 * - Real-time subscriptions via Registry
 * - Role-based mutations delegated to Registry
 *
 * @param {string} userId - UUID of the user
 * @param {string} role - 'admin' or 'user'
 * @returns {object} { data, loading, error, pillars, lessons, states, addLesson, updateState, removeState, addPillar }
 */
export function usePrefetch(userId, role = "user") {
  const [data, setData] = useState({ pillars: [], lessons: [], states: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load with SWR
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const result = await prefetchAll(userId, (fresh) => {
          if (mounted) setData(fresh);
        });
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        console.error("usePrefetch error:", err);
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Real-time subscriptions via Registry
  useEffect(() => {
    const offStates = registry.on("governance_states", (payload) => {
      setData((prev) => {
        let updated = [...prev.states];
        if (payload.eventType === "INSERT") updated.push(payload.new);
        if (payload.eventType === "UPDATE")
          updated = updated.map((s) => (s.id === payload.new.id ? payload.new : s));
        if (payload.eventType === "DELETE")
          updated = updated.filter((s) => s.id !== payload.old.id);
        return { ...prev, states: updated };
      });
    });

    const offLessons = registry.on("tutor_lessons", (payload) => {
      setData((prev) => {
        let updated = [...prev.lessons];
        if (payload.eventType === "INSERT") updated.push(payload.new);
        if (payload.eventType === "UPDATE")
          updated = updated.map((l) => (l.id === payload.new.id ? payload.new : l));
        if (payload.eventType === "DELETE")
          updated = updated.filter((l) => l.id !== payload.old.id);
        return { ...prev, lessons: updated };
      });
    });

    const offPillars = registry.on("governance_pillars", (payload) => {
      setData((prev) => {
        let updated = [...prev.pillars];
        if (payload.eventType === "INSERT") updated.push(payload.new);
        if (payload.eventType === "UPDATE")
          updated = updated.map((p) => (p.id === payload.new.id ? payload.new : p));
        if (payload.eventType === "DELETE")
          updated = updated.filter((p) => p.id !== payload.old.id);
        return { ...prev, pillars: updated };
      });
    });

    return () => {
      offStates();
      offLessons();
      offPillars();
    };
  }, []);

  /**
   * Mutation helpers (delegated to Registry)
   */
  async function addLesson(subject, step, question, answer) {
    return registry.addLesson(subject, step, question, answer, role);
  }

  async function updateState(stateId, newState) {
    return registry.updateState(stateId, newState, userId, role);
  }

  async function removeState(stateId) {
    return registry.removeState(stateId, userId, role);
  }

  async function addPillar(name, description) {
    return registry.addPillar(name, description, role);
  }

  return {
    data,
    loading,
    error,
    pillars: data.pillars,
    lessons: data.lessons,
    states: data.states,
    addLesson,
    updateState,
    removeState,
    addPillar,
  };
}

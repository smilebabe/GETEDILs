import { useEffect, useState } from "react";
import { prefetchAll } from "../core/prefetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * usePrefetch
 * React hook to load governance pillars, tutor lessons, and user states.
 * Implements stale-while-revalidate (SWR), background refresh, role-based mutations,
 * and real-time subscriptions via Supabase Realtime.
 *
 * @param {string} userId - UUID of the user
 * @param {string} role - 'admin' or 'user'
 * @returns {object} { data, loading, error, pillars, lessons, states, addLesson, updateState, removeState }
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

  // Real-time subscriptions
  useEffect(() => {
    // Governance states subscription
    const statesChannel = supabase
      .channel("states-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "governance_states" },
        (payload) => {
          setData((prev) => {
            let updatedStates = [...prev.states];
            if (payload.eventType === "INSERT") {
              updatedStates.push(payload.new);
            } else if (payload.eventType === "UPDATE") {
              updatedStates = updatedStates.map((s) =>
                s.id === payload.new.id ? payload.new : s
              );
            } else if (payload.eventType === "DELETE") {
              updatedStates = updatedStates.filter((s) => s.id !== payload.old.id);
            }
            return { ...prev, states: updatedStates };
          });
        }
      )
      .subscribe();

    // Tutor lessons subscription
    const lessonsChannel = supabase
      .channel("lessons-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tutor_lessons" },
        (payload) => {
          setData((prev) => {
            let updatedLessons = [...prev.lessons];
            if (payload.eventType === "INSERT") {
              updatedLessons.push(payload.new);
            } else if (payload.eventType === "UPDATE") {
              updatedLessons = updatedLessons.map((l) =>
                l.id === payload.new.id ? payload.new : l
              );
            } else if (payload.eventType === "DELETE") {
              updatedLessons = updatedLessons.filter((l) => l.id !== payload.old.id);
            }
            return { ...prev, lessons: updatedLessons };
          });
        }
      )
      .subscribe();

    // Governance pillars subscription
    const pillarsChannel = supabase
      .channel("pillars-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "governance_pillars" },
        (payload) => {
          setData((prev) => {
            let updatedPillars = [...prev.pillars];
            if (payload.eventType === "INSERT") {
              updatedPillars.push(payload.new);
            } else if (payload.eventType === "UPDATE") {
              updatedPillars = updatedPillars.map((p) =>
                p.id === payload.new.id ? payload.new : p
              );
            } else if (payload.eventType === "DELETE") {
              updatedPillars = updatedPillars.filter((p) => p.id !== payload.old.id);
            }
            return { ...prev, pillars: updatedPillars };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statesChannel);
      supabase.removeChannel(lessonsChannel);
      supabase.removeChannel(pillarsChannel);
    };
  }, []);

  /**
   * Role-based mutation helpers
   */

  async function addLesson(subject, step, question, answer) {
    if (role !== "admin") {
      console.warn("Permission denied: only admins can add lessons.");
      return null;
    }
    const { data: inserted, error } = await supabase
      .from("tutor_lessons")
      .insert([{ subject, step, question, answer }])
      .select();
    if (error) {
      console.error("Error adding lesson:", error);
      return null;
    }
    return inserted;
  }

  async function updateState(stateId, newState) {
    const targetState = data.states.find((s) => s.id === stateId);
    if (!targetState) return null;
    if (role !== "admin" && targetState.user_id !== userId) {
      console.warn("Permission denied: cannot update another user's state.");
      return null;
    }
    const { data: updated, error } = await supabase
      .from("governance_states")
      .update({ state: newState })
      .eq("id", stateId)
      .select();
    if (error) {
      console.error("Error updating state:", error);
      return null;
    }
    return updated;
  }

  async function removeState(stateId) {
    const targetState = data.states.find((s) => s.id === stateId);
    if (!targetState) return false;
    if (role !== "admin" && targetState.user_id !== userId) {
      console.warn("Permission denied: cannot remove another user's state.");
      return false;
    }
    const { error } = await supabase
      .from("governance_states")
      .delete()
      .eq("id", stateId);
    if (error) {
      console.error("Error removing state:", error);
      return false;
    }
    return true;
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
  };
}

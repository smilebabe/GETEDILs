import { createClient } from "@supabase/supabase-js";

// ✅ Centralized Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Registry
 * Provides a unified interface for:
 * - Supabase client
 * - Real-time subscriptions
 * - Mutation helpers for governance pillars, tutor lessons, and states
 */
class Registry {
  constructor() {
    this.channels = {};
    this.listeners = {
      pillars: [],
      lessons: [],
      states: [],
    };
  }

  // Subscribe to table changes
  subscribe(table) {
    if (this.channels[table]) return; // already subscribed

    this.channels[table] = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          this.emit(table, payload);
        }
      )
      .subscribe();
  }

  // Emit events to listeners
  emit(table, payload) {
    if (this.listeners[table]) {
      this.listeners[table].forEach((cb) => cb(payload));
    }
  }

  // Add listener
  on(table, callback) {
    if (!this.listeners[table]) this.listeners[table] = [];
    this.listeners[table].push(callback);
    this.subscribe(table);
    return () => {
      this.listeners[table] = this.listeners[table].filter((cb) => cb !== callback);
    };
  }

  // Cleanup
  unsubscribe(table) {
    if (this.channels[table]) {
      supabase.removeChannel(this.channels[table]);
      delete this.channels[table];
    }
    this.listeners[table] = [];
  }

  unsubscribeAll() {
    Object.keys(this.channels).forEach((table) => {
      supabase.removeChannel(this.channels[table]);
    });
    this.channels = {};
    this.listeners = { pillars: [], lessons: [], states: [] };
  }

  // -------------------------
  // Mutation Helpers
  // -------------------------

  async addLesson(subject, step, question, answer, role = "user") {
    if (role !== "admin") {
      console.warn("Permission denied: only admins can add lessons.");
      return null;
    }
    const { data, error } = await supabase
      .from("tutor_lessons")
      .insert([{ subject, step, question, answer }])
      .select();
    if (error) {
      console.error("Error adding lesson:", error);
      return null;
    }
    return data;
  }

  async updateState(stateId, newState, userId, role = "user") {
    const { data: states } = await supabase
      .from("governance_states")
      .select("*")
      .eq("id", stateId)
      .single();

    if (!states) return null;
    if (role !== "admin" && states.user_id !== userId) {
      console.warn("Permission denied: cannot update another user's state.");
      return null;
    }

    const { data, error } = await supabase
      .from("governance_states")
      .update({ state: newState })
      .eq("id", stateId)
      .select();
    if (error) {
      console.error("Error updating state:", error);
      return null;
    }
    return data;
  }

  async removeState(stateId, userId, role = "user") {
    const { data: states } = await supabase
      .from("governance_states")
      .select("*")
      .eq("id", stateId)
      .single();

    if (!states) return false;
    if (role !== "admin" && states.user_id !== userId) {
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

  async addPillar(name, description, role = "user") {
    if (role !== "admin") {
      console.warn("Permission denied: only admins can add pillars.");
      return null;
    }
    const { data, error } = await supabase
      .from("governance_pillars")
      .insert([{ name, description }])
      .select();
    if (error) {
      console.error("Error adding pillar:", error);
      return null;
    }
    return data;
  }
}

// Export singleton
export const registry = new Registry();

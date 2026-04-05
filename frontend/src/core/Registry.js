import { createClient } from "@supabase/supabase-js";

// ✅ Centralized Supabase client
export const supabase = createClient(
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
);

// ✅ Role hierarchy for access control
export const ROLE_LEVELS = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
};

// ✅ Centralized route paths
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  reset: "/reset",
  resetSuccess: "/reset-success",
  dashboard: "/dashboard",
  admin: "/admin",
  profile: "/profile",
};

// ✅ Registry class
// Provides a unified interface for:
// - Supabase client
// - Real-time subscriptions
// - Mutation helpers with toast notifications
class Registry {
  constructor() {
    this.channels = {};
    this.listeners = { pillars: [], lessons: [], states: [] };
    this.toastHandler = null; // global toast callback
  }

  // Attach toast handler from AppShell
  setToastHandler(handler) {
    this.toastHandler = handler;
  }

  notify(message, type = "success") {
    if (this.toastHandler) this.toastHandler(message, type);
    else console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // -------------------------
  // Real-time Subscriptions
  // -------------------------
  subscribe(table) {
    if (this.channels[table]) return;
    this.channels[table] = supabase
      .channel(`${table}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) =>
        this.emit(table, payload)
      )
      .subscribe();
  }

  emit(table, payload) {
    if (this.listeners[table]) {
      this.listeners[table].forEach((cb) => cb(payload));
    }
  }

  on(table, callback) {
    if (!this.listeners[table]) this.listeners[table] = [];
    this.listeners[table].push(callback);
    this.subscribe(table);
    return () => {
      this.listeners[table] = this.listeners[table].filter((cb) => cb !== callback);
    };
  }

  unsubscribeAll() {
    Object.keys(this.channels).forEach((table) => {
      supabase.removeChannel(this.channels[table]);
    });
    this.channels = {};
    this.listeners = { pillars: [], lessons: [], states: [] };
  }

  // -------------------------
  // Mutation Helpers with Toasts
  // -------------------------

  async addLesson(subject, step, question, answer, role = "user") {
    if (ROLE_LEVELS[role] < ROLE_LEVELS.admin) {
      this.notify("Permission denied: only admins can add lessons.", "error");
      return null;
    }
    const { data, error } = await supabase
      .from("tutor_lessons")
      .insert([{ subject, step, question, answer }])
      .select();
    if (error) {
      this.notify("Error adding lesson: " + error.message, "error");
      return null;
    }
    this.notify("Lesson added successfully!", "success");
    return data;
  }

  async updateState(stateId, newState, userId, role = "user") {
    const { data: states } = await supabase
      .from("governance_states")
      .select("*")
      .eq("id", stateId)
      .single();

    if (!states) return null;
    if (ROLE_LEVELS[role] < ROLE_LEVELS.admin && states.user_id !== userId) {
      this.notify("Permission denied: cannot update another user's state.", "error");
      return null;
    }

    const { data, error } = await supabase
      .from("governance_states")
      .update({ state: newState })
      .eq("id", stateId)
      .select();
    if (error) {
      this.notify("Error updating state: " + error.message, "error");
      return null;
    }
    this.notify("State updated successfully!", "success");
    return data;
  }

  async removeState(stateId, userId, role = "user") {
    const { data: states } = await supabase
      .from("governance_states")
      .select("*")
      .eq("id", stateId)
      .single();

    if (!states) return false;
    if (ROLE_LEVELS[role] < ROLE_LEVELS.admin && states.user_id !== userId) {
      this.notify("Permission denied: cannot remove another user's state.", "error");
      return false;
    }

    const { error } = await supabase
      .from("governance_states")
      .delete()
      .eq("id", stateId);
    if (error) {
      this.notify("Error removing state: " + error.message, "error");
      return false;
    }
    this.notify("State removed successfully!", "success");
    return true;
  }

  async addPillar(name, description, role = "user") {
    if (ROLE_LEVELS[role] < ROLE_LEVELS.admin) {
      this.notify("Permission denied: only admins can add pillars.", "error");
      return null;
    }
    const { data, error } = await supabase
      .from("governance_pillars")
      .insert([{ name, description }])
      .select();
    if (error) {
      this.notify("Error adding pillar: " + error.message, "error");
      return null;
    }
    this.notify("Pillar added successfully!", "success");
    return data;
  }
}

export const registry = new Registry();

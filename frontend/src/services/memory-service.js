/**
 * memory-service.js
 * Real-time memory layer for GETEDIL OS
 * Combines persistence, caching, and Supabase realtime subscriptions
 */

import supabase from "../lib/supabase";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// ---------- Conversation Memory ----------

export async function saveInteraction(userId, input, response, context) {
  const record = {
    user_id: userId,
    input,
    response,
    locale: context.locale || "en-US",
    role: context.role || "user",
    timestamp: new Date().toISOString(),
  };

  cache.set(`conversation_${userId}`, record);
  const { error } = await supabase.from("conversation_memory").insert(record);
  if (error) console.error("Error saving interaction:", error);
}

export async function getRecentContext(userId, limit = 5) {
  const cached = cache.get(`conversation_${userId}`);
  if (cached) return [cached];

  const { data, error } = await supabase
    .from("conversation_memory")
    .select("input, response, locale, role, timestamp")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error retrieving context:", error);
    return [];
  }
  return data || [];
}

// ---------- Preferences ----------

export async function savePreference(userId, key, value) {
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: userId,
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("Error saving preference:", error);
  cache.set(`pref_${userId}_${key}`, value);
}

export async function getPreferences(userId) {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("key, value")
    .eq("user_id", userId);

  if (error) {
    console.error("Error retrieving preferences:", error);
    return [];
  }
  return data || [];
}

// ---------- Governance ----------

export async function logGovernanceEvent(userId, pillar, action, message, category = "governance") {
  const event = {
    user_id: userId,
    pillar,
    action,
    message,
    category,
    timestamp: new Date().toISOString(),
  };

  const { error } = await supabase.from("governance_memory").insert(event);
  if (error) console.error("Error logging governance event:", error);
  cache.set(`gov_${userId}_${pillar}`, event);
}

export async function getGovernanceHistory(userId, limit = 10) {
  const { data, error } = await supabase
    .from("governance_memory")
    .select("pillar, action, message, category, timestamp")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error retrieving governance history:", error);
    return [];
  }
  return data || [];
}

// ---------- Real-time Subscriptions ----------

export function subscribeToMemoryEvents(userId, onEvent) {
  // Conversation updates
  supabase
    .channel(`conversation_${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "conversation_memory", filter: `user_id=eq.${userId}` },
      (payload) => onEvent("conversation", payload.new)
    )
    .subscribe();

  // Preference updates
  supabase
    .channel(`preferences_${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "user_preferences", filter: `user_id=eq.${userId}` },
      (payload) => onEvent("preference", payload.new)
    )
    .subscribe();

  // Governance events
  supabase
    .channel(`governance_${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "governance_memory", filter: `user_id=eq.${userId}` },
      (payload) => onEvent("governance", payload.new)
    )
    .subscribe();
}

// ---------- Contextual Enrichment ----------

export async function enrichContext(userId) {
  const [recent, prefs, governance] = await Promise.all([
    getRecentContext(userId),
    getPreferences(userId),
    getGovernanceHistory(userId),
  ]);

  return {
    recentInteractions: recent,
    preferences: Object.fromEntries(prefs.map((p) => [p.key, p.value])),
    governanceSummary: governance.slice(0, 3),
  };
}

// ---------- Utility ----------

export function clearCache(userId) {
  cache.keys().forEach((key) => {
    if (key.includes(userId)) cache.del(key);
  });
}

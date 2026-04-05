import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Save a user interaction (input + reply)
 */
export async function saveInteraction(userId, input, reply, meta) {
  const { error } = await supabase
    .from("interactions")
    .insert([
      {
        user_id: userId,
        input,
        reply,
        meta,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) console.error("Error saving interaction:", error);
}

/**
 * Enrich context for GETEBrain
 */
export async function enrichContext(userId) {
  const { data: interactions, error: iErr } = await supabase
    .from("interactions")
    .select("input, reply, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: states, error: sErr } = await supabase
    .from("governance_states")
    .select("pillar_id, state, updated_at")
    .eq("user_id", userId);

  if (iErr) console.error("Error fetching interactions:", iErr);
  if (sErr) console.error("Error fetching governance states:", sErr);

  return {
    recentInteractions: interactions || [],
    preferences: {}, // extend later with user prefs
    governanceSummary: states || [],
  };
}

/**
 * Log governance events for audit dashboards
 */
export async function logGovernanceEvent(userId, category, type, details, actor) {
  const { error } = await supabase
    .from("governance_events")
    .insert([
      {
        user_id: userId,
        action: type,
        details,
        category,
        actor,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) console.error("Error logging governance event:", error);
}

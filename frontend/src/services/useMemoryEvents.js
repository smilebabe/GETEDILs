import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * React hook: subscribe to governance_events in real time
 * @param {string} userId - UUID of the user
 * @returns {Array} events - realtime governance events
 */
export function useMemoryEvents(userId) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch of recent events
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("governance_events")
        .select("id, action, details, created_at, pillar_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching governance events:", error);
      } else {
        setEvents(data || []);
      }
    };

    fetchEvents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("governance-events-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "governance_events",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setEvents((prev) => [
            { ...payload.new },
            ...prev.slice(0, 19), // keep latest 20
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return events;
}

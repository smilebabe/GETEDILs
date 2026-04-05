import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useGETEStore } from "../../store/geteStore";
import { getSuggestion } from "../../core/geteBrain";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GETEPanel({ user }) {
  const { activePillars, restrictedPillars } = useGETEStore();
  const [suggestion, setSuggestion] = useState("");
  const [events, setEvents] = useState([]);

  // Load initial governance events
  useEffect(() => {
    if (!user?.id) return;

    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("governance_events")
        .select("id, action, details, created_at, pillar_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching governance events:", error);
      } else {
        setEvents(data || []);
      }
    };

    fetchEvents();

    // Subscribe to realtime governance events
    const channel = supabase
      .channel("gete-panel-events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "governance_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setEvents((prev) => [
            { ...payload.new },
            ...prev.slice(0, 9), // keep latest 10
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Generate suggestion whenever pillars change
  useEffect(() => {
    async function loadSuggestion() {
      const hint = await getSuggestion(user.id, {
        activePillars,
        restrictedPillars,
      });
      setSuggestion(hint);
    }
    if (user?.id) loadSuggestion();
  }, [user?.id, activePillars, restrictedPillars]);

  return (
    <div className="bg-gray-800 text-gray-100 p-4 rounded-lg shadow-neon flex flex-col space-y-4">
      {/* Suggestion Banner */}
      <div className="bg-neon-blue text-black p-3 rounded-md font-semibold">
        {suggestion || "Loading suggestion..."}
      </div>

      {/* Governance Events Feed */}
      <div className="bg-gray-900 p-4 rounded-md flex-grow overflow-y-auto">
        <h3 className="text-lg font-bold text-neon-yellow mb-2">
          Governance Events
        </h3>
        {events.length === 0 ? (
          <p className="text-gray-400">No events yet…</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border-b border-gray-700 pb-1">
                <strong className="text-neon-green">{e.action}</strong> —{" "}
                {e.details} <span className="text-gray-500">({e.created_at})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

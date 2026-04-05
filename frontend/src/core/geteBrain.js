/**
 * geteBrain.js
 * Context-aware reasoning engine for GETEAssistant
 * Calls server-side API route for LLM responses
 */

import { saveInteraction, enrichContext, logGovernanceEvent } from "../services/memory-service";

/**
 * Generate a context-aware response by calling the backend API
 * @param {string} userId - The ID of the user
 * @param {string} input - User input text
 * @param {Object} options - Context options { locale, role, activePillars, restrictedPillars }
 * @returns {Promise<string>} response - Assistant's reply
 */
export async function generateResponse(userId, input, options = {}) {
  try {
    // Step 1: Enrich context from memory
    const context = await enrichContext(userId);

    // Step 2: Call backend API route
    const res = await fetch("/api/geteBrain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        input,
        options,
        context, // pass enriched context to backend
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const reply = data.reply || "SYSTEM_OFFLINE: Error generating response.";

    // Step 3: Save interaction locally
    await saveInteraction(userId, input, reply, {
      locale: options.locale || "en-US",
      role: options.role || "user",
    });

    // Step 4: Log governance event
    await logGovernanceEvent(
      userId,
      "Conversation",
      "interaction",
      `Processed input: "${input}" with pillars active: ${options.activePillars?.join(", ") || "None"} restricted: ${options.restrictedPillars?.join(", ") || "None"}`,
      "assistant"
    );

    return reply;
  } catch (err) {
    console.error("generateResponse error:", err);
    return `SYSTEM_OFFLINE: ${err.message}`;
  }
}

/**
 * Diagnostic wrapper for GETEBrain
 * Provides structured status messages for UI
 */
export function diagnosticStatus(status, details = null) {
  return {
    type: "system",
    payload: {
      status,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

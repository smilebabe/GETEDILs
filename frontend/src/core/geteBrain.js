/**
 * geteBrain.js
 * Context-aware reasoning engine for GETEAssistant
 * Integrates with LLM for natural language responses, enriched by memory, preferences, and governance rules
 */

import { saveInteraction, enrichContext, logGovernanceEvent } from "./memory-service";
import OpenAI from "openai";

// Initialize OpenAI client (API key in environment)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a context-aware response with governance rules
 * @param {string} userId - The ID of the user
 * @param {string} input - User input text
 * @param {Object} options - Context options { locale, role, activePillars, restrictedPillars }
 * @returns {Promise<string>} response - Assistant's reply
 */
export async function generateResponse(userId, input, options = {}) {
  // Step 1: Enrich context from memory
  const context = await enrichContext(userId);

  // Step 2: Build governance rule injection
  const activePillars = options.activePillars || [];
  const restrictedPillars = options.restrictedPillars || [];

  const governanceRules = `
Governance Rules:
- Active Pillars: ${activePillars.join(", ") || "None"}
- Restricted Pillars: ${restrictedPillars.join(", ") || "None"}
- If a pillar is restricted, do not provide or infer data from it.
- If a pillar is active, you may use its context to enrich answers.
`;

  // Step 3: Build system prompt dynamically
  const systemPrompt = `
You are GETEAssistant, an enterprise AI companion.
You must always answer in a context-aware way, using the following memory:

- Recent interactions: ${JSON.stringify(context.recentInteractions)}
- Preferences: ${JSON.stringify(context.preferences)}
- Governance summary: ${JSON.stringify(context.governanceSummary)}

${governanceRules}

Tone:
- Adapt to user role (${options.role || "user"}).
- Respect preferences (e.g., theme, language).
- Provide concise, clear, enterprise-grade answers.
`;

  let reply;
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
    });

    reply = completion.choices[0].message.content;
  } catch (err) {
    console.error("LLM error:", err);
    reply = `SYSTEM_OFFLINE: Error generating response. Details: ${err.message}`;
  }

  // Step 4: Save interaction to memory
  await saveInteraction(userId, input, reply, {
    locale: options.locale || "en-US",
    role: options.role || "user",
  });

  // Step 5: Log governance event
  await logGovernanceEvent(
    userId,
    "Conversation",
    "interaction",
    `Processed input: "${input}" with pillars active: ${activePillars.join(", ")} restricted: ${restrictedPillars.join(", ")}`,
    "assistant"
  );

  return reply;
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

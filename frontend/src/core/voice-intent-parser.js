/**
 * voice-intent-parser.js
 * Converts raw speech text into structured intents for GETEAssistant.
 * Supports governance pillars, tutoring, and general chat.
 */

const ACTION_KEYWORDS = {
  activate: ["activate", "enable", "turn on", "start"],
  restrict: ["restrict", "disable", "block", "turn off"],
  query: ["show", "get", "fetch", "list", "what", "who", "where", "when"],
  command: ["run", "execute", "do", "perform"],
  tutor: ["teach", "tutor", "help me learn", "lesson", "study"],
};

/**
 * Normalize text to lowercase and trim
 */
function normalize(text) {
  return text.toLowerCase().trim();
}

/**
 * Detect intent type based on keywords
 */
function detectIntent(text) {
  const normalized = normalize(text);

  for (const [intent, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return intent;
    }
  }
  return "chat"; // default fallback
}

/**
 * Extract pillar names or entities mentioned in the text
 */
function extractEntities(text) {
  const normalized = normalize(text);
  const entities = [];

  // Governance pillars
  if (normalized.includes("finance")) entities.push("Finance DB");
  if (normalized.includes("police")) entities.push("Police DB");
  if (normalized.includes("health")) entities.push("Health DB");

  // New pillar: GetSkill
  if (normalized.includes("skill") || normalized.includes("tutor")) {
    entities.push("GetSkill");
  }

  return entities;
}

/**
 * Parse raw speech text into structured intent
 * @param {string} userId - UUID of the user
 * @param {string} speechText - Raw recognized speech
 * @returns {Object} Parsed intent object
 */
export function parseVoiceIntent(userId, speechText) {
  const intent = detectIntent(speechText);
  const entities = extractEntities(speechText);

  return {
    userId,
    raw: speechText,
    intent, // e.g., "activate", "restrict", "query", "command", "tutor", "chat"
    entities, // e.g., ["GetSkill"]
    timestamp: new Date().toISOString(),
  };
}

/**
 * Example usage:
 * const parsed = parseVoiceIntent("user123", "Tutor me in math using GetSkill");
 * => {
 *   userId: "user123",
 *   raw: "Tutor me in math using GetSkill",
 *   intent: "tutor",
 *   entities: ["GetSkill"],
 *   timestamp: "2026-04-05T03:25:00Z"
 * }
 */

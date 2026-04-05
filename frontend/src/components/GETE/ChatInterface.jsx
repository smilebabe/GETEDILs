import React, { useState, useEffect, useRef } from "react";
import { generateResponse } from "../core/geteBrain";
import { parseVoiceIntent } from "../core/voice-intent-parser";
import { tutor } from "../core/tutor";   // <-- Tutor module
import GETEPanel from "./gete/GETEPanel";

export default function ChatInterface({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    await processMessage(input);
    setInput("");
  }

  async function handleVoiceInput(speechText) {
    const parsed = parseVoiceIntent(user.id, speechText);

    // Show raw speech in chat
    setMessages((prev) => [...prev, { role: "user", content: parsed.raw }]);

    // Tutor intent → route to Tutor module
    if (parsed.intent === "tutor" && parsed.entities.includes("GetSkill")) {
      const lesson = await tutor(user.id, parsed.raw);
      setMessages((prev) => [...prev, { role: "assistant", content: lesson }]);
      return;
    }

    // Governance intents → log directly
    if (["activate", "restrict"].includes(parsed.intent)) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Intent detected: ${parsed.intent} → Entities: ${parsed.entities.join(", ") || "None"}`,
        },
      ]);
      return;
    }

    // Default → normal chat
    const reply = await generateResponse(user.id, parsed.raw, {
      locale: user.locale,
      role: user.role,
      activePillars: parsed.entities,
      restrictedPillars: [],
    });

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  }

  async function processMessage(text) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const reply = await generateResponse(user.id, text, {
        locale: user.locale,
        role: user.role,
        activePillars: ["Police DB"],
        restrictedPillars: ["Finance DB"],
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `SYSTEM_OFFLINE: ${err.message}` },
      ]);
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-screen bg-gray-900 text-gray-100">
      <aside className="col-span-4">
        <GETEPanel user={user} />
      </aside>

      <main className="col-span-8 flex flex-col bg-gray-800 rounded-lg shadow-neon">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neon-green">GETE Neural Link</h1>
            <p className="text-sm text-gray-400">Context-aware enterprise assistant</p>
          </div>
          {/* Voice Input Button (demo) */}
          <button
            onClick={() => handleVoiceInput("Tutor me in math using GetSkill")}
            className="px-3 py-2 bg-neon-blue text-black rounded-md hover:bg-blue-400 transition"
          >
            🎤 Voice Test
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-md max-w-xl ${
                msg.role === "user"
                  ? "bg-neon-blue text-black self-end ml-auto"
                  : "bg-gray-700 text-gray-100 self-start"
              }`}
            >
              <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>{" "}
              {msg.content}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-700 flex space-x-2">
          <form onSubmit={handleSend} className="flex w-full space-x-2">
            <input
              type="text"
              value={input}
              placeholder="Input Command..."
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow px-4 py-2 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-green"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-neon-green text-black font-semibold rounded-md hover:bg-green-400 transition shadow-neon"
            >
              SEND
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

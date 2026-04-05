import React, { useState, useEffect } from "react";
import { useMemoryEvents } from "../services/useMemoryEvents";
import { saveInteraction, enrichContext } from "../services/memory-service";

export default function GETEAssistant({ user }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [context, setContext] = useState({});
  const events = useMemoryEvents(user.id);

  // Load enriched context on mount
  useEffect(() => {
    async function loadContext() {
      const ctx = await enrichContext(user.id);
      setContext(ctx);
    }
    loadContext();
  }, [user.id]);

  // Handle user input
  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    // Example: simple echo response (replace with GETEBrain logic)
    const reply = `Hello ${user.username}, you said: "${input}"`;

    // Save to memory
    await saveInteraction(user.id, input, reply, {
      locale: user.locale,
      role: user.role,
    });

    setResponse(reply);
    setInput("");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-gray-100 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-neon-green">GETE Assistant</h2>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-6">
        <input
          type="text"
          value={input}
          placeholder="Ask GETE something..."
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow px-4 py-2 rounded-md bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-green"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-neon-green text-black font-semibold rounded-md hover:bg-green-400 transition shadow-neon"
        >
          Send
        </button>
      </form>

      {/* Response */}
      <div className="mb-6 bg-gray-800 p-4 rounded-md">
        <h3 className="text-xl font-semibold mb-2 text-neon-blue">Response</h3>
        <p className="text-lg">{response}</p>
      </div>

      {/* Enriched Context */}
      <div className="mb-6 bg-gray-800 p-4 rounded-md">
        <h3 className="text-xl font-semibold mb-2 text-neon-purple">Enriched Context</h3>
        <pre className="text-sm overflow-x-auto font-mono">{JSON.stringify(context, null, 2)}</pre>
      </div>

      {/* Realtime Events */}
      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="text-xl font-semibold mb-2 text-neon-yellow">Realtime Memory Feed</h3>
        <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
          {events.map((e, idx) => (
            <li key={idx} className="border-b border-gray-700 pb-2">
              <strong className="text-neon-green">{e.type}:</strong>{" "}
              {JSON.stringify(e.payload)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

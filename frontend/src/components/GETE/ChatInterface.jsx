import React, { useState, useEffect, useRef } from "react";
import { generateResponse } from "../services/geteBrain";
import { useMemoryEvents } from "../services/useMemoryEvents";

export default function ChatInterface({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const events = useMemoryEvents(user.id);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Generate assistant response
    const reply = await generateResponse(user.id, input, {
      locale: user.locale,
      role: user.role,
      activePillars: ["Police DB"], // Example pillar injection
      restrictedPillars: ["Finance DB"],
    });

    const assistantMessage = { role: "assistant", content: reply };
    setMessages((prev) => [...prev, assistantMessage]);

    setInput("");
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-screen bg-gray-900 text-gray-100">
      {/* Governance Feed (Left Panel) */}
      <aside className="col-span-4 bg-gray-800 p-4 rounded-lg shadow-neon flex flex-col">
        <h2 className="text-xl font-bold text-neon-yellow mb-4">Governance Feed</h2>
        <ul className="space-y-2 text-sm overflow-y-auto flex-grow">
          {events.length === 0 ? (
            <li className="text-gray-400">No governance events yet…</li>
          ) : (
            events.map((e, idx) => (
              <li key={idx} className="border-b border-gray-700 pb-1">
                {e.type === "system" ? (
                  <span className="text-neon-purple">[System]: {JSON.stringify(e.payload)}</span>
                ) : (
                  <>
                    <strong className="text-neon-green">{e.type}:</strong>{" "}
                    {JSON.stringify(e.payload)}
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Chat Interface (Right Panel) */}
      <main className="col-span-8 flex flex-col bg-gray-800 rounded-lg shadow-neon">
        {/* Header */}
        <header className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-neon-green">GETE Neural Link</h1>
          <p className="text-sm text-gray-400">Context-aware enterprise assistant</p>
        </header>

        {/* Chat Window */}
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

        {/* Input Bar */}
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

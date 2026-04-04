// frontend/src/components/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PillarRouter from '../lib/pillarRouter'; // AI orchestration layer

export default function ChatInterface() {
  const { user, role, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load past AI conversations
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) console.error(error);
      else setMessages(data);
    };

    if (isAuthenticated) fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`ai_conversations-${user?.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_conversations', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id]);

  // Send a message to AI Assistant
  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Route message through AI orchestration (pillar mapping)
    const aiResponse = await PillarRouter.handleMessage({
      user,
      role,
      content: input.trim(),
    });

    // Save both user + AI messages
    const { error } = await supabase.from('ai_conversations').insert([
      {
        user_id: user.id,
        role,
        sender: 'user',
        content: input.trim(),
      },
      {
        user_id: user.id,
        role: 'ai_agent',
        sender: 'assistant',
        content: aiResponse,
      },
    ]);

    if (error) console.error(error);
    else setInput('');
    setLoading(false);
  };

  if (!isAuthenticated) {
    return <p>Please log in to access GETE AI Assistance.</p>;
  }

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-md bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-lg">GETE AI Assistance</h2>
        <span className="text-sm text-gray-500">Role: {role}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-lg ${
              msg.sender === 'user'
                ? 'bg-blue-100 self-end ml-auto'
                : 'bg-green-100'
            }`}
          >
            <p className="text-sm text-gray-700">{msg.content}</p>
            <span className="text-xs text-gray-400">
              {msg.sender} • {new Date(msg.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 flex space-x-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Ask GETE AI anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

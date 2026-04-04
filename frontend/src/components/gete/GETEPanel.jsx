import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js'; // Added Supabase Client
import { useGETEStore } from '../../store/geteStore';
import { getSuggestion } from '../../core/geteBrain';

// Initialize local Supabase connection
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function GETEPanel() {
  const { isOpen, close, context, messages, addMessage } = useGETEStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const suggestion = getSuggestion(context);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input;
    setIsProcessing(true);
    
    // 1. Add User Message to UI
    addMessage({ role: 'user', text: userText });
    setInput('');

    try {
      // --- PILLAR-SPECIFIC LOGIC ENGINE ---
      
      // LOGIC: Federal Police DB Search
      if (context === "Federal Police") {
        addMessage({ role: 'assistant', text: `🔍 SCANNING_LEDGER for: "${userText}"...` });
        
        const { data, error } = await supabase
          .from('citizens_trust')
          .select('*')
          .ilike('full_name', `%${userText}%`)
          .single();

        if (data) {
          addMessage({ 
            role: 'assistant', 
            text: `✅ RECORD_FOUND\nName: ${data.full_name}\nTrust Score: ${data.trust_score}%\nStatus: ${data.status}` 
          });
        } else {
          addMessage({ role: 'assistant', text: "❌ NO_MATCH: Subject not found in Federal Trust Ledger." });
        }
      } 
      
      // LOGIC: Real Estate Search
      else if (context === "Real Estate") {
        addMessage({ role: 'assistant', text: `🏠 SEARCHING_PROPERTIES in: "${userText}"...` });
        
        const { data } = await supabase
          .from('properties')
          .select('*')
          .ilike('location', `%${userText}%`);

        if (data && data.length > 0) {
          addMessage({ 
            role: 'assistant', 
            text: `📍 Found ${data.length} listings in ${userText}. Opening Map Nodes...` 
          });
        } else {
          addMessage({ role: 'assistant', text: "📭 No verified listings found in that area yet." });
        }
      }

      // LOGIC: General AI Conversation (Fallback)
      else {
        addMessage({ role: 'assistant', text: "SYSTEM_OFFLINE: AI Inference engine connection pending. Use specific Pillar Nodes for database queries." });
      }

    } catch (err) {
      addMessage({ role: 'assistant', text: "⚠️ CRITICAL_NODE_ERROR: Connection to Supabase timed out." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed right-4 bottom-24 w-[340px] h-[480px] z-[100] rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* 1. Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${isProcessing ? 'bg-red-500 animate-ping' : 'bg-yellow-500 animate-pulse'} rounded-full`} />
              <span className="font-bold text-xs tracking-widest uppercase">GETE_NEURAL_LINK</span>
            </div>
            <button onClick={close} className="text-xl opacity-50 hover:opacity-100 transition">×</button>
          </div>

          {/* 2. Messages Window */}
          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4 font-mono scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-white/30 italic text-center mt-20">Secure Channel Established...</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-yellow-500/50 mb-1 uppercase font-black">{m.role}</span>
                <div className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-line ${m.role === 'user' ? 'bg-yellow-500/20 rounded-tr-none' : 'bg-white/5 rounded-tl-none border border-white/10'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Input & Suggestion Layer */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="text-[10px] text-yellow-300/70 mb-3 flex items-center gap-2">
               <span className="animate-bounce">💡</span> {suggestion}
            </div>
            
            <div className="flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isProcessing ? "Processing..." : "Talk to GETE..."}
                disabled={isProcessing}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-yellow-500/50 transition disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={isProcessing}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-black hover:bg-yellow-400 transition disabled:bg-gray-600"
              >
                {isProcessing ? "..." : "SEND"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useGETEStore } from '../../store/geteStore';
import { getSuggestion } from '../../core/geteBrain';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function GETEPanel() {
  // --- IMPROVED SELECTORS: These ensure the latest state is always used ---
  const isOpen = useGETEStore((state) => state.isOpen);
  const close = useGETEStore((state) => state.close);
  const context = useGETEStore((state) => state.context); 
  const messages = useGETEStore((state) => state.messages);
  const addMessage = useGETEStore((state) => state.addMessage);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const suggestion = getSuggestion(context);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input;
    setIsProcessing(true);
    
    // 1. Log context for debugging (Check your browser console!)
    console.log("SENDING_COMMAND_IN_CONTEXT:", context);

    addMessage({ role: 'user', text: userText });
    setInput('');

    try {
      // Normalize context
      const activeContext = context?.trim();

      // --- PILLAR: FEDERAL POLICE / POLICE DB ---
      // We check for both variations to be safe
      if (activeContext === "Federal Police" || activeContext === "Police DB") {
        addMessage({ role: 'assistant', text: `🔍 SCANNING_FEDERAL_LEDGER...` });
        
        const { data, error } = await supabase
          .from('citizens_trust')
          .select('*')
          .ilike('full_name', `%${userText}%`)
          .single();

        if (data) {
          addMessage({ 
            role: 'assistant', 
            text: `✅ RECORD_FOUND\n──────────────\nNAME: ${data.full_name}\nTRUST: ${data.trust_score}%\nSTATUS: ${data.status}` 
          });
        } else {
          addMessage({ role: 'assistant', text: `❌ NO_MATCH: "${userText}" not found in verified registry.` });
        }
      } 
      
      // --- PILLAR: REAL ESTATE ---
      else if (activeContext === "Real Estate") {
        addMessage({ role: 'assistant', text: `🏠 QUERYING_PROPERTIES...` });
        
        const { data } = await supabase
          .from('properties')
          .select('*')
          .ilike('location', `%${userText}%`);

        if (data && data.length > 0) {
          addMessage({ role: 'assistant', text: `📍 Found ${data.length} listings. Syncing Map Nodes...` });
        } else {
          addMessage({ role: 'assistant', text: "📭 No listings found in this sector." });
        }
      }

      // --- FALLBACK DIAGNOSTIC ---
      else {
        addMessage({ 
          role: 'assistant', 
          text: `SYSTEM_OFFLINE: Context is [${activeContext || 'EMPTY'}].\n\nPlease select a Pillar Node (e.g., Police DB) to activate intelligence.` 
        });
      }

    } catch (err) {
      addMessage({ role: 'assistant', text: "⚠️ NODE_ERROR: Supabase connection failed." });
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
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${isProcessing ? 'bg-red-500 animate-ping' : 'bg-yellow-500 animate-pulse'} rounded-full`} />
              <span className="font-bold text-[10px] tracking-widest uppercase">GETE_NEURAL_LINK</span>
            </div>
            <button onClick={close} className="text-xl opacity-50 hover:opacity-100 transition">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4 font-mono scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-white/20 text-[10px] text-center mt-20 tracking-widest uppercase">
                Channel_Encrypted // Ready_
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-yellow-500/40 mb-1 uppercase font-black">{m.role}</span>
                <div className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-line text-[12px] ${
                  m.role === 'user' 
                    ? 'bg-yellow-500/10 border border-yellow-500/20 rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="text-[9px] text-yellow-300/60 mb-3 flex items-center gap-2 font-bold uppercase tracking-tighter">
               <span className="animate-bounce">💡</span> {suggestion}
            </div>
            
            <div className="flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isProcessing ? "PROCESSING..." : "Input Command..."}
                disabled={isProcessing}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[12px] focus:outline-none focus:border-yellow-500/50 transition disabled:opacity-30"
              />
              <button 
                onClick={handleSend}
                disabled={isProcessing}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-[10px] font-black hover:bg-yellow-400 active:scale-95 transition disabled:bg-gray-700"
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

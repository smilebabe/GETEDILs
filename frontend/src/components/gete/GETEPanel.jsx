import React, { useState } from 'react'; // Added React + State for input
import { motion, AnimatePresence } from 'framer-motion';
import { useGETEStore } from '../../store/geteStore';
import { getSuggestion } from '../../core/geteBrain';

export default function GETEPanel() {
  const { isOpen, close, context, messages, addMessage } = useGETEStore();
  const [input, setInput] = useState('');

  const suggestion = getSuggestion(context);

  const handleSend = () => {
    if (!input.trim()) return;
    // Add user message to store
    addMessage({ role: 'user', text: input });
    setInput('');
    // Logic for GETE to respond will go in your useGETEAI hook
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
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="font-bold text-xs tracking-widest uppercase">GETE_NEURAL_LINK</span>
            </div>
            <button onClick={close} className="text-xl opacity-50 hover:opacity-100 transition">×</button>
          </div>

          {/* 2. Messages Window */}
          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4 font-mono">
            {messages.length === 0 && (
              <div className="text-white/30 italic text-center mt-20">Secure Channel Established...</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-yellow-500/50 mb-1 uppercase font-black">{m.role}</span>
                <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-yellow-500/20 rounded-tr-none' : 'bg-white/5 rounded-tl-none border border-white/10'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Input & Suggestion Layer */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="text-[10px] text-yellow-300/70 mb-3 flex items-center gap-2">
               <span className="animate-bounce">💡</span> {suggestion}
            </div>
            
            <div className="flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Talk to GETE..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-yellow-500/50 transition"
              />
              <button 
                onClick={handleSend}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-black hover:bg-yellow-400 transition"
              >
                SEND
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

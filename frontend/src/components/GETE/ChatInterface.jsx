import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OpportunityCard from './OpportunityCard';

/**
 * GETE Neural Link Interface (v2.0 - 2026 Agentic Standard)
 * Features: Generative UI, Status Orbs, Ethiopian Currency Logic, 
 * and Adaptive Message Density.
 */

const ChatInterface = ({ 
    history = [], 
    onSendMessage, 
    isTyping = false, 
    statusMessage = "GETE is active", 
    fullscreen = false 
}) => {
    const [inputMessage, setInputMessage] = useState('');
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll logic with "Smart Threshold"
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isTyping]);

    const quickReplies = [
        { text: 'Job Matches', icon: '💼', action: 'find jobs for my skills' },
        { text: 'Wallet', icon: '💰', action: 'check my balance' },
        { text: 'GetSkill P1', icon: '📚', action: 'my course progress' },
        { text: 'Telebirr Transfer', icon: '📤', action: 'withdraw funds' }
    ];

    const handleSend = () => {
        if (!inputMessage.trim()) return;
        onSendMessage(inputMessage);
        setInputMessage('');
        setShowQuickReplies(false);
    };

    // 2026 "Clean-Text" Formatter
    const formatMessage = (text) => {
        if (!text) return "";
        return text
            // Highlight {Actions}
            .replace(/\{(.*?)\}/g, '<span class="text-yellow-500 font-black tracking-wide">$1</span>')
            // Modern Currency Pill
            .replace(/(\d+(?:\.\d+)?)\s*(ETB|USD)/g, 
                '<span class="bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md text-yellow-500 font-mono font-bold">$1 $2</span>')
            // Bold Standard
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    };

    return (
        <div className={`flex flex-col w-full bg-zinc-950 font-sans selection:bg-yellow-500/30 ${
            fullscreen ? 'h-screen' : 'h-[700px] rounded-3xl border border-white/5 shadow-2xl'
        }`}>
            
            {/* Header / Agent Status Plate */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping opacity-40" />
                    </div>
                    <div>
                        <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">GETEDIL OS v2</h2>
                        <p className="text-xs text-zinc-200 font-medium">{isTyping ? statusMessage : 'Neural Link Active'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-1 w-8 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-yellow-500" 
                            animate={{ width: isTyping ? '100%' : '30%' }} 
                        />
                    </div>
                </div>
            </div>

            {/* Chat Flow */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {history.map((msg, i) => (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] ${msg.type === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                                
                                {/* Content Block */}
                                <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.type === 'user' 
                                        ? 'bg-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/10' 
                                        : 'bg-zinc-900/50 text-zinc-200 border border-white/5'
                                }`}>
                                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }} />
                                </div>

                                {/* Generative UI Slot (Opportunities, etc) */}
                                {msg.opportunities && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-4 w-full md:min-w-[400px]"
                                    >
                                        <OpportunityCard 
                                            opportunities={msg.opportunities}
                                            compact={!fullscreen}
                                            onSelect={(item) => onSendMessage(`Inquire about: ${item.title}`)}
                                        />
                                    </motion.div>
                                )}

                                {msg.timestamp && (
                                    <span className="text-[9px] text-zinc-600 mt-2 font-mono uppercase tracking-widest">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                        <div className="flex gap-1 bg-zinc-900 border border-white/5 px-4 py-3 rounded-2xl">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Interactive Dock (Quick Replies) */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar mask-fade-right">
                {quickReplies.map((reply, i) => (
                    <motion.button
                        key={i}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSendMessage(reply.action)}
                        className="flex-shrink-0 px-4 py-2 bg-zinc-900/40 border border-white/5 rounded-xl text-[11px] text-zinc-400 font-bold uppercase tracking-wider transition-colors"
                    >
                        <span className="mr-2 opacity-60">{reply.icon}</span>
                        {reply.text}
                    </motion.button>
                ))}
            </div>

            {/* Input Command Line */}
            <div className="p-6 pt-2">
                <div className="relative flex items-center group">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Command GETE..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 transition-all"
                    />
                    <div className="absolute right-3 flex gap-2">
                        <button 
                            onClick={handleSend}
                            disabled={!inputMessage.trim()}
                            className="bg-yellow-500 text-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-yellow-400 transition-all disabled:opacity-20"
                        >
                            Execute
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3 px-2">
                    <p className="text-[10px] text-zinc-600 font-medium">Ready for deployment on Windows</p>
                    <p className="text-[10px] text-zinc-600 font-medium">Supabase DB: Connected</p>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OpportunityCard from './OpportunityCard'; // Integrated your new component

const ChatInterface = ({ history = [], onSendMessage, isTyping = false, fullscreen = false }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll logic
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isTyping]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const quickReplies = [
        { text: 'Find jobs', icon: '💼', action: 'find jobs in Addis Ababa' },
        { text: 'My Balance', icon: '💰', action: 'check my wallet balance' },
        { text: 'GetSkill P1', icon: '📚', action: 'show me courses' },
        { text: 'Marketplace', icon: '🛒', action: 'show marketplace deals' }
    ];

    const handleSend = () => {
        if (!inputMessage.trim()) return;
        onSendMessage(inputMessage);
        setInputMessage('');
        setShowQuickReplies(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatMessage = (text) => {
        if (!text) return "";
        let formatted = text;
        // Bold & ETB Formatting
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-500">$1</strong>');
        formatted = formatted.replace(/(\d+(?:,\d+)*)\s*ETB/g, '<span class="text-yellow-500 font-bold">$1 ETB</span>');
        return formatted;
    };

    return (
        <div className={`flex flex-col w-full bg-zinc-950 overflow-hidden ${fullscreen ? 'h-screen' : 'h-[600px] rounded-2xl border border-white/10'}`}>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {history.length > 0 ? (
                    history.map((message, index) => (
                        <motion.div
                            key={message.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[90%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                                
                                {/* Text Bubble */}
                                {message.message && (
                                    <div className={`inline-block rounded-2xl p-3 text-sm shadow-sm ${
                                        message.type === 'user'
                                            ? 'bg-yellow-500 text-black font-medium'
                                            : 'bg-zinc-900 text-zinc-100 border border-white/5'
                                    }`}>
                                        <div dangerouslySetInnerHTML={{ __html: formatMessage(message.message) }} />
                                    </div>
                                )}

                                {/* INTEGRATION: If the message contains Opportunity Data */}
                                {message.opportunities && (
                                    <div className="mt-4 w-full max-w-[400px]">
                                        <OpportunityCard 
                                            opportunities={message.opportunities} 
                                            onSelect={(item) => onSendMessage(`I want to select: ${item.title}`)}
                                            compact={fullscreen ? false : true}
                                        />
                                    </div>
                                )}

                                {message.timestamp && (
                                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    /* Empty State - OS Logo Glow */
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full blur-2xl absolute" />
                        <span className="text-5xl mb-4">G</span>
                        <p className="text-xs tracking-[0.2em] uppercase font-black text-white">Neural Link Active</p>
                    </div>
                )}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-900 rounded-2xl px-4 py-3 border border-white/5">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {showQuickReplies && (
                <div className="px-4 py-2 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {quickReplies.map((reply, i) => (
                            <button
                                key={i}
                                onClick={() => { onSendMessage(reply.action); setShowQuickReplies(false); }}
                                className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-xs text-zinc-300 hover:border-yellow-500/50 transition-all"
                            >
                                {reply.icon} {reply.text}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-zinc-950 border-t border-white/5">
                <div className="flex gap-2 items-center bg-zinc-900 border border-white/10 rounded-2xl p-1 focus-within:border-yellow-500/50 transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask GETE Assistant..."
                        className="flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputMessage.trim()}
                        className="bg-yellow-500 text-black p-2 px-5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 disabled:opacity-30 transition-all"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;

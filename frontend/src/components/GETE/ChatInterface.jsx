import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ChatInterface Component
 * Conversational AI interface for GETE Assistant
 * Supports typing indicators, markdown, and quick replies
 */

const ChatInterface = ({ history, onSendMessage, isTyping = false, fullscreen = false }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isTyping]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const quickReplies = [
        { text: 'Find jobs near me', icon: '💼', action: 'find jobs in Addis Ababa' },
        { text: 'Check my balance', icon: '💰', action: 'check my wallet balance' },
        { text: 'Browse courses', icon: '📚', action: 'show me available courses' },
        { text: 'Send money', icon: '📤', action: 'send money' },
        { text: 'Get help', icon: '🤝', action: 'help me with the app' },
        { text: 'Marketplace deals', icon: '🛒', action: 'show me marketplace deals' }
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

    const handleQuickReply = (action) => {
        onSendMessage(action);
        setShowQuickReplies(false);
    };

    const formatMessage = (text) => {
        // Simple markdown-like formatting
        let formatted = text;
        
        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#EAB308]">$1</strong>');
        
        // Links
        formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#EAB308] underline">$1</a>');
        
        // Ethiopian Birr formatting
        formatted = formatted.replace(/(\d+(?:,\d+)*)\s*ETB/g, '<span class="text-[#EAB308] font-bold">$1 ETB</span>');
        
        return formatted;
    };

    return (
        <div className={`flex flex-col h-full ${fullscreen ? '' : 'h-[400px]'}`}>
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history && history.length > 0 ? (
                    history.map((message, index) => (
                        <motion.div
                            key={message.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl p-3 ${
                                    message.type === 'user'
                                        ? 'bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black'
                                        : 'bg-white/10 text-white'
                                }`}
                            >
                                {message.type === 'assistant' ? (
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: formatMessage(message.message) }}
                                        className="text-sm leading-relaxed"
                                    />
                                ) : (
                                    <p className="text-sm">{message.message}</p>
                                )}
                                
                                {message.timestamp && (
                                    <p className="text-xs opacity-70 mt-1">
                                        {new Date(message.timestamp).toLocaleTimeString('en-ET', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-[#EAB308]/20 to-[#F59E0B]/20 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">🤖</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Welcome to GETE Assistant!</h3>
                        <p className="text-slate-400 text-sm">
                            Ask me anything about jobs, courses, payments, or Ethiopian opportunities.
                        </p>
                    </div>
                )}
                
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 rounded-2xl p-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Replies */}
            {showQuickReplies && history?.length < 3 && (
                <div className="px-4 pb-2">
                    <div className="flex flex-wrap gap-2">
                        {quickReplies.map((reply, index) => (
                            <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleQuickReply(reply.action)}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-all"
                            >
                                <span className="mr-1">{reply.icon}</span>
                                {reply.text}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#EAB308] transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputMessage.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
                
                {/* Voice Input Hint */}
                <p className="text-xs text-slate-500 text-center mt-2">
                    🎤 Try voice commands or type your request
                </p>
            </div>
        </div>
    );
};

export default ChatInterface;

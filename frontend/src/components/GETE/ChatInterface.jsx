import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'date-fns';
import { amharic } from 'date-fns/locale';

/**
 * Enhanced ChatInterface Component
 * World-class conversational AI with modern UX patterns
 * Features: Markdown support, code highlighting, typing indicators, reactions, file uploads, voice notes
 */

// ============================================
// SUB-COMPONENTS
// ============================================

const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-4 py-3 bg-white/5 rounded-2xl w-fit">
        <div className="w-2 h-2 bg-[#EAB308] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-[#EAB308] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-[#EAB308] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-slate-400 ml-2">GETE is thinking...</span>
    </div>
);

const MessageReactions = ({ messageId, reactions, onReact }) => {
    const [showPicker, setShowPicker] = useState(false);
    
    const reactionOptions = [
        { emoji: '👍', label: 'Like' },
        { emoji: '❤️', label: 'Love' },
        { emoji: '😂', label: 'Laugh' },
        { emoji: '😮', label: 'Wow' },
        { emoji: '😢', label: 'Sad' },
        { emoji: '🙏', label: 'Thank' }
    ];
    
    return (
        <div className="relative">
            <div className="flex gap-1 mt-1">
                {Object.entries(reactions || {}).map(([emoji, users]) => (
                    <button
                        key={emoji}
                        onClick={() => onReact(messageId, emoji)}
                        className="text-xs bg-white/10 px-2 py-0.5 rounded-full hover:bg-white/20 transition-all"
                    >
                        {emoji} {users.length}
                    </button>
                ))}
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="text-xs text-slate-400 hover:text-white transition-all"
                >
                    +
                </button>
            </div>
            
            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute bottom-full left-0 mb-2 bg-[#1a1a2e] rounded-xl shadow-xl border border-white/10 p-2 z-10"
                    >
                        <div className="flex gap-2">
                            {reactionOptions.map(option => (
                                <button
                                    key={option.emoji}
                                    onClick={() => {
                                        onReact(messageId, option.emoji);
                                        setShowPicker(false);
                                    }}
                                    className="hover:scale-125 transition-transform p-1"
                                    title={option.label}
                                >
                                    <span className="text-xl">{option.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MessageActions = ({ message, onCopy, onRetry, onEdit, onDelete }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async () => {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col gap-1">
                <button
                    onClick={handleCopy}
                    className="w-6 h-6 bg-white/10 rounded hover:bg-white/20 transition-all text-xs"
                    title="Copy message"
                >
                    {copied ? '✓' : '📋'}
                </button>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="w-6 h-6 bg-white/10 rounded hover:bg-white/20 transition-all text-xs"
                        title="Retry"
                    >
                        ⟳
                    </button>
                )}
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="w-6 h-6 bg-white/10 rounded hover:bg-white/20 transition-all text-xs"
                        title="Edit"
                    >
                        ✎
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="w-6 h-6 bg-red-500/20 rounded hover:bg-red-500/30 transition-all text-xs"
                        title="Delete"
                    >
                        🗑
                    </button>
                )}
            </div>
        </div>
    );
};

const CodeBlock = ({ language, code }) => (
    <div className="relative rounded-lg overflow-hidden my-2">
        <div className="absolute top-0 right-0 bg-[#EAB308] text-black text-xs px-2 py-1 rounded-bl-lg">
            {language || 'code'}
        </div>
        <SyntaxHighlighter
            language={language || 'javascript'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: '0.5rem' }}
        >
            {code}
        </SyntaxHighlighter>
    </div>
);

const QuickActionButtons = ({ onAction, suggestions }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {suggestions.map((suggestion, idx) => (
            <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction(suggestion)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-all"
            >
                {suggestion.icon && <span className="mr-1">{suggestion.icon}</span>}
                {suggestion.text}
            </motion.button>
        ))}
    </div>
);

const VoiceRecorder = ({ onSend, isRecording, onStartRecording, onStopRecording }) => {
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef(null);
    
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(t => t + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        
        return () => clearInterval(timerRef.current);
    }, [isRecording]);
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
        <div className="flex items-center gap-2">
            {isRecording ? (
                <>
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-white">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                        onClick={onStopRecording}
                        className="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                    >
                        ⏹️ Stop
                    </button>
                </>
            ) : (
                <button
                    onClick={onStartRecording}
                    className="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                >
                    🎤 Voice Message
                </button>
            )}
        </div>
    );
};

const FileUpload = ({ onUpload, isUploading }) => {
    const fileInputRef = useRef(null);
    
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Maximum size is 10MB.');
            return;
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Unsupported file type. Please upload images or PDF.');
            return;
        }
        
        await onUpload(file);
        fileInputRef.current.value = '';
    };
    
    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50"
            >
                {isUploading ? '📤 Uploading...' : '📎 Attach'}
            </button>
        </>
    );
};

// ============================================
// MAIN CHAT INTERFACE COMPONENT
// ============================================

const ChatInterface = ({ 
    history, 
    onSendMessage, 
    isTyping = false, 
    fullscreen = false,
    onUploadFile,
    user,
    suggestions = []
}) => {
    const [inputMessage, setInputMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [reactions, setReactions] = useState({});
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Auto-scroll logic
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    const handleScroll = useCallback(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    }, []);

    // Format message with markdown and syntax highlighting
    const formatMessageContent = useCallback((content) => {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                        ) : (
                            <code className="bg-white/10 px-1 py-0.5 rounded text-sm" {...props}>
                                {children}
                            </code>
                        );
                    },
                    a({ href, children }) {
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#EAB308] hover:underline">
                                {children}
                            </a>
                        );
                    },
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-2">
                                <table className="min-w-full border-collapse border border-white/20">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    th({ children }) {
                        return <th className="border border-white/20 px-3 py-2 bg-white/10">{children}</th>;
                    },
                    td({ children }) {
                        return <td className="border border-white/20 px-3 py-2">{children}</td>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        );
    }, []);

    // Send message handler
    const handleSend = useCallback(async () => {
        if (!inputMessage.trim() && !editingMessage) return;
        
        const messageToSend = editingMessage ? editingMessage.newText : inputMessage;
        
        onSendMessage(messageToSend);
        setInputMessage('');
        setEditingMessage(null);
        
        // Track analytics
        if (window.gtag) {
            window.gtag('event', 'chat_message_sent', {
                message_length: messageToSend.length,
                has_editing: !!editingMessage
            });
        }
    }, [inputMessage, editingMessage, onSendMessage]);

    // Voice recording handlers
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Send audio as base64 or upload to server
                    onSendMessage('[Voice message]', audioBlob);
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Microphone access denied. Please check your permissions.');
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // File upload handler
    const handleFileUpload = async (file) => {
        if (!onUploadFile) return;
        
        setIsUploading(true);
        try {
            const result = await onUploadFile(file);
            onSendMessage(`[File: ${file.name}]`, result.url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Message reaction handler
    const handleReaction = useCallback((messageId, emoji) => {
        setReactions(prev => {
            const currentReactions = prev[messageId] || {};
            const userReaction = currentReactions[emoji];
            
            if (userReaction && userReaction.includes(user?.id)) {
                // Remove reaction
                const updated = currentReactions[emoji].filter(id => id !== user?.id);
                if (updated.length === 0) {
                    delete currentReactions[emoji];
                } else {
                    currentReactions[emoji] = updated;
                }
            } else {
                // Add reaction
                currentReactions[emoji] = [...(currentReactions[emoji] || []), user?.id];
            }
            
            return { ...prev, [messageId]: currentReactions };
        });
        
        // API call to save reaction
        fetch('/api/chat/reaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId, emoji })
        });
    }, [user]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + Enter to send
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSend();
            }
            // Escape to cancel editing
            if (e.key === 'Escape' && editingMessage) {
                setEditingMessage(null);
                setInputMessage('');
            }
            // Ctrl/Cmd + K to focus input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleSend, editingMessage]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
        }
    }, [inputMessage]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (!showScrollButton) {
            scrollToBottom();
        }
    }, [history, isTyping, scrollToBottom, showScrollButton]);

    return (
        <div className={`flex flex-col h-full bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] ${fullscreen ? '' : 'rounded-2xl'}`}>
            {/* Chat Header */}
            {fullscreen && (
                <div className="bg-gradient-to-r from-[#EAB308]/20 to-transparent p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] rounded-full flex items-center justify-center">
                            <span className="text-black font-bold text-lg">G</span>
                        </div>
                        <div>
                            <h2 className="text-white font-semibold">GETE Assistant</h2>
                            <p className="text-xs text-slate-400">Online • AI-Powered Ethiopian Assistant</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Messages Area */}
            <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
                {history && history.length > 0 ? (
                    history.map((message, index) => (
                        <motion.div
                            key={message.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`group flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} relative`}
                        >
                            {/* Avatar */}
                            {message.type === 'assistant' && (
                                <div className="flex-shrink-0 mr-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] rounded-full flex items-center justify-center">
                                        <span className="text-black text-sm font-bold">G</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Message Bubble */}
                            <div className={`relative max-w-[85%] ${message.type === 'user' ? 'order-1' : ''}`}>
                                <div
                                    className={`rounded-2xl p-3 ${
                                        message.type === 'user'
                                            ? 'bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black'
                                            : 'bg-white/10 text-white'
                                    }`}
                                >
                                    {/* Timestamp */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs opacity-70">
                                            {message.timestamp 
                                                ? format(new Date(message.timestamp), 'h:mm a', { locale: amharic })
                                                : format(new Date(), 'h:mm a')}
                                        </span>
                                        {message.type === 'user' && message.status && (
                                            <span className="text-xs opacity-70">
                                                {message.status === 'sent' && '✓'}
                                                {message.status === 'delivered' && '✓✓'}
                                                {message.status === 'read' && '✓✓'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Message Content */}
                                    {message.type === 'assistant' ? (
                                        <div className="prose prose-invert max-w-none">
                                            {formatMessageContent(message.message)}
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.message}
                                        </p>
                                    )}
                                    
                                    {/* File Attachment Preview */}
                                    {message.fileUrl && (
                                        <div className="mt-2">
                                            {message.fileType?.startsWith('image/') ? (
                                                <img 
                                                    src={message.fileUrl} 
                                                    alt="Attachment" 
                                                    className="max-w-full rounded-lg cursor-pointer"
                                                    onClick={() => window.open(message.fileUrl)}
                                                />
                                            ) : (
                                                <a 
                                                    href={message.fileUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-sm underline"
                                                >
                                                    📎 View attachment
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Reactions */}
                                <MessageReactions
                                    messageId={message.id}
                                    reactions={reactions[message.id]}
                                    onReact={handleReaction}
                                />
                                
                                {/* Message Actions */}
                                <MessageActions
                                    message={message.message}
                                    onCopy={() => console.log('Copied!')}
                                    onRetry={message.type === 'user' && message.status === 'failed' ? () => onSendMessage(message.message) : null}
                                    onEdit={message.type === 'user' ? () => {
                                        setEditingMessage({ id: message.id, oldText: message.message, newText: message.message });
                                        setInputMessage(message.message);
                                        inputRef.current?.focus();
                                    } : null}
                                    onDelete={message.type === 'user' ? () => {
                                        if (confirm('Delete this message?')) {
                                            // Handle delete
                                        }
                                    } : null}
                                />
                            </div>
                            
                            {/* User Avatar */}
                            {message.type === 'user' && (
                                <div className="flex-shrink-0 ml-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-[#EAB308]/20 to-[#F59E0B]/20 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">👤</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10 }}
                            className="w-24 h-24 bg-gradient-to-r from-[#EAB308]/20 to-[#F59E0B]/20 rounded-full flex items-center justify-center mb-4"
                        >
                            <span className="text-5xl">🤖</span>
                        </motion.div>
                        <h3 className="text-xl font-bold text-white mb-2">Welcome to GETE Assistant</h3>
                        <p className="text-slate-400 max-w-md">
                            Your AI-powered guide to Ethiopian opportunities. Ask me about jobs, courses, payments, or anything else!
                        </p>
                    </div>
                )}
                
                {/* Typing Indicator */}
                {isTyping && <TypingIndicator />}
                
                {/* Suggested Actions */}
                {suggestions.length > 0 && history?.length < 2 && (
                    <QuickActionButtons 
                        suggestions={suggestions} 
                        onAction={onSendMessage}
                    />
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            {/* Scroll to Bottom Button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-24 right-6 w-10 h-10 bg-[#EAB308] rounded-full shadow-lg flex items-center justify-center text-black hover:scale-110 transition-all"
                    >
                        ↓
                    </motion.button>
                )}
            </AnimatePresence>
            
            {/* Input Area */}
            <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm p-4">
                {/* Editing Indicator */}
                {editingMessage && (
                    <div className="mb-2 px-3 py-1 bg-[#EAB308]/20 rounded-lg text-sm text-[#EAB308] flex justify-between items-center">
                        <span>✏️ Editing message</span>
                        <button onClick={() => setEditingMessage(null)} className="hover:text-white">Cancel</button>
                    </div>
                )}
                
                {/* Input Row */}
                <div className="flex gap-2 items-end">
                    {/* File Upload Button */}
                    <FileUpload onUpload={handleFileUpload} isUploading={isUploading} />
                    
                    {/* Voice Recorder */}
                    <VoiceRecorder
                        onSend={onSendMessage}
                        isRecording={isRecording}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                    />
                    
                    {/* Text Input */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your message... (Ctrl+Enter to send)"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#EAB308] resize-none transition-all"
                            rows={1}
                            style={{ minHeight: '42px', maxHeight: '150px' }}
                        />
                        
                        {/* Character Counter */}
                        {inputMessage.length > 0 && (
                            <div className="absolute bottom-1 right-2 text-xs text-slate-500">
                                {inputMessage.length}/2000
                            </div>
                        )}
                    </div>
                    
                    {/* Send Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        disabled={!inputMessage.trim() && !editingMessage}
                        className="px-4 py-2 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editingMessage ? 'Save' : 'Send'}
                    </motion.button>
                </div>
                
                {/* Input Tips */}
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                    <div className="flex gap-3">
                        <span>💡 Markdown supported</span>
                        <span>🔒 End-to-end encrypted</span>
                    </div>
                    <div className="flex gap-3">
                        <span>Ctrl + K to focus</span>
                        <span>Shift + Enter for new line</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;

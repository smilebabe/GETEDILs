// frontend/src/components/GETE/GETEAssistant.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useGETE } from '../../hooks/useGETE';
import { eventBus } from '../../lib/event-bus';
import { voiceIntentParser } from '../../lib/voice-intent-parser';
import { contextBuilder } from '../../lib/context-builder';

// ============================================
// COMPONENT IMPORTS
// ============================================
import CommandCenter from './CommandCenter';
import SuggestionChips from './SuggestionChips';
import VoiceWaveform from './VoiceWaveform';
import OpportunityCard from './OpportunityCard';
import SmartAlerts from './SmartAlerts';
import ChatInterface from './ChatInterface';
import QuickActions from './QuickActions';
import OnboardingWizard from './OnboardingWizard';
import GETEWidget from './GETEWidget';

// ============================================
// MAIN GETE ASSISTANT COMPONENT
// ============================================

const GETEAssistant = ({ isOpen, onClose, initialView = 'compact' }) => {
    // State Management
    const [view, setView] = useState(initialView); // 'compact', 'expanded', 'fullscreen'
    const [activeTab, setActiveTab] = useState('assistant'); // 'assistant', 'opportunities', 'alerts', 'chat'
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [context, setContext] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    
    // Refs
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const recognitionRef = useRef(null);
    
    // Hooks
    const { user, profile } = useAuth();
    const { balance } = useWallet();
    const { 
        processIntent, 
        getPersonalizedFeed, 
        getSmartAlerts,
        getContextualSuggestions,
        trackInteraction 
    } = useGETE();
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    useEffect(() => {
        if (user && isOpen) {
            initializeGETE();
            loadPersonalizedData();
        }
        
        return () => {
            cleanup();
        };
    }, [user, isOpen]);
    
    const initializeGETE = async () => {
        try {
            // Build user context
            const userContext = await contextBuilder.buildContext({
                userId: user.id,
                profile,
                walletBalance: balance,
                recentActivity: await fetchRecentActivity(),
                location: profile?.region,
                preferences: profile?.preferences
            });
            setContext(userContext);
            
            // Load suggestions
            const initialSuggestions = await getContextualSuggestions(userContext);
            setSuggestions(initialSuggestions);
            
            // Initialize voice recognition
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'am-ET'; // Amharic language support
                
                recognitionRef.current.onresult = handleSpeechResult;
                recognitionRef.current.onerror = handleSpeechError;
            }
            
        } catch (error) {
            console.error('Failed to initialize GETE:', error);
        }
    };
    
    const loadPersonalizedData = async () => {
        try {
            // Load opportunities feed
            const feed = await getPersonalizedFeed({ limit: 10 });
            setOpportunities(feed);
            
            // Load smart alerts
            const alerts = await getSmartAlerts();
            setAlerts(alerts);
            
            // Load chat history
            const history = await loadChatHistory();
            setChatHistory(history);
            
        } catch (error) {
            console.error('Failed to load personalized data:', error);
        }
    };
    
    // ============================================
    // VOICE RECOGNITION HANDLERS
    // ============================================
    
    const startListening = async () => {
        if (!recognitionRef.current) {
            eventBus.emit('notification:show', {
                type: 'error',
                title: 'Voice Not Supported',
                message: 'Your browser does not support voice recognition. Please type your command.'
            });
            return;
        }
        
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognitionRef.current.start();
            setIsListening(true);
            
            // Start waveform animation
            if (audioContextRef.current) {
                audioContextRef.current.resume();
            }
            
            eventBus.emit('analytics:track', {
                event: 'voice_listening_started',
                source: 'gete_assistant'
            });
            
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            eventBus.emit('notification:show', {
                type: 'error',
                title: 'Microphone Access Denied',
                message: 'Please allow microphone access to use voice commands.'
            });
        }
    };
    
    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            
            eventBus.emit('analytics:track', {
                event: 'voice_listening_stopped',
                duration: Date.now() - (window._voiceStartTime || Date.now())
            });
        }
    };
    
    const handleSpeechResult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        // Process voice command in real-time
        if (event.results[current].isFinal) {
            processVoiceCommand(transcriptText);
        }
    };
    
    const handleSpeechError = (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        
        eventBus.emit('notification:show', {
            type: 'warning',
            title: 'Voice Recognition Error',
            message: 'Please try again or type your command.'
        });
    };
    
    // ============================================
    // COMMAND PROCESSING
    // ============================================
    
    const processVoiceCommand = async (command) => {
        setIsProcessing(true);
        
        try {
            // Parse voice intent
            const intent = await voiceIntentParser.parse(command, context);
            
            // Process intent through GETE AI
            const result = await processIntent(intent, {
                userId: user?.id,
                context,
                commandHistory: chatHistory
            });
            
            // Display response
            setResponse(result.message);
            
            // Add to chat history
            const newChatEntry = {
                id: Date.now(),
                type: 'user',
                message: command,
                timestamp: new Date().toISOString()
            };
            
            const newResponseEntry = {
                id: Date.now() + 1,
                type: 'assistant',
                message: result.message,
                actions: result.actions,
                timestamp: new Date().toISOString()
            };
            
            setChatHistory(prev => [...prev, newChatEntry, newResponseEntry]);
            
            // Execute any actions
            if (result.actions && result.actions.length > 0) {
                await executeActions(result.actions);
            }
            
            // Track successful interaction
            await trackInteraction({
                type: 'voice_command',
                command,
                intent: intent.type,
                success: true
            });
            
            // Clear transcript after processing
            setTimeout(() => setTranscript(''), 2000);
            
        } catch (error) {
            console.error('Failed to process command:', error);
            setResponse('I didn\'t understand that. Could you please rephrase?');
            
            await trackInteraction({
                type: 'voice_command',
                command,
                success: false,
                error: error.message
            });
            
        } finally {
            setIsProcessing(false);
        }
    };
    
    const executeActions = async (actions) => {
        for (const action of actions) {
            switch (action.type) {
                case 'navigate':
                    eventBus.emit('navigation:goTo', action.payload.pillar);
                    break;
                case 'transaction':
                    await handleTransaction(action.payload);
                    break;
                case 'notification':
                    eventBus.emit('notification:show', action.payload);
                    break;
                case 'search':
                    eventBus.emit('search:execute', action.payload.query);
                    break;
                default:
                    console.warn('Unknown action type:', action.type);
            }
        }
    };
    
    const handleTransaction = async (payload) => {
        // Handle various transaction types (send money, pay bills, etc.)
        eventBus.emit('transaction:initiate', payload);
    };
    
    // ============================================
    // TEXT COMMAND HANDLING
    // ============================================
    
    const handleTextCommand = async (command) => {
        if (!command.trim()) return;
        
        setIsProcessing(true);
        
        try {
            const result = await processIntent(command, {
                userId: user?.id,
                context,
                commandHistory: chatHistory
            });
            
            setResponse(result.message);
            
            const newChatEntry = {
                id: Date.now(),
                type: 'user',
                message: command,
                timestamp: new Date().toISOString()
            };
            
            const newResponseEntry = {
                id: Date.now() + 1,
                type: 'assistant',
                message: result.message,
                actions: result.actions,
                timestamp: new Date().toISOString()
            };
            
            setChatHistory(prev => [...prev, newChatEntry, newResponseEntry]);
            
            if (result.actions) {
                await executeActions(result.actions);
            }
            
            await trackInteraction({
                type: 'text_command',
                command,
                intent: result.intent,
                success: true
            });
            
        } catch (error) {
            console.error('Failed to process text command:', error);
            setResponse('Sorry, I encountered an error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    const fetchRecentActivity = async () => {
        // Fetch recent user activity from various pillars
        try {
            const [transactions, enrollments, jobs] = await Promise.all([
                fetchRecentTransactions(),
                fetchRecentEnrollments(),
                fetchRecentJobApplications()
            ]);
            
            return { transactions, enrollments, jobs };
        } catch (error) {
            console.error('Failed to fetch recent activity:', error);
            return {};
        }
    };
    
    const loadChatHistory = async () => {
        // Load chat history from local storage or backend
        const saved = localStorage.getItem(`gete_chat_${user?.id}`);
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    };
    
    const cleanup = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
    
    // ============================================
    // RENDER METHODS
    // ============================================
    
    const renderCompactView = () => (
        <GETEWidget
            onExpand={() => setView('expanded')}
            suggestions={suggestions.slice(0, 3)}
            unreadAlerts={alerts.filter(a => !a.read).length}
        />
    );
    
    const renderExpandedView = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] rounded-2xl shadow-2xl border border-[#EAB308]/30 overflow-hidden z-50"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EAB308]/20 to-transparent p-4 border-b border-white/10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] rounded-full flex items-center justify-center">
                            <span className="text-black font-bold">G</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">GETE Assistant</h3>
                            <p className="text-xs text-slate-400">AI-Powered Ethiopian Assistant</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('fullscreen')}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                        >
                            ⬚
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {['assistant', 'opportunities', 'alerts', 'chat'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-medium transition-all ${
                            activeTab === tab
                                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'assistant' && (
                    <>
                        <CommandCenter
                            onCommand={handleTextCommand}
                            isListening={isListening}
                            onStartListening={startListening}
                            onStopListening={stopListening}
                            transcript={transcript}
                            isProcessing={isProcessing}
                            response={response}
                        />
                        
                        <SuggestionChips
                            suggestions={suggestions}
                            onSelect={handleTextCommand}
                        />
                        
                        <VoiceWaveform isActive={isListening} />
                    </>
                )}
                
                {activeTab === 'opportunities' && (
                    <OpportunityCard opportunities={opportunities} />
                )}
                
                {activeTab === 'alerts' && (
                    <SmartAlerts alerts={alerts} onAlertClick={handleTextCommand} />
                )}
                
                {activeTab === 'chat' && (
                    <ChatInterface
                        history={chatHistory}
                        onSendMessage={handleTextCommand}
                        isTyping={isProcessing}
                    />
                )}
            </div>
            
            {/* Quick Actions */}
            <QuickActions onAction={handleTextCommand} />
        </motion.div>
    );
    
    const renderFullscreenView = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50"
        >
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#EAB308]/20 to-transparent p-6 border-b border-white/10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] rounded-xl flex items-center justify-center">
                                <span className="text-black text-2xl font-bold">G</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">GETE Assistant</h1>
                                <p className="text-slate-400">Your AI-Powered Ethiopian Super-App Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setView('expanded')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                            ─
                        </button>
                    </div>
                </div>
                
                {/* Main Content - Two Column Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Context & Suggestions */}
                    <div className="w-80 border-r border-white/10 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="text-white font-semibold mb-2">Context</h3>
                            <div className="space-y-2">
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Location</p>
                                    <p className="text-white">{profile?.region || 'Ethiopia'}</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Wallet Balance</p>
                                    <p className="text-white">{balance?.toLocaleString()} ETB</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Trust Score</p>
                                    <p className="text-white">{profile?.trust_score || 0}/10</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-white font-semibold mb-2">Smart Suggestions</h3>
                            <div className="space-y-2">
                                {suggestions.slice(0, 5).map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleTextCommand(suggestion)}
                                        className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all"
                                    >
                                        <p className="text-sm text-white">{suggestion}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        <ChatInterface
                            history={chatHistory}
                            onSendMessage={handleTextCommand}
                            isTyping={isProcessing}
                            fullscreen
                        />
                    </div>
                    
                    {/* Right Sidebar - Opportunities & Alerts */}
                    <div className="w-80 border-l border-white/10 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="text-white font-semibold mb-2">Opportunities</h3>
                            <OpportunityCard opportunities={opportunities.slice(0, 3)} compact />
                        </div>
                        
                        <div>
                            <h3 className="text-white font-semibold mb-2">Smart Alerts</h3>
                            <SmartAlerts alerts={alerts.slice(0, 3)} onAlertClick={handleTextCommand} compact />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
    
    if (!isOpen) return null;
    
    return (
        <AnimatePresence>
            {view === 'compact' && renderCompactView()}
            {view === 'expanded' && renderExpandedView()}
            {view === 'fullscreen' && renderFullscreenView()}
        </AnimatePresence>
    );
};

export default GETEAssistant;

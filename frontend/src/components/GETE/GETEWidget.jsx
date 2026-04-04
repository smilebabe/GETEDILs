import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GETEWidget Component
 * Floating GETE Assistant widget with expand/collapse functionality
 * Features Ethiopian-inspired design with holographic effects
 */

const GETEWidget = ({ onExpand, suggestions, unreadAlerts }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: null, y: null });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [pulseAnimation, setPulseAnimation] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Load saved position
    useEffect(() => {
        const savedPosition = localStorage.getItem('gete_widget_position');
        if (savedPosition) {
            setPosition(JSON.parse(savedPosition));
        }
    }, []);

    // Pulse animation for unread alerts
    useEffect(() => {
        if (unreadAlerts > 0) {
            const interval = setInterval(() => {
                setPulseAnimation(prev => !prev);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [unreadAlerts]);

    const handleDragStart = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - (position.x || window.innerWidth - 80),
            y: e.clientY - (position.y || window.innerHeight - 100)
        });
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain to viewport
        const constrainedX = Math.min(Math.max(newX, 20), window.innerWidth - 100);
        const constrainedY = Math.min(Math.max(newY, 20), window.innerHeight - 100);
        
        setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (position.x && position.y) {
            localStorage.setItem('gete_widget_position', JSON.stringify(position));
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDragging, dragStart]);

    const widgetStyle = position.x && position.y
        ? { position: 'fixed', bottom: 'auto', right: 'auto', left: position.x, top: position.y }
        : { position: 'fixed', bottom: '24px', right: '24px' };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={widgetStyle}
            className="z-50"
            drag={false}
        >
            {/* Expanded View */}
            <AnimatePresence>
                {!isMinimized && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-80 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] rounded-2xl shadow-2xl border border-[#EAB308]/30 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#EAB308]/20 to-transparent p-3 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] rounded-full flex items-center justify-center">
                                        <span className="text-black font-bold text-sm">G</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-semibold">GETE Assistant</h4>
                                        <p className="text-xs text-slate-400">AI-Powered</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    ─
                                </button>
                            </div>
                        </div>
                        
                        {/* Suggestions */}
                        <div className="p-3">
                            <p className="text-xs text-slate-400 mb-2">Suggestions</p>
                            {suggestions?.slice(0, 3).map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onExpand?.()}
                                    className="w-full text-left text-sm text-white py-1.5 hover:text-[#EAB308] transition-colors"
                                >
                                    💡 {suggestion}
                                </button>
                            ))}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="p-3 pt-0">
                            <button
                                onClick={() => onExpand?.()}
                                className="w-full py-2 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black font-semibold rounded-lg text-sm hover:shadow-lg transition-all"
                            >
                                Open GETE Assistant
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Main Widget Button */}
            <motion.button
                onClick={() => isMinimized ? setIsMinimized(false) : onExpand?.()}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={handleDragStart}
                className={`relative w-14 h-14 rounded-full bg-gradient-to-r from-[#EAB308] to-[#F59E0B] shadow-2xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing ${
                    pulseAnimation ? 'animate-pulse' : ''
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: isHovered 
                        ? '0 0 30px rgba(234, 179, 8, 0.8)' 
                        : '0 0 15px rgba(234, 179, 8, 0.5)'
                }}
            >
                {/* GETE Logo */}
                <span className="text-2xl font-bold text-black">G</span>
                
                {/* Status Indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
                
                {/* Unread Badge */}
                {unreadAlerts > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    >
                        {unreadAlerts > 9 ? '9+' : unreadAlerts}
                    </motion.div>
                )}
                
                {/* Ripple Effect */}
                <div className="absolute inset-0 rounded-full bg-[#EAB308] opacity-0 animate-ripple" />
                
                {/* Holographic Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-[#EAB308]/50 animate-ping" style={{ animationDuration: '2s' }} />
            </motion.button>
            
            {/* Drag Hint */}
            <AnimatePresence>
                {isHovered && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-slate-400"
                    >
                        Drag to move
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Ethiopian Flag Accent */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-75" />
        </motion.div>
    );
};

export default GETEWidget;

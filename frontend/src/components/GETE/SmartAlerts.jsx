import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SmartAlerts Component
 * Proactive AI-powered notifications for Ethiopian users
 * Features urgency levels and action buttons
 */

const SmartAlerts = ({ alerts, onAlertClick, compact = false }) => {
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

    const getAlertIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            case 'opportunity': return '🎯';
            case 'reminder': return '⏰';
            default: return '🔔';
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'high': return 'from-red-500/20 to-red-600/20 border-red-500/50';
            case 'medium': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50';
            case 'low': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50';
            default: return 'from-white/10 to-white/5 border-white/10';
        }
    };

    const handleDismiss = (alertId, e) => {
        e.stopPropagation();
        setDismissedAlerts(prev => new Set(prev).add(alertId));
    };

    const activeAlerts = alerts?.filter(alert => !dismissedAlerts.has(alert.id)) || [];

    if (activeAlerts.length === 0) {
        return (
            <div className="text-center p-8">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-slate-400">All caught up!</p>
                <p className="text-slate-500 text-sm mt-1">No new alerts at the moment</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {activeAlerts.slice(0, compact ? 3 : 10).map((alert, index) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        layout
                        whileHover={{ scale: compact ? 1 : 1.02 }}
                        onClick={() => onAlertClick?.(alert.action || alert.message)}
                        className={`bg-gradient-to-r ${getUrgencyColor(alert.urgency)} rounded-xl border p-3 cursor-pointer transition-all ${
                            compact ? 'p-2' : 'p-4'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Alert Icon */}
                            <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-black/30 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <span className={`${compact ? 'text-lg' : 'text-xl'}`}>
                                    {getAlertIcon(alert.type)}
                                </span>
                            </div>
                            
                            {/* Alert Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-white`}>
                                        {alert.title}
                                    </h4>
                                    <button
                                        onClick={(e) => handleDismiss(alert.id, e)}
                                        className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-300 mt-1`}>
                                    {alert.message}
                                </p>
                                
                                {/* Action Button */}
                                {alert.actionLabel && !compact && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAlertClick?.(alert.action);
                                        }}
                                        className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-all"
                                    >
                                        {alert.actionLabel}
                                    </button>
                                )}
                                
                                {/* Timestamp */}
                                {alert.timestamp && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(alert.timestamp).toLocaleTimeString('en-ET', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SmartAlerts;

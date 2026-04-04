import React from 'react';
import { motion } from 'framer-motion';

/**
 * QuickActions Component
 * Fast-access action buttons for common GETE tasks
 * Ethiopian-specific quick actions for productivity
 */

const QuickActions = ({ onAction, className = '' }) => {
    const actions = [
        {
            id: 'send_money',
            label: 'Send Money',
            icon: '📤',
            color: 'from-green-500 to-emerald-600',
            command: 'send money to'
        },
        {
            id: 'find_jobs',
            label: 'Find Jobs',
            icon: '💼',
            color: 'from-blue-500 to-cyan-600',
            command: 'find jobs near me'
        },
        {
            id: 'browse_courses',
            label: 'Browse Courses',
            icon: '📚',
            color: 'from-purple-500 to-pink-600',
            command: 'show me available courses'
        },
        {
            id: 'marketplace',
            label: 'Marketplace',
            icon: '🛒',
            color: 'from-orange-500 to-red-600',
            command: 'open marketplace'
        },
        {
            id: 'telegram_share',
            label: 'Share',
            icon: '📱',
            color: 'from-sky-500 to-blue-600',
            command: 'share this with my Telegram contacts'
        },
        {
            id: 'help',
            label: 'Help',
            icon: '🤝',
            color: 'from-slate-500 to-gray-600',
            command: 'help me navigate the app'
        }
    ];

    const handleAction = (action) => {
        onAction(action.command);
        
        // Track quick action usage
        if (window.gtag) {
            window.gtag('event', 'quick_action_click', {
                action_id: action.id,
                action_label: action.label
            });
        }
    };

    return (
        <div className={`bg-gradient-to-t from-black/50 to-transparent p-4 ${className}`}>
            <div className="grid grid-cols-3 gap-3">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction(action)}
                        className={`group relative bg-gradient-to-br ${action.color} rounded-xl p-3 text-center overflow-hidden`}
                    >
                        {/* Holographic Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12" />
                        
                        <div className="relative">
                            <div className="text-2xl mb-1">{action.icon}</div>
                            <div className="text-xs font-semibold text-white">
                                {action.label}
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
            
            {/* Pro Tip */}
            <div className="mt-3 text-center">
                <p className="text-xs text-slate-400">
                    💡 Pro tip: Long press any action for more options
                </p>
            </div>
        </div>
    );
};

export default QuickActions;

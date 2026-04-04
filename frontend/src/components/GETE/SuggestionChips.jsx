import React from 'react';
import { motion } from 'framer-motion';

/**
 * SuggestionChips Component
 * Displays contextual AI-powered suggestions as interactive chips
 * Optimized for Ethiopian user behavior patterns
 */

const SuggestionChips = ({ suggestions, onSelect, isLoading = false }) => {
    // Ethiopian-specific suggestion icons
    const getSuggestionIcon = (suggestion) => {
        const lowerSuggestion = suggestion.toLowerCase();
        if (lowerSuggestion.includes('job') || lowerSuggestion.includes('ሥራ')) return '💼';
        if (lowerSuggestion.includes('course') || lowerSuggestion.includes('ኮርስ')) return '📚';
        if (lowerSuggestion.includes('money') || lowerSuggestion.includes('ገንዘብ')) return '💰';
        if (lowerSuggestion.includes('send') || lowerSuggestion.includes('ላክ')) return '📤';
        if (lowerSuggestion.includes('buy') || lowerSuggestion.includes('ግዛ')) return '🛒';
        if (lowerSuggestion.includes('sell') || lowerSuggestion.includes('ሽጥ')) return '🏪';
        if (lowerSuggestion.includes('help') || lowerSuggestion.includes('እገዛ')) return '🤝';
        return '✨';
    };

    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-2 p-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-10 w-24 bg-white/5 rounded-full animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return (
            <div className="text-center p-4">
                <p className="text-slate-400 text-sm">No suggestions available</p>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2 p-4">
            {suggestions.map((suggestion, index) => (
                <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(suggestion)}
                    className="group relative px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-[#EAB308]/20 hover:to-[#F59E0B]/20 rounded-full border border-white/10 hover:border-[#EAB308]/50 transition-all duration-300"
                >
                    {/* Holographic shimmer effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12" />
                    
                    <span className="relative flex items-center gap-2 text-sm text-white">
                        <span className="text-base">{getSuggestionIcon(suggestion)}</span>
                        <span>{suggestion}</span>
                    </span>
                </motion.button>
            ))}
        </div>
    );
};

export default SuggestionChips;

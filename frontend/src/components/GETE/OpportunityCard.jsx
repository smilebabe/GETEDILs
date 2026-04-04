import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OpportunityCard Component
 * Displays personalized job and course opportunities for GETEDIL-OS.
 * Features: Ethiopian-specific pricing, trust scores, and responsive expansion.
 */

const OpportunityCard = ({ opportunities = [], onSelect, compact = false }) => {
    const [expandedId, setExpandedId] = useState(null);

    // Formatter for ETB Currency
    const formatPrice = (price) => {
        if (price === undefined || price === null || price === 0) return "Negotiable";
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getOpportunityIcon = (type) => {
        switch (type) {
            case 'job': return '💼';
            case 'course': return '📚';
            case 'gig': return '⚡';
            case 'tender': return '📋';
            default: return '🎯';
        }
    };

    const getMatchColor = (score) => {
        if (score >= 0.8) return 'text-emerald-400';
        if (score >= 0.6) return 'text-yellow-400';
        return 'text-orange-400';
    };

    if (!opportunities || opportunities.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <div className="text-4xl mb-3 opacity-50">🔍</div>
                <p className="text-zinc-400 font-medium">No matches found right now</p>
                <p className="text-zinc-500 text-sm mt-1">Adjust your skills in P1 (GetSkill) to see more.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {opportunities.map((opportunity, index) => {
                const isExpanded = expandedId === (opportunity.id || index);
                
                return (
                    <motion.div
                        key={opportunity.id || index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -2 }}
                        onClick={() => !compact && setExpandedId(isExpanded ? null : (opportunity.id || index))}
                        className={`group relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 hover:border-yellow-500/40 transition-all cursor-pointer ${
                            compact ? 'p-3 rounded-xl' : 'p-5 rounded-2xl'
                        }`}
                    >
                        {/* Glow Effect on Hover */}
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="flex items-start gap-4">
                            {/* Icon / Branding */}
                            <div className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5`}>
                                <span className={`${compact ? 'text-xl' : 'text-3xl'}`}>
                                    {getOpportunityIcon(opportunity.type)}
                                </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white truncate group-hover:text-yellow-500 transition-colors`}>
                                        {opportunity.title}
                                    </h3>
                                    {opportunity.match_score && (
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${getMatchColor(opportunity.match_score)}`}>
                                                {Math.round(opportunity.match_score * 100)}% Match
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    {opportunity.employer && (
                                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                                            <span className="opacity-50">🏢</span> {opportunity.employer}
                                        </span>
                                    )}
                                    {opportunity.location && (
                                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                                            <span className="opacity-50">📍</span> {opportunity.location}
                                        </span>
                                    )}
                                </div>
                                
                                {!compact && opportunity.description && (
                                    <p className="text-sm text-zinc-500 mt-3 line-clamp-2 leading-relaxed">
                                        {opportunity.description}
                                    </p>
                                )}
                                
                                {/* Action / Pricing Row */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                                            {opportunity.type === 'job' ? 'Budget/Salary' : 'Enrollment Fee'}
                                        </span>
                                        <span className="text-yellow-500 font-bold text-base">
                                            {opportunity.salary_min 
                                                ? `${formatPrice(opportunity.salary_min)} - ${formatPrice(opportunity.salary_max)}`
                                                : formatPrice(opportunity.price)}
                                        </span>
                                    </div>
                                    
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect?.(opportunity);
                                        }}
                                        className="px-5 py-2 rounded-lg bg-yellow-500 text-black text-xs font-black uppercase tracking-wider hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg shadow-yellow-500/10"
                                    >
                                        {opportunity.type === 'job' ? 'Apply' : 'View'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Expanded Details Section */}
                        <AnimatePresence>
                            {!compact && isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
                                        {opportunity.skills?.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Required Capabilities</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {opportunity.skills.map((skill, i) => (
                                                        <span key={i} className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-zinc-300">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {opportunity.benefits && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {opportunity.benefits.map((benefit, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                                                        <span className="text-yellow-500">✔</span> {benefit}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default OpportunityCard;

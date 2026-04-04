import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OpportunityCard Component
 * Displays personalized job and course opportunities
 * Features Ethiopian-specific pricing and location formatting
 */

const OpportunityCard = ({ opportunities, onSelect, compact = false }) => {
    const [expandedId, setExpandedId] = useState(null);

    const formatPrice = (price) => {
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
        if (score >= 0.8) return 'text-green-400';
        if (score >= 0.6) return 'text-yellow-400';
        return 'text-orange-400';
    };

    if (!opportunities || opportunities.length === 0) {
        return (
            <div className="text-center p-8">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-slate-400">No opportunities found</p>
                <p className="text-slate-500 text-sm mt-1">Check back later for personalized recommendations</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {opportunities.map((opportunity, index) => (
                <motion.div
                    key={opportunity.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: compact ? 1 : 1.02 }}
                    onClick={() => !compact && setExpandedId(expandedId === opportunity.id ? null : opportunity.id)}
                    className={`bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10 hover:border-[#EAB308]/30 transition-all cursor-pointer ${
                        compact ? 'p-3' : 'p-4'
                    }`}
                >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-[#EAB308]/20 to-[#F59E0B]/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className={`${compact ? 'text-xl' : 'text-2xl'}`}>
                                {getOpportunityIcon(opportunity.type)}
                            </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-white truncate`}>
                                    {opportunity.title}
                                </h3>
                                {opportunity.match_score && (
                                    <span className={`${compact ? 'text-xs' : 'text-sm'} ${getMatchColor(opportunity.match_score)} font-semibold flex-shrink-0`}>
                                        {Math.round(opportunity.match_score * 100)}% match
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                                {opportunity.instructor && (
                                    <span className="text-xs text-slate-400">👨‍🏫 {opportunity.instructor}</span>
                                )}
                                {opportunity.employer && (
                                    <span className="text-xs text-slate-400">🏢 {opportunity.employer}</span>
                                )}
                                {opportunity.location && (
                                    <span className="text-xs text-slate-400">📍 {opportunity.location}</span>
                                )}
                            </div>
                            
                            {!compact && opportunity.description && (
                                <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                                    {opportunity.description}
                                </p>
                            )}
                            
                            {/* Price and CTA */}
                            <div className="flex items-center justify-between mt-3">
                                <div>
                                    {opportunity.price && (
                                        <span className="text-[#EAB308] font-bold">
                                            {formatPrice(opportunity.price)}
                                        </span>
                                    )}
                                    {opportunity.salary_range && (
                                        <span className="text-[#EAB308] font-bold">
                                            {formatPrice(opportunity.salary_min)} - {formatPrice(opportunity.salary_max)}
                                        </span>
                                    )}
                                    {opportunity.is_free && (
                                        <span className="text-green-400 font-semibold">FREE</span>
                                    )}
                                </div>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect?.(opportunity);
                                    }}
                                    className={`px-3 py-1 rounded-lg bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black text-xs font-semibold hover:shadow-lg transition-all ${
                                        compact ? 'opacity-0 group-hover:opacity-100' : ''
                                    }`}
                                >
                                    {opportunity.type === 'job' ? 'Apply Now' : 'View Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Expanded Details */}
                    <AnimatePresence>
                        {!compact && expandedId === opportunity.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 pt-3 border-t border-white/10"
                            >
                                <div className="space-y-2">
                                    {opportunity.skills && (
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Required Skills:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {opportunity.skills.slice(0, 5).map((skill, i) => (
                                                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-full">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {opportunity.skills.length > 5 && (
                                                    <span className="text-xs text-slate-400">+{opportunity.skills.length - 5} more</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {opportunity.benefits && (
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Benefits:</p>
                                            <ul className="text-xs text-white space-y-1">
                                                {opportunity.benefits.slice(0, 3).map((benefit, i) => (
                                                    <li key={i}>✓ {benefit}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={() => onSelect?.(opportunity)}
                                        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        {opportunity.type === 'job' ? 'Apply Now' : 'Enroll Now'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};

export default OpportunityCard;

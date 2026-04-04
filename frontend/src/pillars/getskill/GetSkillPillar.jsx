/**
 * GETEDIL-OS GetSkill Pillar - Main Component
 * Features glassmorphic segmented control with MARKETPLACE & MY ACADEMY tabs
 * Handles enrollment success callback to auto-switch to academy view
 * @version 2.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetSkill } from '../../hooks/useGetSkill';
import MarketplaceView from './MarketplaceView';
import MyAcademyView from './MyAcademyView';
import { eventBus } from '../../lib/event-bus';

// ============================================
// SEGMENTED CONTROL COMPONENT (Glassmorphic)
// ============================================

const SegmentedControl = ({ activeTab, onTabChange, isEnrolling }) => {
    const tabs = [
        { id: 'marketplace', label: 'MARKETPLACE', icon: '🏪' },
        { id: 'academy', label: 'MY ACADEMY', icon: '🎓' }
    ];
    
    return (
        <div className="relative w-full max-w-md mx-auto mb-8">
            {/* Glassmorphic Background */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl" />
            
            {/* Tab Container */}
            <div className="relative flex p-1.5 gap-1.5">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        onClick={() => !isEnrolling && onTabChange(tab.id)}
                        disabled={isEnrolling}
                        className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 z-10 ${
                            activeTab === tab.id
                                ? 'text-black'
                                : 'text-white/60 hover:text-white'
                        } ${isEnrolling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        whileHover={!isEnrolling ? { scale: 1.02 } : {}}
                        whileTap={!isEnrolling ? { scale: 0.98 } : {}}
                    >
                        {/* Active Tab Indicator with Holographic Effect */}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-r from-[#EAB308] via-[#F59E0B] to-[#EAB308] rounded-xl shadow-lg shadow-[#EAB308]/50"
                                transition={{ type: 'spring', duration: 0.5 }}
                            >
                                {/* Holographic shimmer */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </motion.div>
                        )}
                        
                        {/* Tab Content */}
                        <span className="relative z-10 text-lg">{tab.icon}</span>
                        <span className="relative z-10 font-bold tracking-wide">
                            {tab.label}
                        </span>
                        
                        {/* Badge for academy tab (show enrollment count) */}
                        {tab.id === 'academy' && activeTab !== 'academy' && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-20"
                            >
                                <span className="text-white text-xs font-bold">•</span>
                            </motion.div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

// ============================================
// ENROLLMENT SUCCESS MODAL (Optional)
// ============================================

const EnrollmentSuccessModal = ({ course, onClose, onViewAcademy }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        
        return () => clearTimeout(timer);
    }, [onClose]);
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                className="max-w-md w-full bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] rounded-2xl p-6 border border-[#EAB308]/30 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Success Animation */}
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-[#EAB308] to-[#F59E0B] rounded-full flex items-center justify-center"
                    >
                        <span className="text-4xl">🎉</span>
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Enrollment Successful!</h3>
                    <p className="text-slate-300">
                        You are now enrolled in <span className="text-[#EAB308] font-semibold">{course?.title}</span>
                    </p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        Continue Browsing
                    </button>
                    <button
                        onClick={() => {
                            onViewAcademy();
                            onClose();
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#EAB308] to-[#F59E0B] text-black font-semibold hover:shadow-lg transition-all"
                    >
                        Go to My Academy
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============================================
// MAIN GETSKILL PILLAR COMPONENT
// ============================================

const GetSkillPillar = () => {
    // Get all the functionality from our custom hook
    const {
        activeTab,
        setActiveTab,
        marketplaceCourses,
        myCourses,
        isLoading,
        isEnrolling,
        error,
        filters,
        setFilters,
        enrollInCourse,
        fetchMyCourses,
        loadMoreCourses,
        resetFilters,
        hasMore,
        totalCourses
    } = useGetSkill();
    
    // Local state for success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastEnrolledCourse, setLastEnrolledCourse] = useState(null);
    
    // Handle enrollment with callback to switch tabs
    const handleEnroll = useCallback(async (course) => {
        const result = await enrollInCourse(course.id, course.title, course.price_etb);
        
        if (result.success) {
            // Store last enrolled course for modal
            setLastEnrolledCourse(course);
            setShowSuccessModal(true);
            
            // Refresh academy courses
            await fetchMyCourses();
            
            // Emit analytics event
            eventBus.emit('analytics:track', {
                event: 'enrollment_success_modal_shown',
                course_id: course.id,
                course_title: course.title
            });
        }
        
        return result;
    }, [enrollInCourse, fetchMyCourses]);
    
    // Handle viewing academy after enrollment
    const handleViewAcademy = useCallback(() => {
        setActiveTab('academy');
        eventBus.emit('analytics:track', {
            event: 'tab_switched_to_academy',
            source: 'enrollment_success_modal'
        });
    }, [setActiveTab]);
    
    // Handle tab change with analytics
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        eventBus.emit('analytics:track', {
            event: 'tab_switched',
            from: activeTab,
            to: tab
        });
        
        // Refresh data when switching to academy
        if (tab === 'academy') {
            fetchMyCourses();
        }
    }, [setActiveTab, activeTab, fetchMyCourses]);
    
    // Keyboard shortcuts for power users
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Alt + M for Marketplace
            if (e.altKey && e.key === 'm') {
                handleTabChange('marketplace');
            }
            // Alt + A for Academy
            if (e.altKey && e.key === 'a') {
                handleTabChange('academy');
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleTabChange]);
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
            {/* Animated Background Particles */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/patterns/grid-pattern.svg')] opacity-5" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#EAB308]/10 rounded-full blur-3xl animate-pulse" />
            </div>
            
            {/* Main Content Container */}
            <div className="relative z-10 container mx-auto px-4 py-8 pb-24">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#EAB308] via-[#F59E0B] to-[#EAB308] bg-clip-text text-transparent mb-2">
                        GetSkill
                    </h1>
                    <p className="text-slate-400">
                        Master new skills and advance your career
                    </p>
                </motion.div>
                
                {/* Glassmorphic Segmented Control */}
                <SegmentedControl
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    isEnrolling={isEnrolling}
                />
                
                {/* Tab Content with Animation */}
                <AnimatePresence mode="wait">
                    {activeTab === 'marketplace' ? (
                        <motion.div
                            key="marketplace"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MarketplaceView
                                courses={marketplaceCourses}
                                isLoading={isLoading}
                                filters={filters}
                                onFilterChange={setFilters}
                                onEnroll={handleEnroll}
                                onLoadMore={loadMoreCourses}
                                hasMore={hasMore}
                                totalCourses={totalCourses}
                                resetFilters={resetFilters}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="academy"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MyAcademyView
                                courses={myCourses}
                                isLoading={isLoading}
                                onRefresh={fetchMyCourses}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Enrollment Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <EnrollmentSuccessModal
                        course={lastEnrolledCourse}
                        onClose={() => setShowSuccessModal(false)}
                        onViewAcademy={handleViewAcademy}
                    />
                )}
            </AnimatePresence>
            
            {/* Global Loading Overlay (for enrollments) */}
            {isEnrolling && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                >
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
                        <span className="text-white font-semibold">Processing enrollment...</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// ============================================
// STYLES (Add to your global CSS)
// ============================================

const styles = `
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    .animate-shimmer {
        animation: shimmer 2s infinite;
    }
`;

// Inject styles if needed (or add to your global CSS file)
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

export default GetSkillPillar;

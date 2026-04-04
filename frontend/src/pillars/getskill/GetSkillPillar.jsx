/**
 * GETEDIL-OS GetSkill Pillar - Updated for System Integration
 * Features: Internal scroll management, Event Bus triggers, and Glassmorphic UI.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetSkill } from '../../hooks/useGetSkill';
import MarketplaceView from './MarketplaceView';
import MyAcademyView from './MyAcademyView';
import { eventBus } from '../../lib/event-bus';

// ============================================
// SEGMENTED CONTROL (Integrated)
// ============================================
const SegmentedControl = ({ activeTab, onTabChange, isEnrolling }) => {
  const tabs = [
    { id: 'marketplace', label: 'MARKETPLACE', icon: '🏪' },
    { id: 'academy', label: 'MY ACADEMY', icon: '🎓' }
  ];

  return (
    <div className="relative w-full max-w-sm mx-auto mb-6 z-20">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10" />
      <div className="relative flex p-1.5 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !isEnrolling && onTabChange(tab.id)}
            disabled={isEnrolling}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all duration-300 ${
              activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN PILLAR COMPONENT
// ============================================
const GetSkillPillar = () => {
  const {
    activeTab,
    setActiveTab,
    marketplaceCourses,
    myCourses,
    isLoading,
    isEnrolling,
    enrollInCourse,
    fetchMyCourses,
    loadMoreCourses,
    filters,
    setFilters,
    hasMore
  } = useGetSkill();

  const [showSuccess, setShowSuccess] = useState(false);
  const [enrolledCourse, setEnrolledCourse] = useState(null);

  const handleEnroll = useCallback(async (course) => {
    const result = await enrollInCourse(course.id, course.title, course.price_etb);
    if (result.success) {
      setEnrolledCourse(course);
      setShowSuccess(true);
      fetchMyCourses();
      // Notify System of transaction
      eventBus.emit('wallet:update', { amount: -course.price_etb, reason: 'Course Purchase' });
    }
  }, [enrollInCourse, fetchMyCourses]);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      {/* Background Ambience (Subtle for Overlay) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/5 blur-[100px]" />
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-6">
        {/* Module Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">
            Get<span className="text-yellow-500">Skill</span>
          </h1>
          <div className="h-[1px] w-12 bg-yellow-500/50 mx-auto mt-2" />
        </motion.div>

        <SegmentedControl 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isEnrolling={isEnrolling} 
        />

        <AnimatePresence mode="wait">
          {activeTab === 'marketplace' ? (
            <motion.div
              key="market"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <MarketplaceView 
                courses={marketplaceCourses} 
                isLoading={isLoading} 
                onEnroll={handleEnroll}
                onLoadMore={loadMoreCourses}
                hasMore={hasMore}
                filters={filters}
                onFilterChange={setFilters}
              />
            </motion.div>
          ) : (
            <motion.div
              key="academy"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <MyAcademyView 
                courses={myCourses} 
                isLoading={isLoading} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="bg-zinc-900 border border-yellow-500/30 p-8 rounded-3xl text-center max-w-xs shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-white font-bold mb-2">Access Granted</h3>
              <p className="text-zinc-400 text-sm mb-6">
                You are now enrolled in {enrolledCourse?.title}.
              </p>
              <button 
                onClick={() => { setShowSuccess(false); setActiveTab('academy'); }}
                className="w-full py-3 bg-yellow-500 text-black font-black text-xs uppercase rounded-xl hover:bg-yellow-400 transition-colors"
              >
                Start Learning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrollment Processing HUD */}
      {isEnrolling && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-zinc-800/90 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Securing Ledger...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetSkillPillar;

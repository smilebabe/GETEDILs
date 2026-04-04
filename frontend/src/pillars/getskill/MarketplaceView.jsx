import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CourseGallery from './CourseGallery';

const CATEGORY_OPTIONS = ['All', 'Programming', 'Marketing', 'Design', 'Finance', 'Productivity'];

const MarketplaceView = ({ courses, isLoading, onEnroll, filters, onFilterChange }) => {
  const [search, setSearch] = useState('');

  // Local UI-side search for instant feedback
  const filteredCourses = useMemo(() => {
    return (courses || []).filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                            c.instructor?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [courses, search]);

  return (
    <div className="flex flex-col h-full w-full text-white font-sans pb-12">
      
      {/* 🔮 Search Input with Glow */}
      <motion.div className="mb-6 px-1">
        <input
          type="text"
          placeholder="Search neural modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-yellow-500/30 rounded-2xl py-3.5 px-5 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/60 transition-all text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
        />
      </motion.div>

      {/* 🏷️ Category Filter Bar */}
      <div className="flex overflow-x-auto space-x-3 mb-8 py-2 no-scrollbar scroll-smooth">
        {CATEGORY_OPTIONS.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange({ ...filters, category: cat.toLowerCase() })}
            className={`flex-shrink-0 px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all border ${
              filters.category === cat.toLowerCase() || (cat === 'All' && filters.category === 'all')
                ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.4)]'
                : 'bg-white/5 text-zinc-500 border-white/10 hover:border-white/20'
            }`}
          >
            {cat.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* 🚀 Course Gallery Grid */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Syncing_Marketplace_Data...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <CourseGallery
            courses={filteredCourses.map(c => ({
              ...c,
              enroll: () => onEnroll(c), 
            }))}
          />
        ) : (
          <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
            <p className="text-zinc-500 text-xs font-mono uppercase">No_Modules_Found_In_This_Sector</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceView;

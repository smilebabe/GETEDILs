import React from 'react';
import { motion } from 'framer-motion';

const ProgressRow = ({ course, onResume }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
      className="group relative flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl transition-all"
    >
      {/* 1. Thumbnail (Left) */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-white/10">
        <img 
          src={course.thumbnail_url || 'https://placehold.co/100x100?text=Skill'} 
          alt={course.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* 2. Info & Progress (Center) */}
      <div className="flex-1 min-w-0 space-y-2">
        <h4 className="text-white text-sm font-bold truncate tracking-tight">
          {course.title}
        </h4>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className="text-zinc-500 uppercase">Synchronization</span>
            <span className="text-[#3B82F6]">{course.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6]"
            />
          </div>
        </div>
      </div>

      {/* 3. Action (Right) */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onResume(course.course_id)}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black text-white tracking-widest transition-all"
      >
        RESUME
      </motion.button>
    </motion.div>
  );
};

export default ProgressRow;

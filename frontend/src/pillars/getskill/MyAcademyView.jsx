import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMyCourses } from '../../hooks/useMyCourses';
import ProgressRow from '../../components/getskill/ProgressRow';

const MyAcademyView = ({ onNavigateToMarketplace }) => {
  const { myCourses, loading } = useMyCourses();

  // Calculate Average Skill Level (Average Progress)
  const averageProgress = useMemo(() => {
    if (!myCourses.length) return 0;
    const total = myCourses.reduce((acc, curr) => acc + Number(curr.progress), 0);
    return Math.round(total / myCourses.length);
  }, [myCourses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Accessing_Neural_Vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-4 overflow-y-auto pb-24">
      
      {/* Skill Level Header */}
      <header className="mb-8 p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <div className="w-24 h-24 border-4 border-[#3B82F6] rounded-full flex items-center justify-center font-black text-2xl">
            {averageProgress}%
          </div>
        </div>
        
        <p className="text-[10px] font-mono text-[#3B82F6] uppercase tracking-[0.3em] mb-1">Current_Skill_Level</p>
        <h2 className="text-3xl font-black italic tracking-tighter">
          {averageProgress === 100 ? 'MASTER_ARCHITECT' : averageProgress > 50 ? 'SENIOR_ADAPT' : 'NEURAL_INITIATE'}
        </h2>
        <div className="mt-4 h-1 w-32 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#3B82F6]" style={{ width: `${averageProgress}%` }} />
        </div>
      </header>

      {/* Course List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Active_Modules</h3>
        
        {myCourses.length > 0 ? (
          myCourses.map((course) => (
            <ProgressRow 
              key={course.enrollment_id} 
              course={course} 
              onResume={(id) => console.log("Jumping to Lesson Player for Course:", id)}
            />
          ))
        ) : (
          /* Holographic Empty State */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]"
          >
            <div className="text-4xl mb-4 opacity-20">🧠</div>
            <p className="text-xs text-zinc-400 font-medium mb-2">NO_ACTIVE_SKILLS_DETECTED</p>
            <p className="text-[10px] text-zinc-600 mb-6 text-center max-w-[200px]">
              Initialize your training by selecting a module from the Marketplace.
            </p>
            <button 
              onClick={onNavigateToMarketplace}
              className="px-6 py-2 bg-[#EAB308] text-black text-[10px] font-black rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition"
            >
              BROWSE_MARKETPLACE
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyAcademyView;

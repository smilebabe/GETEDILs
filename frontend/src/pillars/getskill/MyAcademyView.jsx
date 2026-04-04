import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import ProgressRow from '../../components/getskill/ProgressRow';

const MyAcademyView = ({ courses, isLoading, onNavigateToMarketplace }) => {
  
  // Calculate Average Neural Progress from Real DB Data
  const averageProgress = useMemo(() => {
    if (!courses || courses.length === 0) return 0;
    const total = courses.reduce((acc, curr) => acc + (Number(curr.progress_percentage) || 0), 0);
    return Math.round(total / courses.length);
  }, [courses]);

  // Rank logic based on total progress
  const getRank = (progress) => {
    if (progress === 100) return 'MASTER_ARCHITECT';
    if (progress > 75) return 'ELITE_SYSTEM_ADAPT';
    if (progress > 40) return 'NEURAL_PROTOTYPE';
    return 'INITIATE_CORE';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-5">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">decrypting_neural_vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white overflow-y-auto pb-20 no-scrollbar">
      
      {/* 🧠 Skill Level Header (Integrated) */}
      <header className="mb-10 p-8 bg-gradient-to-br from-blue-600/15 via-blue-900/5 to-transparent border border-blue-500/20 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-30">
          <div className="w-24 h-24 border-[6px] border-blue-500/30 rounded-full flex items-center justify-center font-black text-2xl text-blue-400">
            {averageProgress}%
          </div>
        </div>
        
        <p className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.4em] mb-2">Neural_Capability_Index</p>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-6">
          {getRank(averageProgress)}
        </h2>
        
        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${averageProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-blue-500 shadow-[0_0_20px_#3b82f6]" 
          />
        </div>
      </header>

      {/* 📚 Course List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active_Skill_Modules</h3>
          <span className="text-[10px] font-mono text-blue-500/50">[{courses?.length || 0}]</span>
        </div>
        
        {courses && courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <ProgressRow 
                key={course.id} 
                course={course} 
                onResume={(id) => console.log("Initializing Neural Stream for Course:", id)}
              />
            ))}
          </div>
        ) : (
          /* 🌑 Empty State */
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01] backdrop-blur-sm"
          >
            <div className="text-5xl mb-6 grayscale opacity-20">📡</div>
            <p className="text-[11px] text-zinc-400 font-bold mb-2 uppercase tracking-widest">No_Active_Signals</p>
            <p className="text-[10px] text-zinc-600 mb-8 text-center max-w-[220px] leading-relaxed">
              Neural vault empty. Please acquire skill assets from the Marketplace to begin synchronization.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToMarketplace}
              className="px-8 py-3 bg-yellow-500 text-black text-[10px] font-black rounded-2xl shadow-[0_10px_30px_rgba(234,179,8,0.2)] transition-all uppercase tracking-[0.2em]"
            >
              Access_Marketplace
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyAcademyView;

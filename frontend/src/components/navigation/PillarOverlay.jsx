import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Added for a cleaner OS look

export default function PillarOverlay({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Main Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="relative w-[95%] h-[90%] md:w-[85%] md:h-[80%] rounded-[3rem] bg-zinc-950/80 border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* 1. Header Bar */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
                  {title} <span className="text-white">_SYSTEM_V1</span>
                </h2>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. Content Area (THIS IS WHERE THE MODULE LIVES) */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </motion.div>

          {/* Close Backdrop Click */}
          <div 
            className="absolute inset-0 -z-10 cursor-pointer" 
            onClick={onClose} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

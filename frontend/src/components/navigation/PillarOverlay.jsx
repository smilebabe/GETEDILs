import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PillarOverlay({ isOpen, onClose, title }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            className="w-[80%] h-[70%] rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,215,0,0.15)] flex items-center justify-center"
          >
            <h2 className="text-2xl font-semibold tracking-wide">
              {title} Module
            </h2>
          </motion.div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

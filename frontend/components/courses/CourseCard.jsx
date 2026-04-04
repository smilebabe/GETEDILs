import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CourseCard = ({ title, instructor, price }) => {
  const [pulse, setPulse] = useState(false);

  // Trigger pulse when component mounts or price changes
  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 800);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 cursor-pointer shadow-xl shadow-amber-500/20 overflow-hidden transition-all"
    >
      {/* Glow Pulse */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.4, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-xl bg-amber-400/20 blur-2xl"
          />
        )}
      </AnimatePresence>

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.15 }}
        className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 rounded-xl pointer-events-none"
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-slate-300 text-sm mt-1">{instructor}</p>
        <button className="mt-4 py-2 px-4 rounded-lg bg-amber-400 text-black font-bold hover:shadow-lg hover:scale-105 transition-all">
          ENROLL {price} ETB
        </button>
      </div>
    </motion.div>
  );
};

export default CourseCard;

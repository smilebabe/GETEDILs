import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Map pillars to neon colors
const PILLAR_COLORS = {
  Finance: '#16A34A',      // Green
  Skills: '#3B82F6',       // Blue
  Jobs: '#F59E0B',         // Amber
  RealEstate: '#F43F5E',   // Pink/Red
  Logistics: '#A855F7',    // Purple
  Default: '#EAB308',      // Neon Yellow
};

const CourseCard = ({ title, instructor, price, pillar }) => {
  const [pulse, setPulse] = useState(false);
  const color = PILLAR_COLORS[pillar] || PILLAR_COLORS.Default;

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
      className="relative bg-white/5 backdrop-blur-lg border rounded-xl p-4 cursor-pointer shadow-xl overflow-hidden transition-all"
      style={{ borderColor: color }}
    >
      {/* Glow Pulse */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.4, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-xl blur-2xl"
            style={{ backgroundColor: `${color}33` }} // semi-transparent
          />
        )}
      </AnimatePresence>

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.15 }}
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: `radial-gradient(circle at top left, ${color}33, transparent)` }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-slate-300 text-sm mt-1">{instructor}</p>
        <button
          className="mt-4 py-2 px-4 rounded-lg font-bold text-black hover:shadow-lg hover:scale-105 transition-all"
          style={{ backgroundColor: color }}
        >
          ENROLL {price} ETB
        </button>
      </div>
    </motion.div>
  );
};

export default CourseCard;

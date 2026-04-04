import React from 'react';
import { motion } from 'framer-motion';

const VoiceWaveform = ({ isActive }) => {
  if (!isActive) return <div className="h-8" />;

  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-yellow-500 rounded-full"
          animate={{
            height: [8, 24, 8],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;

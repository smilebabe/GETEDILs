import React, { useEffect, useRef } from 'react'; // <--- THIS WAS MISSING
import { motion, useAnimation } from 'framer-motion';

export default function WalletBalance({ value }) {
  const controls = useAnimation();
  const prev = useRef(value);

  useEffect(() => {
    // Only pulse if the value actually changes
    if (prev.current !== value) {
      controls.start({
        scale: [1, 1.1, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(255,215,0,0))',
          'drop-shadow(0 0 30px rgba(255,215,0,0.8))',
          'drop-shadow(0 0 0px rgba(255,215,0,0))'
        ],
        transition: { duration: 0.6, ease: "easeInOut" }
      });
      prev.current = value;
    }
  }, [value, controls]);

  return (
    <motion.div animate={controls} className="inline-block">
      {/* Changed to Large Font and ETB Currency for the Ethiopian market */}
      <span className="text-7xl lg:text-8xl font-black tracking-tighter italic bg-gradient-to-r from-yellow-200 via-yellow-500 to-amber-600 text-transparent bg-clip-text">
        {value}
      </span>
      <span className="ml-2 text-xl font-bold text-yellow-500/50 italic tracking-widest">
        ETB
      </span>
    </motion.div>
  );
}

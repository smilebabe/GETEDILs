import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function WalletBalance({ value }) {
  const controls = useAnimation();
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      controls.start({
        scale: [1, 1.08, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(255,215,0,0))',
          'drop-shadow(0 0 18px rgba(255,215,0,0.9))',
          'drop-shadow(0 0 0px rgba(255,215,0,0))'
        ],
        transition: { duration: 0.6 }
      });

      prev.current = value;
    }
  }, [value]);

  return (
    <motion.div
      animate={controls}
      className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-transparent bg-clip-text"
    >
      ${value}
    </motion.div>
  );
}

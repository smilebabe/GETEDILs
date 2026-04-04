import { motion } from 'framer-motion';
import { useGETEStore } from '@/store/geteStore';

export default function GETEButton() {
  const open = useGETEStore((s) => s.open);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={open}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(255,215,0,0.6)] flex items-center justify-center text-black font-bold"
    >
      AI
    </motion.button>
  );
}

import { motion } from 'framer-motion';

const nodes = [0, 1, 2, 3];

export default function NodeLoader() {
  return (
    <div className="flex justify-center gap-3 mt-6">
      {nodes.map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-[var(--color-primary)]"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
}

import { motion } from 'framer-motion';

export default function CourseCard({ course }) {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        boxShadow: '0 0 25px rgba(234,179,8,0.35)'
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="
        relative
        p-4
        rounded-2xl
        bg-white/5
        backdrop-blur-xl
        border border-white/10
        text-white
        flex flex-col justify-between
      "
    >
      {/* Glow Overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 hover:opacity-100 transition" />

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold leading-snug tracking-wide">
          {course.title}
        </h3>

        <p className="text-xs text-white/50">
          {course.instructor}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-yellow-400 font-medium">
          {course.price} ETB
        </span>

        <motion.button
          whileTap={{ scale: 0.92 }}
          className="
            px-3 py-1
            text-xs font-semibold
            rounded-lg
            bg-gradient-to-r from-yellow-400 to-amber-500
            text-black
            shadow-[0_0_10px_rgba(234,179,8,0.6)]
          "
        >
          ENROLL
        </motion.button>
      </div>
    </motion.div>
  );
}

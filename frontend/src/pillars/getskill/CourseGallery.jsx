import React from 'react';
import { motion } from 'framer-motion';

const CourseGallery = ({ courses }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, index) => (
        <motion.div
          key={course.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:border-yellow-500/50 transition-all duration-500 shadow-xl"
        >
          {/* Course Image/Thumbnail Placeholder */}
          <div className="aspect-video bg-zinc-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            {course.image_url ? (
              <img 
                src={course.image_url} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📚</div>
            )}
            
            {/* Price Tag */}
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
              <span className="text-yellow-500 font-black text-xs">{course.price_etb} ETB</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-[9px] font-mono text-yellow-500/70 border border-yellow-500/30 px-2 py-0.5 rounded-md uppercase">
                {course.level || 'Beginner'}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                {course.category}
              </span>
            </div>
            
            <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-yellow-500 transition-colors">
              {course.title}
            </h3>
            
            <p className="text-zinc-500 text-xs line-clamp-2 mb-6">
              {course.description}
            </p>

            <button
              onClick={() => course.enroll()}
              disabled={course.is_enrolled}
              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                course.is_enrolled 
                ? 'bg-zinc-800 text-zinc-500 cursor-default border border-white/5' 
                : 'bg-yellow-500 text-black hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95'
              }`}
            >
              {course.is_enrolled ? 'Module_Unlocked' : 'Initialize_Enrollment'}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CourseGallery;

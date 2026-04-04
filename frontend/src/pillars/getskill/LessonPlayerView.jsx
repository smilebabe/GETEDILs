import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, PlayCircle, CheckCircle } from 'lucide-react';

const LessonPlayerView = ({ course, onBack }) => {
  const [activeLesson, setActiveLesson] = useState(course.lessons?.[0] || null);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-zinc-900/50">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
          <ChevronLeft size={20} className="text-[#EAB308]" />
        </button>
        <div>
          <h2 className="text-sm font-bold truncate max-w-[200px]">{course.title}</h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Module: {activeLesson?.title || 'Initializing...'}</p>
        </div>
      </div>

      {/* Video / Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="aspect-video bg-zinc-800 flex items-center justify-center relative group">
          {/* Placeholder for Video Player (e.g., YouTube/Vimeo/Supabase Storage) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
             <PlayCircle size={64} className="text-[#EAB308] animate-pulse" />
          </div>
          <p className="text-zinc-500 font-mono text-xs text-center px-10">
            [ENCRYPTED_STREAM_ID: {activeLesson?.id || 'NULL'}]<br/>
            Waiting for secure handshake...
          </p>
        </div>

        {/* Lesson Description */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#EAB308]">{activeLesson?.title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Welcome to this module. In this session, we break down the core architecture of 
            the GETEDIL ecosystem and how to leverage local Ethiopian market insights.
          </p>
          
          <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:border-[#3B82F6] transition-all">
            DOWNLOAD_RESOURCES (.PDF)
          </button>
        </div>
      </div>

      {/* Mobile Lesson Drawer (Bottom) */}
      <div className="p-4 bg-zinc-900 border-t border-white/10">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-3">Course_Syllabus</h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <button 
              key={i}
              className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${i === 1 ? 'border-[#EAB308] bg-[#EAB308]/10' : 'border-white/10 bg-white/5'}`}
            >
              <span className={`text-xs font-bold ${i === 1 ? 'text-[#EAB308]' : 'text-zinc-600'}`}>{i}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonPlayerView;

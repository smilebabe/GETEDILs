import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Globe } from 'lucide-react';
import NodeLoader from './NodeLoader';

// We must accept "onLogin" as a prop here!
export default function AuthPortal({ onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-[420px] p-12 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-2xl z-10 text-center"
      >
        {/* Logo Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            GETEDIL<span className="text-yellow-500">_</span>INIT
          </h1>
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mt-2">
            Neural Operating System
          </p>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center mb-10">
          <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={12} /> Trust Level 1 Verified
          </div>
        </div>

        {/* THE LOGIN ACTION */}
        <div className="space-y-6">
          <button 
            onClick={onLogin}
            className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-4 hover:bg-yellow-500 transition-all active:scale-95 shadow-xl group"
          >
            <Globe size={20} className="group-hover:rotate-12 transition-transform" /> 
            INITIALIZE_NODE
          </button>
          
          <div className="pt-4">
            <NodeLoader />
            <p className="text-[8px] text-gray-600 tracking-[0.5em] uppercase mt-4">
              Awaiting Secure Authentication...
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

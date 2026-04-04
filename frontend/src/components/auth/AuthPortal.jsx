import React from 'react';
import { motion } from 'framer-motion';
import NodeLoader from './NodeLoader';

export default function AuthPortal() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark)] text-white">
      
      <div className="w-[420px] p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl">
        
        {/* Logo */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-wider">GETEDIL</h1>
          <p className="text-xs text-white/40">Digital Operating System</p>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs">
            ✓ Trust Level 1 Verified
          </div>
        </div>

        {/* Node Initialization */}
        <NodeLoader />

      </div>
    </div>
  );
}

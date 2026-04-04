import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Briefcase, ShieldCheck, Cpu, Zap, 
  Globe, Terminal, activity, ArrowUpRight, Plus 
} from 'lucide-react';

// INITIALIZE SUPABASE CLIENT
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for Auth Changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // LOADING STATE: System Booting
  if (loading) return (
    <div className="h-screen w-full bg-[#020202] flex items-center justify-center">
      <div className="text-yellow-500 font-black tracking-[0.5em] animate-pulse uppercase text-xs">
        System_Booting...
      </div>
    </div>
  );

  // AUTH STATE: Initialize OS Portal
  if (!session) return <AuthPortal />;

  // MAIN OS INTERFACE
  return (
    <div className="h-screen w-full bg-[#020202] text-white overflow-hidden relative font-sans selection:bg-yellow-500/30">
      
      {/* LAYER ONE: AMBIENT HOLOGRAPHIC GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-yellow-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      {/* LAYER TWO: INTERFACE CONTENT */}
      <div className="relative h-full w-full flex flex-col p-6 lg:p-10 z-10 max-w-[1600px] mx-auto">
        
        {/* HEADER: HUD CONFIG */}
        <div className="flex justify-between items-start mb-12">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-3xl">
            <h1 className="text-2xl font-black tracking-tighter italic">
              GETEDIL<span className="text-yellow-500">_</span>OS
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <p className="text-[9px] text-gray-400 font-bold tracking-[0.3em] uppercase">
                 Node_Active: {session.user.email.split('@')[0]}
               </p>
            </div>
          </div>

          <button 
            onClick={async () => await supabase.auth.signOut()}
            className="group relative bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-xl"
            title="Terminate Session"
          >
            <Terminal size={20} />
            <span className="absolute -bottom-10 right-0 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white px-3 py-1.5 rounded uppercase tracking-[0.2em] whitespace-nowrap">
              Terminate_Session
            </span>
          </button>
        </div>

        {/* MAIN VIEW: COMMAND CENTER */}
        <div className="flex-grow flex flex-col lg:flex-row gap-10 items-center justify-center">
          
          {/* MODULE: P6_LEDGER (Financial Core) */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="w-full lg:w-[500px] p-12 rounded-[4rem] bg-gradient-to-br from-white/[0.06] to-transparent border border-white/10 backdrop-blur-3xl shadow-2xl relative group overflow-hidden"
          >
            <div className="absolute top-6 right-10 text-[10px] font-black text-yellow-500/50 tracking-[0.4em] uppercase italic">P6_Registry</div>
            <div className="mb-14 p-4 bg-yellow-500/10 w-fit rounded-2xl border border-yellow-500/20">
              <Wallet className="text-yellow-500" size={36} />
            </div>
            
            <div className="space-y-3 mb-14">
               <span className="text-8xl font-black tracking-tighter block group-hover:scale-105 transition-transform duration-500 italic">
                {balance}
               </span>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] italic">Ethiopian Birr (ETB)</span>
                 <div className="h-[1px] w-12 bg-white/10" />
               </div>
            </div>

            <div className="flex gap-5">
               <button className="flex-grow py-5 bg-yellow-500 text-black font-black rounded-2xl shadow-2xl shadow-yellow-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter">
                 <Plus size={18} /> DEPOSIT_FUNDS
               </button>
               <button className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 active:scale-90 transition-all">
                 <ArrowUpRight size={24} className="text-gray-400" />
               </button>
            </div>
          </motion.div>

          {/* MODULE: PILLAR_NAV (Bento Grid) */}
          <div className="grid grid-cols-2 gap-5 w-full lg:w-auto">
             <PillarNode name="Consulting" icon={<Briefcase size={22} />} />
             <PillarNode name="Real Estate" icon={<Globe size={22} />} />
             <PillarNode name="Logistics" icon={<Zap size={22} />} />
             <PillarNode name="Analytics" icon={<Cpu size={22} />} />
             
             {/* SYSTEM STATUS CARD */}
             <div className="col-span-2 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex justify-between items-end backdrop-blur-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Trust_Index</p>
                  <p className="text-3xl font-black italic text-blue-500">LV1_VERIFIED</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Hire_Queue</p>
                  <p className="text-3xl font-black italic text-green-500">09_ACTIVE</p>
                </div>
             </div>
          </div>

        </div>

        {/* FOOTER: SYSTEM RAIL */}
        <div className="mt-12 flex items-center gap-6 text-[9px] font-bold text-gray-700 tracking-[0.5em] uppercase">
           <span className="text-green-500 flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> LIVE_GATEWAY
           </span>
           <span className="h-[1px] flex-grow bg-white/5" />
           <span className="hover:text-yellow-500/50 cursor-pointer transition-colors">© 2026 GETEDIL_CORE_SYSTEM</span>
        </div>
      </div>
    </div>
  );
}

// SUB-COMPONENT: Pillar Node Card
const PillarNode = ({ name, icon }) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
    className="w-[180px] h-[180px] bg-white/[0.03] border border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-5 cursor-pointer transition-all group relative overflow-hidden shadow-xl"
  >
    <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/[0.02] transition-colors" />
    <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-yellow-500 group-hover:text-black transition-all duration-300 z-10 shadow-lg">
      {icon}
    </div>
    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white z-10 transition-colors">
      {name}
    </span>
  </motion.div>
);

// SUB-COMPONENT: Auth Portal
const AuthPortal = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="h-screen w-full bg-[#000] flex items-center justify-center p-6 selection:bg-yellow-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-14 rounded-[4rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl text-center relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/5 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="inline-block p-6 bg-yellow-500/10 rounded-3xl border border-yellow-500/20 mb-10">
            <Cpu className="text-yellow-500 animate-pulse" size={40} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic uppercase mb-2">
            {isRegistering ? 'Initialize_ID' : 'Login_Auth'}
          </h1>
          <p className="text-[10px] text-gray-600 tracking-[0.4em] uppercase mb-14 italic font-bold">
            GETEDIL_IDENTITY_PROTOCOL_v1.0
          </p>

          <button 
            onClick={() => supabase.auth.signInWithOAuth({ 
              provider: 'google', 
              options: { redirectTo: window.location.origin } 
            })}
            className="w-full py-6 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-yellow-500 active:scale-95 transition-all flex items-center justify-center gap-4 text-sm"
          >
            <Globe size={20} /> CONTINUE_WITH_GOOGLE
          </button>

          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mb-4">
              {isRegistering ? 'Access existing registry?' : 'Register new node?'}
            </p>
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-yellow-500/60 hover:text-yellow-500 text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              {isRegistering ? '→ Access_Existing_Account' : '→ Create_Digital_Identity'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

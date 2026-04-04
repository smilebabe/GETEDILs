import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Briefcase, ShieldCheck, LayoutGrid, 
  LogOut, Bell, Search, Zap, Globe, Cpu, ChevronRight, Activity
} from 'lucide-react';

// 1. SUPABASE CLIENT SETUP
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Dynamic Cinematic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-900/10 blur-[100px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {!session ? (
          <AuthPortal key="auth" />
        ) : (
          <Dashboard key="dash" session={session} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- CORE UI COMPONENTS ---

const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020202]">
    <motion.div 
      animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1, 0.98] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-yellow-500 font-black tracking-[0.8em] text-2xl mb-8"
    >
      GETEDIL
    </motion.div>
    <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="w-full h-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
      />
    </div>
  </div>
);

const AuthPortal = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
    className="h-screen flex items-center justify-center px-6 relative z-10"
  >
    <div className="w-full max-w-md p-12 rounded-[3.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl text-center">
      <div className="mb-10 inline-flex p-6 rounded-[2rem] bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/10">
        <Cpu className="text-yellow-500 w-10 h-10" />
      </div>
      <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
        GETEDIL<span className="text-yellow-500">.</span>
      </h1>
      <p className="text-gray-500 text-[10px] uppercase tracking-[0.5em] font-bold mb-14">The Digital Gateway of Ethiopia</p>
      
      <button 
        onClick={() => supabase.auth.signInWithOAuth({ 
          provider: 'google',
          options: { redirectTo: window.location.origin }
        })}
        className="group w-full py-6 bg-white text-black font-black rounded-2xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl shadow-white/5"
      >
        <Globe size={20} />
        CONTINUE WITH GOOGLE
      </button>
      
      <p className="mt-12 text-[9px] text-gray-700 font-black uppercase tracking-[0.3em]">
        Tier 4 Security • AES-256 Protocol
      </p>
    </div>
  </motion.div>
);

const Dashboard = ({ session }) => {
  const [balance, setBalance] = useState("0.00");
  const userName = session.user.user_metadata?.full_name || "User";

  useEffect(() => {
    const fetchWallet = async () => {
      const { data } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
      if (data) setBalance(data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    };
    fetchWallet();
  }, [session]);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.div 
      variants={container} initial="hidden" animate="show"
      className="relative z-10 max-w-[1440px] mx-auto p-6 md:p-12 lg:p-20"
    >
      {/* TOP NAVIGATION */}
      <motion.header variants={item} className="flex justify-between items-end mb-20 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl font-black tracking-tighter italic">ሠላም, {userName.split(' ')[0]}</h2>
            <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em]">Live Node</div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-bold flex items-center gap-2">
            <Activity size={12} className="text-green-500" /> System Operational
          </p>
        </div>
        <div className="flex gap-4">
          <div className="hidden md:flex p-4 rounded-3xl bg-white/[0.03] border border-white/10 text-gray-500 hover:text-white transition-all cursor-pointer hover:bg-white/10">
            <Bell size={20} />
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="group flex items-center gap-3 px-6 py-4 rounded-3xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
            <LogOut size={18} />
          </button>
        </div>
      </motion.header>

      {/* PRIMARY BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24">
        {/* HERO WALLET CARD */}
        <motion.div variants={item} className="lg:col-span-8 group relative overflow-hidden p-12 rounded-[4rem] bg-gradient-to-br from-yellow-500 to-yellow-700 shadow-2xl transition-all hover:shadow-yellow-500/20">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Wallet size={160} className="text-black" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-16">
              <div className="p-4 bg-black/20 rounded-[1.5rem] backdrop-blur-xl border border-black/10"><Zap size={24} className="text-black" /></div>
              <span className="text-[12px] font-black uppercase tracking-[0.5em] text-black/60">P6_Financial_Ledger</span>
            </div>
            <div>
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-8xl font-black tracking-tighter text-black">{balance}</span>
                <span className="text-2xl font-bold text-black/40 italic">ETB</span>
              </div>
              <div className="flex gap-4">
                <button className="px-8 py-4 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.05] transition-transform shadow-xl">Add Funds</button>
                <button className="px-8 py-4 bg-black/10 border border-black/10 text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-black/20 transition-colors">Transfer</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SIDE METRICS */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <MetricCard title="P4_HIRED" value="09" unit="Offers" icon={<Briefcase size={20} className="text-green-500" />} />
          <MetricCard title="TRUST_SCORE" value="Lv. 1" unit="Verified" icon={<ShieldCheck size={20} className="text-blue-500" />} />
        </div>
      </div>

      {/* PILLAR EXPLORER GRID */}
      <motion.div variants={item} className="space-y-12">
        <div className="flex items-center gap-8">
          <h3 className="text-xs font-black uppercase tracking-[0.5em] text-gray-700">Active OS Pillars</h3>
          <div className="flex-grow h-[1px] bg-white/5" />
          <div className="flex items-center gap-4 text-gray-500 hover:text-white cursor-pointer transition-colors">
            <span className="text-[10px] font-black uppercase tracking-widest">View All</span>
            <ChevronRight size={16} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { name: 'Consultancy', icon: <Briefcase /> },
            { name: 'Real Estate', icon: <Globe /> },
            { name: 'Verified ID', icon: <ShieldCheck /> },
            { name: 'Marketplace', icon: <Search /> },
            { name: 'Logistics', icon: <Zap /> },
            { name: 'Analytics', icon: <Cpu /> },
          ].map((p, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -10, backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(234,179,8,0.3)" }}
              className="group aspect-[4/5] p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between transition-all cursor-pointer backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:bg-yellow-500 transition-all duration-300">
                <div className="text-gray-600 group-hover:text-black transition-colors">{p.icon}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{p.name}</div>
                <div className="text-[8px] font-bold text-gray-800 uppercase tracking-widest">v1.0.0 Stable</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const MetricCard = ({ title, value, unit, icon }) => (
  <motion.div 
    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
    className="flex-grow p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl flex flex-col justify-between"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-4 rounded-[1.2rem] bg-white/5">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">{title}</span>
    </div>
    <div className="flex items-baseline gap-3">
      <span className="text-5xl font-black italic text-white tracking-tighter">{value}</span>
      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{unit}</span>
    </div>
  </motion.div>
);

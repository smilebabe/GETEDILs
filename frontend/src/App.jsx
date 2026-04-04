import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Briefcase, ShieldCheck, LayoutGrid, 
  LogOut, Bell, Search, Zap, Globe, Cpu 
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-yellow-600/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-green-900/10 blur-[140px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-900/5 blur-[120px] rounded-full" />
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
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-yellow-500 font-black tracking-[0.5em] text-xl mb-4"
    >
      GETEDIL
    </motion.div>
    <div className="w-48 h-[1px] bg-white/10 overflow-hidden">
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="w-full h-full bg-yellow-500"
      />
    </div>
  </div>
);

const AuthPortal = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
    className="h-screen flex items-center justify-center px-6 relative z-10"
  >
    <div className="w-full max-w-md p-10 rounded-[3rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl text-center">
      <div className="mb-8 inline-flex p-5 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/20">
        <Cpu className="text-yellow-500 w-8 h-8" />
      </div>
      <h1 className="text-5xl font-black tracking-tighter mb-3 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
        GETEDIL<span className="text-yellow-500">.</span>
      </h1>
      <p className="text-gray-500 text-xs uppercase tracking-[0.3em] font-bold mb-12">Universal OS Gateway</p>
      
      <button 
        onClick={() => supabase.auth.signInWithOAuth({ 
          provider: 'google',
          options: { redirectTo: window.location.origin }
        })}
        className="group w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
      >
        <Globe size={18} />
        CONTINUE WITH GOOGLE
      </button>
      
      <div className="mt-10 flex items-center justify-center gap-4 text-[10px] text-gray-600 font-bold tracking-widest uppercase">
        <span>Encrypted</span>
        <div className="w-1 h-1 bg-gray-800 rounded-full" />
        <span>Decentralized</span>
      </div>
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

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="relative z-10 max-w-7xl mx-auto p-6 md:p-12 lg:p-20"
    >
      {/* NAV BAR */}
      <header className="flex justify-between items-center mb-20">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-black tracking-tighter italic">ሠላም, {userName.split(' ')[0]}</h2>
             <div className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[8px] font-black text-yellow-500 uppercase tracking-widest">Premium</div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold">Node Identity: {session.user.id.slice(0,8)}</p>
        </div>
        <div className="flex gap-4">
          <div className="hidden md:flex p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors cursor-pointer"><Bell size={20} /></div>
          <button onClick={() => supabase.auth.signOut()} className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><LogOut size={20} /></button>
        </div>
      </header>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <MetricCard 
          title="P6_GETPAID" 
          value={balance} 
          unit="ETB" 
          icon={<Wallet className="text-black" />} 
          theme="gold" 
        />
        <MetricCard 
          title="P4_GETHIRED" 
          value="0" 
          unit="Active" 
          icon={<Briefcase className="text-green-500" />} 
          theme="dark" 
        />
        <MetricCard 
          title="IDENTITY_SCORE" 
          value="98" 
          unit="Trust" 
          icon={<ShieldCheck className="text-blue-500" />} 
          theme="dark" 
        />
      </div>

      {/* PILLAR EXPLORER */}
      <div className="mb-20">
        <div className="flex justify-between items-end mb-10">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-600">Active OS Pillars</h3>
          <div className="h-[1px] flex-grow mx-8 bg-white/5" />
          <Search size={18} className="text-gray-600" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {['Consultancy', 'Real Estate', 'Verified ID', 'Marketplace', 'Logistics', 'Legal Hub', 'Diaspora', 'Tenders', 'Analytics', 'Referral', 'Automation', 'Support'].map((p, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
              className="aspect-square p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/5 mb-4 group-hover:bg-yellow-500/20 transition-colors flex items-center justify-center">
                <Zap size={16} className="text-gray-600 group-hover:text-yellow-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{p}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- REUSABLE DESIGN SYSTEMS ---

const MetricCard = ({ title, value, unit, icon, theme }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`relative overflow-hidden p-10 rounded-[3rem] border shadow-2xl backdrop-blur-3xl 
      ${theme === 'gold' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border-yellow-500/20' : 'bg-white/[0.02] border-white/5'}`}
  >
    <div className="flex items-center gap-4 mb-8">
      <div className={`p-4 rounded-2xl ${theme === 'gold' ? 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-white/5'}`}>{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{title}</span>
    </div>
    <div className="flex items-baseline gap-3">
      <span className="text-6xl font-black tracking-tighter text-white">{value}</span>
      <span className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">{unit}</span>
    </div>
    {theme === 'gold' && <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 blur-[80px] -mr-10 -mt-10" />}
  </motion.div>
);

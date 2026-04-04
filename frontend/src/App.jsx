import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Briefcase, ShieldCheck, LayoutGrid, 
  LogOut, Bell, Search, Zap, Globe, Cpu, 
  Activity, Settings, Terminal, Box, Layers
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
    <div className="h-screen bg-[#020202] text-white font-sans overflow-hidden selection:bg-yellow-500/30">
      <AnimatePresence mode="wait">
        {!session ? (
          <AuthPortal key="auth" />
        ) : (
          <div className="flex h-screen w-full relative">
            <SidebarRail />
            <Dashboard key="dash" session={session} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#000]">
    <motion.div 
      animate={{ opacity: [0.2, 1, 0.2] }} 
      transition={{ repeat: Infinity, duration: 1.5 }}
      className="flex flex-col items-center gap-4"
    >
      <Cpu size={40} className="text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]" />
      <span className="text-[10px] font-black tracking-[0.8em] text-yellow-500 uppercase">Booting_OS</span>
    </motion.div>
  </div>
);

const AuthPortal = () => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="h-screen w-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed"
  >
    <div className="w-full max-w-md p-12 bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-[3rem] text-center shadow-2xl">
      <div className="mb-10 inline-block p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/10">
        <ShieldCheck className="text-yellow-500 w-10 h-10" />
      </div>
      <h1 className="text-5xl font-black tracking-tighter mb-2 italic">GETEDIL<span className="text-yellow-500">_</span>OS</h1>
      <p className="text-gray-600 text-[10px] uppercase tracking-[0.4em] font-bold mb-12 italic text-center">Protocol: Ethiopia_Digital_Gateway</p>
      
      <button 
        onClick={() => supabase.auth.signInWithOAuth({ 
          provider: 'google', 
          options: { redirectTo: window.location.origin } 
        })}
        className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-4 hover:bg-yellow-500 transition-all active:scale-95 shadow-xl"
      >
        <Globe size={18} />
        INITIALIZE_SESSION
      </button>
    </div>
  </motion.div>
);

const SidebarRail = () => (
  <aside className="w-20 lg:w-24 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col items-center py-10 gap-10 z-50">
    <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
      <Terminal className="text-black" size={24} />
    </div>
    <div className="flex flex-col gap-8 flex-grow">
      <NavIcon icon={<LayoutGrid size={20} />} active />
      <NavIcon icon={<Layers size={20} />} />
      <NavIcon icon={<Box size={20} />} />
      <NavIcon icon={<Activity size={20} />} />
    </div>
    <button onClick={() => supabase.auth.signOut()} className="p-4 text-gray-700 hover:text-red-500 transition-colors">
      <LogOut size={22} />
    </button>
  </aside>
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
    <main className="flex-grow overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="max-w-6xl mx-auto p-8 lg:p-16 relative z-10">
        
        {/* TOP STATUS BAR */}
        <header className="flex justify-between items-end mb-16 border-b border-white/5 pb-10">
          <div className="space-y-1">
            <span className="text-[9px] font-black tracking-[0.5em] text-yellow-500/60 uppercase">System_Active // Node_Gateway</span>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase italic">ሠላም, {userName.split(' ')[0]}</h2>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Optimized_Link</span>
             </div>
             <p className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.2em]">User_UID: {session.user.id.slice(0,12)}</p>
          </div>
        </header>

        {/* THE P6 COMMAND DECK */}
        <section className="relative mb-12 group">
          <div className="absolute -inset-1 bg-yellow-500/10 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-white/[0.02] border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-10 text-gray-500">
                    <Wallet size={16} />
                    <span className="text-[10px] font-black tracking-[0.5em] uppercase">P6_Ledger_Balance</span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-8xl font-black tracking-tighter text-white group-hover:text-yellow-500 transition-colors duration-700">{balance}</span>
                    <span className="text-2xl font-bold text-gray-700 italic uppercase">ETB</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto">
                   <button className="px-10 py-4 bg-yellow-500 text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-xl">Deposit_Funds</button>
                   <button className="px-10 py-4 border border-white/10 text-gray-500 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors">Internal_Transfer</button>
                </div>
             </div>
          </div>
        </section>

        {/* TELEMETRY BLOCKS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
           <ModuleCard title="P4_HIRE_QUEUE" value="09" sub="Pending_Match" icon={<Briefcase size={18}/>} />
           <ModuleCard title="CORE_TRUST_SCORE" value="LV1" sub="KYC_Verified" icon={<ShieldCheck size={18}/>} />
        </section>

        {/* PILLAR NODE REGISTRY */}
        <section className="space-y-10">
           <div className="flex items-center gap-6">
             <h3 className="text-[10px] font-black tracking-[0.5em] text-gray-700 uppercase italic">Pillar_Node_Registry</h3>
             <div className="h-[1px] flex-grow bg-white/5" />
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pb-20">
              {['Consulting', 'Real Estate', 'Logistics', 'Legal Hub', 'Analytics', 'Automate'].map((name) => (
                <div key={name} className="group aspect-square rounded-[2rem] bg-white/[0.01] border border-white/5 hover:border-yellow-500/40 hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center cursor-pointer">
                  <div className="p-3 rounded-xl bg-white/5 mb-3 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                    <Zap size={18} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">{name}</span>
                </div>
              ))}
           </div>
        </section>
      </div>
    </main>
  );
};

// --- DESIGN ATOMS ---

const NavIcon = ({ icon, active }) => (
  <div className={`p-4 rounded-2xl transition-all cursor-pointer ${active ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}>
    {icon}
  </div>
);

const ModuleCard = ({ title, value, sub, icon }) => (
  <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 hover:bg-white/[0.03] transition-all group backdrop-blur-xl">
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-white/5 rounded-xl text-gray-600 group-hover:text-yellow-500 transition-colors border border-white/5">{icon}</div>
      <span className="text-[9px] font-black tracking-[0.4em] text-gray-600 uppercase italic">{title}</span>
    </div>
    <div className="text-5xl font-black italic tracking-tighter">
      {value} <span className="text-[10px] text-gray-700 not-italic uppercase ml-3 tracking-[0.2em]">{sub}</span>
    </div>
  </div>
);

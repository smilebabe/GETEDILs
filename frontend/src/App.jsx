import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Briefcase, ShieldCheck, LayoutGrid, 
  User, LogOut, Bell, Search, Settings 
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
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-yellow-600/10 blur-[120px] rounded-full" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-green-600/10 blur-[120px] rounded-full" />

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

// --- UI COMPONENTS ---

const LoadingSpinner = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
    <motion.div 
      animate={{ rotate: 360 }} 
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
      className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full" 
    />
  </div>
);

const AuthPortal = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    className="h-screen flex items-center justify-center px-6"
  >
    <div className="w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl text-center">
      <div className="mb-6 inline-block p-4 rounded-3xl bg-yellow-500/10">
        <ShieldCheck className="text-yellow-500 w-10 h-10" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">GETEDIL<span className="text-yellow-500">-OS</span></h1>
      <p className="text-gray-400 mb-10 font-light italic">Ethiopia's Digital Gateway</p>
      
      // Inside AuthPortal component
<button 
  onClick={() => supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: {
      // window.location.origin will automatically be "https://getedi-ls.vercel.app" on Vercel
      redirectTo: window.location.origin 
    }
  })}
  className="..."
>
  Continue with Google
</button>
      
      <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
        Secure End-to-End Encryption • Powered by GETEDIL-CORE
      </p>
    </div>
  </motion.div>
);

const Dashboard = ({ session }) => {
  const userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 lg:p-12"
    >
      {/* Top Navigation */}
      <nav className="flex justify-between items-center mb-16">
        <div>
          <h2 className="text-2xl font-bold">ሠላም, {userName} 👋</h2>
          <p className="text-gray-500 text-sm">System Status: <span className="text-green-500">Online</span></p>
        </div>
        <div className="flex gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <Bell size={20} />
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold">Exit</span>
          </button>
        </div>
      </nav>

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <PillarCard 
          icon={<Wallet className="text-black" />} 
          title="P6_GetPaid" 
          value="0.00" 
          unit="ETB" 
          color="bg-yellow-500" 
          gradient="from-yellow-500/20 to-yellow-600/5"
        />
        <PillarCard 
          icon={<Briefcase className="text-green-500" />} 
          title="P4_GetHired" 
          value="0" 
          unit="Opportunities" 
          color="bg-green-500/20" 
          gradient="from-green-500/10 to-transparent"
        />
        <PillarCard 
          icon={<ShieldCheck className="text-blue-500" />} 
          title="Trust Score" 
          value="Lv. 1" 
          unit="Basic KYC" 
          color="bg-blue-500/20" 
          gradient="from-blue-500/10 to-transparent"
        />
      </div>

      {/* OS Modules (Pillar Registry) */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <LayoutGrid size={22} className="text-yellow-500" /> 
          Active Pillars
        </h3>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          <Search size={16} className="text-gray-500" />
          <input type="text" placeholder="Search modules..." className="bg-transparent border-none focus:ring-0 text-sm w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {['Consultancy', 'Real Estate', 'Verified ID', 'E-Commerce', 'Logistics', 'Legal Hub', 'Diaspora', 'Tenders', 'API Access', 'Analytics', 'Referral', 'Automation'].map((name, i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.05, y: -5 }}
            className="group aspect-square p-6 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-yellow-500/30 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 mb-4 group-hover:bg-yellow-500/10 transition-colors flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 group-hover:border-yellow-500/50" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-white">{name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const PillarCard = ({ icon, title, value, unit, color, gradient }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${gradient} border border-white/10 shadow-xl relative overflow-hidden group`}
  >
    <div className="flex items-center gap-4 mb-6">
      <div className={`p-4 ${color} rounded-2xl shadow-lg`}>{icon}</div>
      <span className="font-bold tracking-widest text-xs text-gray-400 uppercase">{title}</span>
    </div>
    <div className="text-4xl font-black tracking-tighter">
      {value} <span className="text-sm font-light text-gray-500 ml-1 uppercase">{unit}</span>
    </div>
    {/* Decorative internal line */}
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
  </motion.div>
);

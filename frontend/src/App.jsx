import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Terminal, Globe, Zap, ShieldCheck, Briefcase, Plus } from 'lucide-react';

// --- MODULAR IMPORTS (ChatGPT Standard) ---
import AuthPortal from './components/auth/AuthPortal';
import WalletBalance from './components/wallet/WalletBalance';
import PillarOverlay from './components/navigation/PillarOverlay';

// Initialize Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  // --- STATE MANAGEMENT ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState("0.00");
  const [activePillar, setActivePillar] = useState(null);

  // --- AUTHENTICATION LOGIC ---
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FINANCIAL REAL-TIME LOGIC ---
  useEffect(() => {
    if (!session) return;

    // 1. Initial Fetch
    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();
      
      if (data) setBalance(data.balance.toFixed(2));
      if (error) console.error("OS_Ledger_Error:", error.message);
    };

    fetchBalance();

    // 2. Real-time Subscription
    const walletChannel = supabase.channel('realtime_wallet')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${session.user.id}` }, 
        (payload) => {
          setBalance(payload.new.balance.toFixed(2));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(walletChannel);
  }, [session]);

  // --- AUTH HANDLERS ---
  const handleLogin = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  const handleLogout = () => supabase.auth.signOut();

  // --- RENDER LOGIC ---
  if (loading) return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="text-yellow-500 font-black tracking-[0.5em] animate-pulse">INITIALIZING_OS...</div>
    </div>
  );

  if (!session) return <AuthPortal onLogin={handleLogin} />;

  return (
    <div className="h-screen w-full bg-[#020202] text-white overflow-hidden relative font-sans selection:bg-yellow-500/30">
      
      {/* 1. HOLOGRAPHIC OVERLAY LAYER */}
      <PillarOverlay 
        isOpen={!!activePillar} 
        title={activePillar} 
        onClose={() => setActivePillar(null)} 
      />

      {/* 2. BACKGROUND VISUALS */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative h-full w-full flex flex-col p-8 lg:p-12 z-10 max-w-[1600px] mx-auto">
        
        {/* 3. OS HUD (Header) */}
        <header className="flex justify-between items-start mb-16">
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] shadow-2xl">
            <h1 className="text-3xl font-black italic tracking-tighter">
              GETEDIL<span className="text-yellow-500">_</span>OS
            </h1>
            <p className="text-[9px] text-gray-500 tracking-[0.5em] uppercase font-bold mt-1">
              NODE_AUTH: <span className="text-gray-300">{session.user.id.slice(0, 12)}...</span>
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-2xl group"
          >
            <Terminal size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
        </header>

        {/* 4. MAIN COMMAND CENTER */}
        <main className="flex-grow flex flex-col lg:flex-row gap-16 items-center justify-center">
          
          {/* P6 WALLET COMPONENT */}
          <section className="p-16 rounded-[5rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-3xl text-center relative group min-w-[480px]">
            <div className="absolute top-10 left-10 text-yellow-500/20 font-black italic tracking-widest text-[10px]">P6_SYSTEM_V1</div>
            
            <WalletBalance value={balance} />
            
            <p className="text-[11px] text-gray-600 font-black tracking-[0.6em] uppercase mt-6 italic">
              Verified_Balance_ETB
            </p>

            <button className="mt-12 w-full py-6 bg-yellow-500 text-black font-black rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 tracking-tighter shadow-[0_0_50px_rgba(255,215,0,0.15)]">
              <Plus size={20} strokeWidth={3} /> DEPOSIT_FUNDS
            </button>
          </section>

          {/* SERVICE PILLAR NODES */}
          <nav className="grid grid-cols-2 gap-8">
            <ServiceNode name="Real Estate" icon={<Globe />} onClick={() => setActivePillar("Real Estate")} />
            <ServiceNode name="Logistics" icon={<Zap />} onClick={() => setActivePillar("Logistics")} />
            <ServiceNode name="Police DB" icon={<ShieldCheck />} onClick={() => setActivePillar("Federal Police")} />
            <ServiceNode name="Consulting" icon={<Briefcase />} onClick={() => setActivePillar("Consultancy")} />
          </nav>
        </main>

        {/* 5. FOOTER STATUS */}
        <footer className="mt-auto pt-8 flex justify-between items-center border-t border-white/5 text-[9px] text-gray-600 font-bold tracking-[0.3em] uppercase">
          <div>© 2026 GETEDIL ECOSYSTEM</div>
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> NETWORK_STABLE</span>
            <span>SECURE_ENCRYPTION_ACTIVE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: SERVICE NODE ---
function ServiceNode({ name, icon, onClick }) {
  return (
    <div 
      onClick={onClick} 
      className="w-48 h-48 bg-white/[0.02] border border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all group shadow-2xl active:scale-95"
    >
      <div className="p-5 bg-white/5 rounded-[1.5rem] group-hover:bg-yellow-500 group-hover:text-black transition-all duration-500 shadow-inner">
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">
        {name}
      </span>
    </div>
  );
}

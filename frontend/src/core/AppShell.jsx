import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Mic, Wallet, Briefcase, GraduationCap, Home, Settings, Search } from 'lucide-react';
import { useGETE } from '../hooks/useGETE'; // Hypothetical hook

const AppShell = ({ children, activePillar = 'Home' }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tiletPattern = "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 20-20 20L0 20z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")";

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] text-slate-100 overflow-hidden font-sans">
      {/* Background Layer with Ethiopian Tilet Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-40" 
        style={{ backgroundImage: tiletPattern, backgroundRepeat: 'repeat' }}
      />
      
      {/* Dynamic Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 flex h-screen">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <motion.aside 
            initial={false}
            animate={{ width: isSidebarOpen ? '260px' : '80px' }}
            className="h-full border-r border-white/10 bg-white/5 backdrop-blur-xl flex flex-col transition-all duration-300"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-red-500 to-green-500 rounded-lg shadow-lg" />
              {isSidebarOpen && <span className="font-bold tracking-tight text-xl uppercase">Getedil</span>}
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              <NavItem icon={<Home size={20} />} label="Stage" active={activePillar === 'Home'} collapsed={!isSidebarOpen} />
              <NavItem icon={<Briefcase size={20} />} label="GetHired" active={activePillar === 'P4'} collapsed={!isSidebarOpen} />
              <NavItem icon={<Wallet size={20} />} label="GetPaid" active={activePillar === 'P6'} collapsed={!isSidebarOpen} />
              <NavItem icon={<GraduationCap size={20} />} label="GetSkills" active={activePillar === 'P5'} collapsed={!isSidebarOpen} />
            </nav>

            <div className="p-4 border-t border-white/10">
              <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} />
            </div>
          </motion.aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Top Command Bar */}
          <header className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1">
              {isMobile && <Menu size={24} onClick={() => setSidebarOpen(true)} />}
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Ask GETE (e.g., 'Find me a job')..." 
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <Mic size={20} className="text-red-400" />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden">
                <img src="/api/placeholder/40/40" alt="User" />
              </div>
            </div>
          </header>

          {/* Center Stage: The 27 Pillars Grid */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillar}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Nav */}
          {isMobile && (
            <nav className="h-20 bg-black/40 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-4">
              <MobileNavItem icon={<Home />} active />
              <MobileNavItem icon={<Briefcase />} />
              <div className="relative -top-6">
                <button className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-2xl rotate-45 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <Mic className="-rotate-45 text-white" />
                </button>
              </div>
              <MobileNavItem icon={<Wallet />} />
              <MobileNavItem icon={<Settings />} />
            </nav>
          )}
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, collapsed }) => (
  <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-white/10 text-emerald-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
    {icon}
    {!collapsed && <span className="font-medium">{label}</span>}
  </div>
);

const MobileNavItem = ({ icon, active }) => (
  <div className={`p-2 rounded-lg ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
    {React.cloneElement(icon, { size: 24 })}
  </div>
);

export default AppShell;

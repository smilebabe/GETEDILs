// ============================================
        )}

        {/* Main */}
        <main className="flex-1 flex flex-col">

          {/* Top Bar */}
          <header className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1">
              {isMobile && (
                <Icons.Menu size={24} onClick={() => setSidebarOpen(true)} />
              )}

              <div className="relative w-full max-w-md">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                  placeholder="Ask GETE..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[var(--color-primary)]/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full bg-white/5">
                <Icons.Mic size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/10" />
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillar}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Nav */}
          {isMobile && (
            <nav className="h-20 bg-black/40 backdrop-blur-xl flex justify-around items-center">
              {visiblePillars.slice(0,5).map((p) => {
                const Icon = Icons[p.icon] || Icons.Circle;
                return (
                  <MobileNavItem key={p.id} icon={<Icon />} active={activePillar === p.id} />
                );
              })}
            </nav>
          )}

        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, collapsed }) => (
  <div className={`flex items-center gap-4 p-3 rounded-xl transition ${active ? 'bg-white/10 text-[var(--color-primary)]' : 'text-white/60 hover:bg-white/5'}`}>
    {icon}
    {!collapsed && <span>{label}</span>}
  </div>
);

const MobileNavItem = ({ icon, active }) => (
  <div className={`${active ? 'text-[var(--color-primary)]' : 'text-white/40'}`}>
    {React.cloneElement(icon, { size: 24 })}
  </div>
);

export default AppShell;

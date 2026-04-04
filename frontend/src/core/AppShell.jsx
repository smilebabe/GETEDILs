import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { REGISTRY } from './Registry';
import { injectTheme } from './initTheme';

import { usePillarNavigation } from '@/hooks/usePillarNavigation';
import useVoiceIntent from '@/hooks/useVoiceIntent';

import PillarOverlay from '@/components/navigation/PillarOverlay';
import WalletBalance from '@/components/wallet/WalletBalance';

export default function AppShell() {
  const {
    activeOverlay,
    openPillar,
    closeOverlay
  } = usePillarNavigation();

  // 🎨 Inject theme once
  useEffect(() => {
    injectTheme();
  }, []);

  // 🎤 Voice control
  useVoiceIntent(openPillar);

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-white p-6">

      {/* 🔝 Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold tracking-wide">
          GETEDIL OS
        </h1>

        {/* 💰 Wallet */}
        <WalletBalance value={1250.75} />
      </div>

      {/* 🧩 Pillar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {REGISTRY.map((pillar) => (
          <motion.div
            key={pillar.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openPillar(pillar.name)}
            className="cursor-pointer p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition"
          >
            <div className="text-sm text-white/50 mb-2">
              {pillar.id}
            </div>

            <div className="text-lg font-medium">
              {pillar.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🌐 Overlay Layer */}
      <PillarOverlay
        isOpen={!!activeOverlay}
        title={activeOverlay}
        onClose={closeOverlay}
      />
    </div>
  );
}

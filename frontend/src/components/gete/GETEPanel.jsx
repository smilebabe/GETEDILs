import { motion, AnimatePresence } from 'framer-motion';
import { useGETEStore } from '@/store/geteStore';
import { getSuggestion } from '@/core/geteBrain';

export default function GETEPanel() {
  const { isOpen, close, context, messages } = useGETEStore();

  const suggestion = getSuggestion(context);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed right-4 bottom-4 w-[320px] h-[420px] z-50 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between">
            <span className="font-semibold">GETE AI</span>
            <button onClick={close}>×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-2">
            {messages.map((m, i) => (
              <div key={i} className="opacity-80">
                <b>{m.role}:</b> {m.text}
              </div>
            ))}
          </div>

          {/* Suggestion */}
          <div className="p-3 border-t border-white/10 text-xs text-yellow-300">
            💡 {suggestion}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

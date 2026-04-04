import React from 'react';
import { motion } from 'framer-motion';

const CommandCenter = ({ onCommand, isListening, onStartListening, onStopListening, transcript, isProcessing, response }) => {
  const [inputText, setInputText] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onCommand(inputText);
      setInputText('');
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Response Display */}
      <div className="min-h-[80px] p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-zinc-300">
        {isProcessing ? (
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            GETE is thinking...
          </motion.span>
        ) : (
          response || "How can I help you navigate GETEDIL today?"
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <input
          type="text"
          value={isListening ? transcript : inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type a command..."}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500/50 outline-none transition-all"
        />
        
        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 hover:bg-yellow-400'}`}
        >
          {isListening ? '🛑' : '🎙️'}
        </button>
      </form>
    </div>
  );
};

export default CommandCenter;

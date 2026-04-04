import { create } from 'zustand';

export const useGETEStore = create((set) => ({
  isOpen: false,
  context: null, 
  messages: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  // ENHANCED: Auto-opens and resets UI for the new Pillar
  setContext: (ctx) => set((state) => ({ 
    context: ctx, 
    isOpen: true, // Auto-open the panel when a pillar is clicked
    // Optional: Clear old messages to prevent "System Offline" spam
    messages: ctx ? [] : state.messages 
  })),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg]
    })),

  // New helper to clear everything
  resetSystem: () => set({ messages: [], context: null })
}));

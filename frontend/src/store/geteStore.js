import { create } from 'zustand';

export const useGETEStore = create((set) => ({
  isOpen: false,
  context: null, // active pillar
  messages: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  setContext: (ctx) => set({ context: ctx }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg]
    }))
}));

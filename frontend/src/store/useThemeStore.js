// ============================================
// frontend/src/store/useThemeStore.js
// ============================================
import { create } from 'zustand';
import { THEME } from '@/config/theme';

const DARK_THEME = {
  COLORS: {
    PRIMARY: '#0E5E2A',
    SECONDARY: '#FCDD09',
    ACCENT: '#DA121A',
    DARK: '#050505',
    LIGHT: '#121212'
  }
};

export const useThemeStore = create((set) => ({
  theme: THEME,
  mode: 'light',

  toggleTheme: () =>
    set((state) => {
      const next = state.mode === 'light' ? 'dark' : 'light';
      const theme = next === 'dark' ? DARK_THEME : THEME;

      import('@/core/initTheme').then(({ injectTheme }) => {
        injectTheme(theme);
      });

      return { mode: next, theme };
    })
}));

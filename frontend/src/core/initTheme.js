// ============================================
// frontend/src/core/initTheme.js
// ============================================
import { THEME } from '@/config/theme';

export const injectTheme = (theme = THEME) => {
  const root = document.documentElement;

  Object.entries(theme.COLORS).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.toLowerCase()}`, value);
  });
};

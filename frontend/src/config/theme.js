// ============================================
// frontend/src/config/theme.js
// ============================================
// Centralized theme system for GETEDIL OS

export const THEME = Object.freeze({
  COLORS: {
    PRIMARY: '#078930',       // Ethiopian Green
    SECONDARY: '#FCDD09',     // Ethiopian Yellow
    ACCENT: '#DA121A',        // Ethiopian Red
    DARK: '#0B0F0C',
    LIGHT: '#F9FAFB'
  },

  UI: {
    BORDER_RADIUS: '1rem',
    GLASS_BG: 'rgba(255,255,255,0.08)',
    GLASS_BLUR: 'blur(12px)'
  }
});

// Helper functions
export const getColor = (key) => THEME.COLORS[key];

// ============================================
// Example Usage Across System
// ============================================

// 1. React Component
/*
import { THEME } from '@/config/theme';

const Button = () => (
  <button style={{ backgroundColor: THEME.COLORS.PRIMARY }}>
    Click Me
  </button>
);
*/

// 2. Zustand Store (UI State)
/*
import { create } from 'zustand';
import { THEME } from '@/config/theme';

export const useUIStore = create(() => ({
  theme: THEME,
}));
*/

// 3. Chart Config
/*
const chartOptions = {
  colors: [THEME.COLORS.PRIMARY, THEME.COLORS.SECONDARY]
};
*/

// 4. CSS Variables Injection (Recommended)
/*
:root {
  --color-primary: #078930;
}
*/

// Future Ready: Dynamic Theme Switching
export const createTheme = (overrides = {}) => ({
  ...THEME,
  ...overrides
});

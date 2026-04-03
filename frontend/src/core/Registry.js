// ============================================
// frontend/src/core/Registry.js
// ============================================
// Central registry for all GETEDIL pillars
// This acts as the single source of truth for routing, permissions, and UI mapping

export const PILLAR_REGISTRY = Object.freeze([
  { id: 'P0', name: 'Onboarding', icon: 'UserPlus', path: '/onboarding', permission: 'public' },
  { id: 'P1', name: 'GetConsultancy', icon: 'Briefcase', path: '/consultancy', permission: 'user' },
  { id: 'P2', name: 'GetHome', icon: 'Home', path: '/home', permission: 'user' },
  { id: 'P3', name: 'GetVerified', icon: 'ShieldCheck', path: '/verified', permission: 'user' },
  { id: 'P4', name: 'GetHired', icon: 'Users', path: '/jobs', permission: 'user' },
  { id: 'P5', name: 'GetSkills', icon: 'GraduationCap', path: '/skills', permission: 'user' },
  { id: 'P6', name: 'GetPaid', icon: 'Wallet', path: '/wallet', permission: 'user' },
  { id: 'P7', name: 'GetConnected', icon: 'Share2', path: '/social', permission: 'user' },
  { id: 'P8', name: 'GetCreated', icon: 'Video', path: '/creator', permission: 'user' },
  { id: 'P9', name: 'GetTraded', icon: 'ShoppingCart', path: '/marketplace', permission: 'user' },
  { id: 'P10', name: 'GetDiaspora', icon: 'Globe', path: '/diaspora', permission: 'user' },
  { id: 'P11', name: 'GetTender', icon: 'FileText', path: '/tender', permission: 'user' },
  { id: 'P12', name: 'GetLegal', icon: 'Scale', path: '/legal', permission: 'user' },
  { id: 'P13', name: 'GetDelivery', icon: 'Truck', path: '/delivery', permission: 'user' },
  { id: 'P14', name: 'GetHiredPlus', icon: 'Star', path: '/jobs-plus', permission: 'premium' },
  { id: 'P15', name: 'GetShopping', icon: 'Store', path: '/shopping', permission: 'user' },
  { id: 'P16', name: 'GetSelling', icon: 'Tag', path: '/selling', permission: 'user' },
  { id: 'P17', name: 'GetPaidPlus', icon: 'CreditCard', path: '/payments-plus', permission: 'premium' },
  { id: 'P18', name: 'GetConnectedPlus', icon: 'Users2', path: '/social-plus', permission: 'premium' },
  { id: 'P19', name: 'GetProfiled', icon: 'User', path: '/profile', permission: 'user' },
  { id: 'P20', name: 'GetAdmin', icon: 'Settings', path: '/admin', permission: 'admin' },
  { id: 'P21', name: 'GetAPI', icon: 'Code', path: '/api', permission: 'developer' },
  { id: 'P22', name: 'GetLocal', icon: 'MapPin', path: '/local', permission: 'user' },
  { id: 'P23', name: 'GetPlans', icon: 'Layers', path: '/plans', permission: 'user' },
  { id: 'P24', name: 'GetReferral', icon: 'Gift', path: '/referral', permission: 'user' },
  { id: 'P25', name: 'GetNotified', icon: 'Bell', path: '/notifications', permission: 'user' },
  { id: 'P26', name: 'GetReporting', icon: 'BarChart3', path: '/reports', permission: 'admin' },
  { id: 'P27', name: 'GetAutomated', icon: 'Bot', path: '/automation', permission: 'admin' }
]);

export const getPillarByPath = (path) =>
  PILLAR_REGISTRY.find((p) => p.path === path);

export const getPillarsByPermission = (level) =>
  PILLAR_REGISTRY.filter((p) => p.permission === level);

// ============================================
// frontend/src/core/Registry.js
// ============================================
// Central registry for all GETEDIL pillars
// Enterprise-grade: role hierarchy, governance metadata, categories, descriptions, icons, utilities

import {
  UserPlus, Briefcase, Home, ShieldCheck, Users, GraduationCap,
  Wallet, Share2, Video, ShoppingCart, Globe, FileText, Scale,
  Truck, Star, Store, Tag, CreditCard, Users2, User, Settings,
  Code, MapPin, Layers, Gift, Bell, BarChart3, Bot, Database
} from 'lucide-react';

// 🔹 Role hierarchy map for consistent enforcement
export const ROLE_LEVELS = {
  public: 0,
  user: 1,
  premium: 2,
  admin: 3,
  developer: 4
};

// 🔹 Central pillar registry
export const REGISTRY = Object.freeze([
  // Core
  {
    id: 'P0',
    name: 'Onboarding',
    icon: UserPlus,
    path: '/onboarding',
    permission: 'public',
    category: 'Core',
    description: 'Start your GETEDIL journey',
    auditable: false
  },
  {
    id: 'P1',
    name: 'GetConsultancy',
    icon: Briefcase,
    path: '/consultancy',
    permission: 'user',
    category: 'Services',
    description: 'Access professional consultancy',
    auditable: true
  },
  {
    id: 'P4',
    name: 'GetHired',
    icon: Users,
    path: '/jobs',
    permission: 'user',
    category: 'Employment',
    description: 'Browse and apply for jobs',
    auditable: true
  },

  // Commerce
  {
    id: 'P9',
    name: 'GetTraded',
    icon: ShoppingCart,
    path: '/marketplace',
    permission: 'user',
    category: 'Commerce',
    description: 'Marketplace for goods and services',
    auditable: true
  },
  {
    id: 'P10',
    name: 'GetStore',
    icon: Store,
    path: '/store',
    permission: 'premium',
    category: 'Commerce',
    description: 'Premium storefront for curated products',
    auditable: true
  },

  // Governance
  {
    id: 'P20',
    name: 'GetAdmin',
    icon: Settings,
    path: '/admin',
    permission: 'admin',
    category: 'Governance',
    description: 'Administrative controls and oversight',
    auditable: true
  },
  {
    id: 'P21',
    name: 'PoliceDB',
    icon: ShieldCheck,
    path: '/police',
    permission: 'admin',
    category: 'Governance',
    description: 'Law enforcement database access',
    auditable: true
  },
  {
    id: 'P22',
    name: 'LegalRecords',
    icon: Scale,
    path: '/legal',
    permission: 'admin',
    category: 'Governance',
    description: 'Court and legal document repository',
    auditable: true
  },

  // AI & Automation
  {
    id: 'P27',
    name: 'GetAutomated',
    icon: Bot,
    path: '/automation',
    permission: 'admin',
    category: 'AI',
    description: 'Automation and orchestration workflows',
    auditable: true
  },
  {
    id: 'P28',
    name: 'DeveloperHub',
    icon: Code,
    path: '/devhub',
    permission: 'developer',
    category: 'AI',
    description: 'Developer tools, APIs, and orchestration',
    auditable: true
  },

  // Finance
  {
    id: 'P30',
    name: 'Wallet',
    icon: Wallet,
    path: '/wallet',
    permission: 'user',
    category: 'Finance',
    description: 'Digital wallet and payments',
    auditable: true
  },
  {
    id: 'P31',
    name: 'CreditServices',
    icon: CreditCard,
    path: '/credit',
    permission: 'premium',
    category: 'Finance',
    description: 'Credit scoring and premium financial services',
    auditable: true
  },

  // Education
  {
    id: 'P40',
    name: 'Academy',
    icon: GraduationCap,
    path: '/academy',
    permission: 'user',
    category: 'Education',
    description: 'Learning modules and certifications',
    auditable: true
  },

  // Analytics
  {
    id: 'P50',
    name: 'GovernanceAnalytics',
    icon: BarChart3,
    path: '/analytics',
    permission: 'admin',
    category: 'Analytics',
    description: 'Real-time dashboards and governance metrics',
    auditable: true
  }
]);

// 🔹 Utility functions

// Find pillar by path
export const getPillarByPath = (path) =>
  REGISTRY.find((p) => p.path === path);

// Find pillars by exact permission level
export const getPillarsByPermission = (level) =>
  REGISTRY.filter((p) => p.permission === level);

// Find all pillars accessible to a given role (respecting hierarchy)
export const getAccessiblePillars = (role) => {
  const roleLevel = ROLE_LEVELS[role] ?? 0;
  return REGISTRY.filter((p) => ROLE_LEVELS[p.permission] <= roleLevel);
};

// Get all auditable pillars (for governance dashboards)
export const getAuditablePillars = () =>
  REGISTRY.filter((p) => p.auditable);

// Group pillars by category (for UI grouping)
export const getPillarsByCategory = () => {
  return REGISTRY.reduce((acc, pillar) => {
    acc[pillar.category] = acc[pillar.category] || [];
    acc[pillar.category].push(pillar);
    return acc;
  }, {});
};

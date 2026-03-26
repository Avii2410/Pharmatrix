/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Pharmatrix — Centralized Role-Based Permissions                ║
 * ║                                                                  ║
 * ║  Every module lives here exactly once.                           ║
 * ║  App.jsx and Sidebar.jsx derive everything from PERMISSIONS.     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * To add a new module:
 *   1. Add one entry to PERMISSIONS below.
 *   2. Set `roles` to the roles that can access it.
 *   Done — routing, sidebar, and guards all update automatically.
 *
 * To change a role's access:
 *   Update only the `roles` array on the relevant PERMISSIONS entry.
 */

import {
  Activity, BarChart2, Search, AlertTriangle, MapPin,
  Repeat, ShieldAlert, Receipt, FileText, ShieldCheck, Box, RefreshCcw, Shield, Bell, CreditCard, ShoppingCart
} from 'lucide-react';

// ─── Role metadata ────────────────────────────────────────────────────────────
export const ROLE_META = {
  Patient:    { label: 'Patient',        color: '#059669', home: '/scanner'    },
  Pharmacist: { label: 'Pharmacist',     color: '#0f766e', home: '/dashboard'  },
  Admin:      { label: 'Administrator',  color: '#1e4ed8', home: '/analytics'  },
  SuperAdmin: { label: 'Pharmatrix Team',color: '#d97706', home: '/superadmin' },
};

// ─── Master permissions map ───────────────────────────────────────────────────
// Each entry owns: path, label, icon, allowed roles, and the lazy-loaded page.
// `component` intentionally left as null here — components are injected in
// App.jsx to keep this file free of React import cycles.
export const PERMISSIONS = [
  {
    path:  '/dashboard',
    label: 'Market Dashboard',
    icon:  Activity,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/analytics',
    label: 'Intelligence & Reports',
    icon:  BarChart2,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/inventory',
    label: 'Inventory Registry',
    icon:  Box,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/purchase',
    label: 'Procurement Center',
    icon:  ShoppingCart,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/billing',
    label: 'Billing System',
    icon:  Receipt,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/scanner',
    label: 'Medicine Scanner',
    icon:  Search,
    roles: ['Patient', 'Admin'],
  },
  {
    path:  '/interactions',
    label: 'Interaction Checker',
    icon:  AlertTriangle,
    roles: ['Patient', 'Pharmacist', 'Admin'],
  },
  {
    path:  '/nearby',
    label: 'Nearby Availability',
    icon:  MapPin,
    roles: ['Patient', 'Admin'],
  },
  {
    path:  '/substitute',
    label: 'Brand Substitution',
    icon:  Repeat,
    roles: ['Patient', 'Pharmacist', 'Admin'],
  },
  {
    path:  '/adr',
    label: 'ADR Monitoring',
    icon:  ShieldAlert,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/returns',
    label: 'Sales Return',
    icon:  RefreshCcw,
    roles: ['Pharmacist', 'Admin'],
  },
  {
    path:  '/prescription',
    label: 'Prescription Upload',
    icon:  FileText,
    roles: ['Patient', 'Admin'],
  },
  {
    path:  '/counterfeit',
    label: 'Counterfeit Detection',
    icon:  ShieldCheck,
    roles: ['Patient', 'Pharmacist', 'Admin'],
  },
  {
    path:  '/alerts',
    label: 'Automation Alerts',
    icon:  Bell,
    roles: ['Admin'],
  },
  {
    path:  '/abha',
    label: 'ABHA Digital Health',
    icon:  CreditCard,
    roles: ['Admin'],
  },
  {
    path:  '/superadmin',
    label: 'Multi-Branch Management',
    icon:  Shield,
    roles: ['Admin', 'SuperAdmin'],
  },
];

// ─── Derived helpers (computed once, reused everywhere) ───────────────────────

/** Returns true when `role` is allowed to visit `path`. */
export function canAccess(role, path) {
  const entry = PERMISSIONS.find(p => p.path === path);
  return Boolean(entry?.roles.includes(role));
}

/** Returns the home path for a given role. */
export function getHome(role) {
  return ROLE_META[role]?.home ?? PERMISSIONS.find(p => p.roles.includes(role))?.path ?? '/';
}

/** Returns only the PERMISSIONS entries visible to `role`. */
export function getNavFor(role) {
  return PERMISSIONS.filter(p => p.roles.includes(role));
}

import { MEDICINE_DATA, INVENTORY_DATA, ANALYTICS_SALES, ANALYTICS_PURCHASES } from '../data/mockData';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Pharmatrix — Centralized LocalStorage Data Manager             ║
 * ║                                                                  ║
 * ║  This service ensures that all modules (Billing, Inventory,     ║
 * ║  Analytics) read and write to the same source of truth.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const KEYS = {
  INVENTORY: 'local_inventory',
  SALES:     'local_sales',
  PURCHASES: 'local_purchases',
  ALERTS:    'local_alerts',
  ADR:       'local_adr',
  DISCOUNTS: 'local_discounts',
};

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
const init = () => {
  if (!localStorage.getItem(KEYS.INVENTORY)) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(INVENTORY_DATA));
  }
  if (!localStorage.getItem(KEYS.SALES)) {
    // We only take a subset of mock sales to make initial dashboard feel "fresh"
    localStorage.setItem(KEYS.SALES, JSON.stringify(ANALYTICS_SALES.slice(-50)));
  }
  if (!localStorage.getItem(KEYS.PURCHASES)) {
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(ANALYTICS_PURCHASES.slice(-20)));
  }
};

init();

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export const getInventory = () => {
  return JSON.parse(localStorage.getItem(KEYS.INVENTORY) || '[]');
};

export const updateInventory = (inventory) => {
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  checkStockAlerts(inventory);
};

export const editStockItem = (id, updates) => {
  const inv = getInventory();
  const idx = inv.findIndex(item => item.id === id);
  if (idx !== -1) {
    inv[idx] = { ...inv[idx], ...updates };
    updateInventory(inv);
  }
};

// ─── SALES ────────────────────────────────────────────────────────────────────
export const getSales = () => {
  return JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
};

export const addSale = (sale) => {
  const sales = getSales();
  sales.push({
    ...sale,
    id: sale.id || 'SALE' + Date.now(),
    date: sale.date || new Date().toISOString()
  });
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
};

// ─── PURCHASES ────────────────────────────────────────────────────────────────
export const getPurchases = () => {
  return JSON.parse(localStorage.getItem(KEYS.PURCHASES) || '[]');
};

export const addPurchase = (purchase) => {
  const purchases = getPurchases();
  purchases.push({
    ...purchase,
    id: purchase.id || 'PURC' + Date.now(),
    date: purchase.date || new Date().toISOString()
  });
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
  
  // Directly affect Inventory when a purchase is made
  const inv = getInventory();
  purchase.items.forEach(item => {
    const idx = inv.findIndex(i => i.id === item.id || i.name === item.name);
    if (idx !== -1) {
      inv[idx].totalUnits += Number(item.quantity) * (inv[idx].unitsPerStrip || 1);
      inv[idx].strips = Math.floor(inv[idx].totalUnits / (inv[idx].unitsPerStrip || 1));
      inv[idx].looseUnits = inv[idx].totalUnits % (inv[idx].unitsPerStrip || 1);
    }
  });
  updateInventory(inv);
};

// ─── ALERTS ───────────────────────────────────────────────────────────────────
export const getAlerts = () => {
  return JSON.parse(localStorage.getItem(KEYS.ALERTS) || '[]');
};

export const addAlert = (alert) => {
  const alerts = getAlerts();
  // Avoid duplicate alerts for the same medicine in the same hour
  const existing = alerts.find(a => a.message === alert.message);
  if (existing) return;

  alerts.unshift({
    ...alert,
    id: Date.now(),
    time: 'Just now'
  });
  localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts.slice(0, 50)));
};

export const dismissAlert = (id) => {
  const alerts = getAlerts().filter(a => a.id !== id);
  localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
};

// Internal check triggered whenever inventory changes
const checkStockAlerts = (inventory) => {
  inventory.forEach(item => {
    if (item.totalUnits <= item.lowStockThreshold) {
      addAlert({
        type: 'warning',
        message: `Low Stock: ${item.name} (Only ${item.totalUnits} units left)`,
        channels: ['Email', 'System UI']
      });
    }
  });
};

// ─── MASTER SEARCH ────────────────────────────────────────────────────────────
export const getMedicineMaster = () => MEDICINE_DATA;

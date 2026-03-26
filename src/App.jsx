import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Auth    from './pages/Auth';
import { PERMISSIONS, canAccess, getHome } from './auth/roles';

// ─── Page components — injected here so roles.js stays icon/component-free ───
import Dashboard            from './pages/Dashboard';
import Analytics            from './pages/Analytics';
import MedicineScanner      from './pages/MedicineScanner';
import InteractionChecker   from './pages/InteractionChecker';
import NearbyAvailability   from './pages/NearbyAvailability';
import BrandSubstitution    from './pages/BrandSubstitution';
import ADRMonitoring        from './pages/ADRMonitoring';
import BillingSystem        from './pages/BillingSystem';
import PrescriptionAnalyzer from './pages/PrescriptionAnalyzer';
import CounterfeitDetection from './pages/CounterfeitDetection';
import InventoryManagement  from './pages/InventoryManagement';
import PurchaseManagement   from './pages/PurchaseManagement';
import SalesReturn          from './pages/SalesReturn';
import SuperAdminPanel      from './pages/SuperAdminPanel';
import AutomationAlerts     from './pages/AutomationAlerts';
import ABHAIntegration      from './pages/ABHAIntegration';
import ErrorBoundary        from './components/ErrorBoundary';

/**
 * Maps each route path → its React component.
 * This is the ONLY place page components are referenced.
 * Adding a new page: add it here + add it to PERMISSIONS in roles.js.
 */
const PAGE_MAP = {
  '/dashboard':    <Dashboard/>,
  '/analytics':    <Analytics/>,
  '/scanner':      <MedicineScanner/>,
  '/interactions': <InteractionChecker/>,
  '/nearby':       <NearbyAvailability/>,
  '/substitute':   <BrandSubstitution/>,
  '/adr':          <ADRMonitoring/>,
  '/billing':      <BillingSystem/>,
  '/prescription': <PrescriptionAnalyzer/>,
  '/counterfeit':  <CounterfeitDetection/>,
  '/inventory':    <InventoryManagement/>,
  '/purchase':     <PurchaseManagement/>,
  '/returns':      <SalesReturn/>,
  '/superadmin':   <SuperAdminPanel/>,
  '/alerts':       <AutomationAlerts/>,
  '/abha':         <ErrorBoundary><ABHAIntegration/></ErrorBoundary>,
};

// ─── Notification Component ──────────────────────────────────────────────────
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="access-toast">
      <div className="toast-content">
        <span className="toast-icon">🚫</span>
        <span className="toast-text">{message}</span>
        <button onClick={onClose} className="toast-close">&times;</button>
      </div>
    </div>
  );
}

// ─── Redirect Guard ──────────────────────────────────────────────────────────
function RedirectGuard({ role, path, onDenied }) {
  const home = getHome(role);
  
  React.useEffect(() => {
    if (!canAccess(role, path)) {
      onDenied("You do not have access to this module.");
    }
  }, [role, path, onDenied]);

  if (!canAccess(role, path)) {
    return <Navigate to={home} replace />;
  }

  return PAGE_MAP[path] || <Navigate to={home} replace />;
}

// ─── Authenticated shell ──────────────────────────────────────────────────────
function AppShell({ user, onLogout }) {
  const role = user?.role || 'Patient';
  const home = getHome(role);
  const [notification, setNotification] = useState(null);

  const showDenied = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={onLogout}/>
      <main className="content-wrapper">
        <Notification message={notification} onClose={() => setNotification(null)} />
        <Routes>
          {/* Root → role's home page */}
          <Route path="/" element={<Navigate to={home} replace/>}/>

          {/* 
           * Dynamically generate one <Route> per entry in PERMISSIONS.
           * If unauthorized, RedirectGuard will redirect and trigger the notification.
           */}
          {PERMISSIONS.map(({ path }) => (
            <Route
              key={path}
              path={path}
              element={<RedirectGuard role={role} path={path} onDenied={showDenied} />}
            />
          ))}

          {/* Unknown paths → role home */}
          <Route path="*" element={<Navigate to={home} replace/>}/>
        </Routes>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );

  React.useEffect(() => {
    document.title = user ? `Pharmatrix | ${user.role} Portal` : 'Pharmatrix | Smart Pharmacy Intelligence';
  }, [user]);

  const handleLogin  = u => { setUser(u); localStorage.setItem('currentUser', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('currentUser'); };

  return (
    <BrowserRouter>
      {user ? (
        <AppShell user={user} onLogout={handleLogout}/>
      ) : (
        <Routes>
          <Route path="/login" element={<Auth onLogin={handleLogin}/>}/>
          <Route path="*"      element={<Navigate to="/login" replace/>}/>
        </Routes>
      )}
    </BrowserRouter>
  );
}

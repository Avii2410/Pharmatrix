import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import { getNavFor, ROLE_META } from '../auth/roles';
import './Sidebar.css';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const role     = user?.role || 'Patient';
  const meta     = ROLE_META[role] || ROLE_META.Patient;
  const navItems = getNavFor(role);

  const initials = (user?.name || 'U')
    .split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* ── Pharmatrix Brand ── */}
      <div className="sidebar-header">
        <div className="logo-icon"><ShieldCheck size={28} color="white"/></div>
        <h1 className="logo-text">Pharmatrix</h1>
      </div>

      {/* ── Role Badge ── */}
      <div className="sidebar-role-badge" style={{ borderLeftColor: meta.color }}>
        <div className="role-chip" style={{ background: `${meta.color}35`, color: 'white' }}>
          <span className="pulse-dot" style={{ background: 'white', boxShadow: `0 0 8px ${meta.color}` }} />
          {meta.label}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link to={path} className={`nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={20} className="nav-icon"/>
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="active-arrow" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Profile Footer ── */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar" style={{ background: `linear-gradient(135deg, ${meta.color}, #334155)` }}>
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email">{user?.email || 'user@pharmatrix.com'}</div>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          <LogOut size={16}/> Logout
        </button>
      </div>
    </aside>
  );
}

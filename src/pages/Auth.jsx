import React, { useState, useEffect } from 'react';
import { Activity, UserPlus, LogIn, Mail, Lock, User, Shield, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import './Pages.css';

// ─── Seeded demo accounts ─────────────────────────────────────────────────────
const DEMO_USERS = [
  { name: 'Admin User',      email: 'admin@pharmatrix.com',       password: 'admin123',       role: 'Admin'      },
  { name: 'Pharmacist User', email: 'pharmacist@pharmatrix.com',  password: 'pharmacist123',  role: 'Pharmacist' },
  { name: 'Patient User',    email: 'patient@pharmatrix.com',     password: 'patient123',     role: 'Patient'    },
  { name: 'Super Admin',     email: 'superadmin@pharmatrix.com',  password: 'superadmin123',  role: 'SuperAdmin' },
];

const ROLE_COLORS = { Admin: '#2563eb', Pharmacist: '#0d9488', Patient: '#10b981', SuperAdmin: '#f59e0b' };
const ROLE_DESC   = {
  Admin:      'Full system access — all modules',
  Pharmacist: 'Pharmacy operations — dashboard, billing, ADR',
  Patient:    'Patient tools — scanner, nearby, substitution',
  SuperAdmin: 'Platform monitoring — Pharmatrix team panel',
};

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin]   = useState(true);
  const [showPwd, setShowPwd]   = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [formData, setFormData] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'Patient' });
  const [error, setError]       = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const emails  = new Set(stored.map(u => u.email));
    const merged  = [...stored, ...DEMO_USERS.filter(d => !emails.has(d.email))];
    localStorage.setItem('registeredUsers', JSON.stringify(merged));
  }, []);

  const handle = e => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const submit = e => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

    if (isLogin) {
      const user = users.find(u => u.email === formData.email && u.password === formData.password);
      if (user) { onLogin(user); }
      else       { setError('Invalid email or password. Try a demo account below.'); }
    } else {
      if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
      if (formData.password.length < 6)                  { setError('Password must be at least 6 characters'); return; }
      const newUser = { name: formData.name, email: formData.email, password: formData.password, role: formData.role };
      localStorage.setItem('registeredUsers', JSON.stringify([...users, newUser]));
      onLogin(newUser);
    }
  };

  const quickLogin = (user) => onLogin(user);

  return (
    <div className="auth-page">
      <div className="auth-bg"/>
      <div className="auth-wrap animate-slide-up">

        {/* ── Brand ── */}
        <div className="auth-brand">
          <div className="auth-logo"><ShieldCheck size={36} color="white"/></div>
          <h1 className="auth-title">Pharmatrix</h1>
          <p className="auth-tagline">Pharmacy Intelligence & Drug Safety Platform</p>
        </div>

        {/* ── Card ── */}
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab-btn ${isLogin?'active':''}`} onClick={() => { setIsLogin(true);  setError(''); }}>
              <LogIn size={15}/> Sign In
            </button>
            <button className={`auth-tab-btn ${!isLogin?'active':''}`} onClick={() => { setIsLogin(false); setError(''); }}>
              <UserPlus size={15}/> Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit} className="auth-form">
            {!isLogin && (
              <div className="af-field">
                <User size={16} className="af-icon"/>
                <input type="text" name="name" required placeholder="Full Name"
                  className="af-input" value={formData.name} onChange={handle}/>
              </div>
            )}

            <div className="af-field">
              <Mail size={16} className="af-icon"/>
              <input type="email" name="email" required placeholder="Email Address"
                className="af-input" value={formData.email} onChange={handle}/>
            </div>

            <div className="af-field">
              <Lock size={16} className="af-icon"/>
              <input type={showPwd?'text':'password'} name="password" required placeholder="Password"
                className="af-input" value={formData.password} onChange={handle}/>
              <button type="button" className="af-eye" onClick={() => setShowPwd(p=>!p)}>
                {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>

            {!isLogin && (
              <>
                <div className="af-field">
                  <Lock size={16} className="af-icon"/>
                  <input type={showCPwd?'text':'password'} name="confirmPassword" required
                    placeholder="Confirm Password" className="af-input"
                    value={formData.confirmPassword} onChange={handle}/>
                  <button type="button" className="af-eye" onClick={() => setShowCPwd(p=>!p)}>
                    {showCPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>

                <div className="af-field">
                  <Shield size={16} className="af-icon"/>
                  <select name="role" className="af-input af-select" value={formData.role} onChange={handle}>
                    <option value="Patient">Patient</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Admin">Admin</option>
                    {/* SuperAdmin usually hidden in real signup but kept for hackathon demo */}
                    <option value="SuperAdmin">Pharmatrix Team</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="auth-submit-btn">
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* ── Quick demo logins ── */}
          {isLogin && (
            <div className="demo-section">
              <div className="demo-divider"><span>OR QUICK SIGN IN</span></div>
              <div className="demo-cards">
                {DEMO_USERS.map(u => {
                  const RoleIcon = u.role === 'Admin' ? Shield : 
                                   u.role === 'Pharmacist' ? Activity : 
                                   u.role === 'Patient' ? User : ShieldCheck;
                  return (
                    <button key={u.role} className="demo-card" onClick={() => quickLogin(u)}
                      style={{ '--dc': ROLE_COLORS[u.role] }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="dc-role" style={{ color: ROLE_COLORS[u.role] }}>{u.role}</span>
                        <RoleIcon size={14} style={{ color: ROLE_COLORS[u.role], opacity: 0.8 }} />
                      </div>
                      <span className="dc-email">{u.email}</span>
                      <span className="dc-hint">{ROLE_DESC[u.role].split('—')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

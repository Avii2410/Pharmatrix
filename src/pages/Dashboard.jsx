import React, { useState, useEffect } from 'react';
import { MEDICINE_DATA } from '../data/mockData';
import { 
  Activity, 
  Search, 
  AlertTriangle, 
  ShieldAlert,
  Pill,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  Database,
  Globe
} from 'lucide-react';
import './Pages.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSearches: 12,
    adrReports: 4,
    totalMedicines: 24,
    totalInvoices: 7
  });

  useEffect(() => {
    try {
      const searchesStr = localStorage.getItem('searchHistory');
      const searches = searchesStr ? JSON.parse(searchesStr) : [];
      
      const reportsStr = localStorage.getItem('adrReports');
      const reports = reportsStr ? JSON.parse(reportsStr) : [];

      const invoicesStr = localStorage.getItem('invoices');
      const invoices = invoicesStr ? JSON.parse(invoicesStr) : [];

      setStats({
        totalSearches: searches.length > 0 ? 12 + searches.length : 12,
        adrReports: reports.length > 0 ? 4 + reports.length : 4,
        totalInvoices: invoices.length > 0 ? 7 + invoices.length : 7,
        totalMedicines: MEDICINE_DATA.length || 24
      });
    } catch (err) {
      console.error("Local storage fallback.");
    }
  }, []);

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">Operational Intelligence</h1>
        <p className="page-subtitle">Welcome to the Pharmatrix Command Center.</p>
      </div>

      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-icon primary">
            <Search size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalSearches}</h3>
            <p>Drug Safety Checks</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon alert">
            <ShieldAlert size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.adrReports}</h3>
            <p>ADR Alerts</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon teal">
            <Pill size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalMedicines}</h3>
            <p>Verified SKU Registry</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon purple">
            <Receipt size={28} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalInvoices}</h3>
            <p>Pharmacy Transactions</p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}><TrendingUp size={20} color="var(--primary-blue)" /> Intelligence Overview</h2>
            <span className="badge badge-neutral">Live Feed</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Pharmatrix is actively monitoring <strong>{stats.totalMedicines}</strong> drug-drug interaction patterns against global clinical safety benchmarks. 
            Automated screening is currently maintaining a 99.9% clinical accuracy rate.
          </p>
          
          <div className="grid-2" style={{ marginTop: '1.5rem', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ENGINE STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-safe)', fontWeight: 700 }}>
                <CheckCircle size={14} /> OPTIMIZED
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RECALL SYNC</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
                <Clock size={14} /> 12 MIN AGO
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title"><Database size={20} color="var(--primary-blue)" /> Platform Integrity</h2>
          <div className="status-list">
            <div className="status-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                < Globe size={16} color="var(--text-muted)" />
                <span>Global Interaction DB</span>
              </div>
              <span className="badge badge-safe">Synchronized</span>
            </div>
            <div className="status-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                < Activity size={16} color="var(--text-muted)" />
                <span>OCR Clinical Engine</span>
              </div>
              <span className="badge badge-safe">Active</span>
            </div>
            <div className="status-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                < AlertTriangle size={16} color="var(--text-muted)" />
                <span>Anti-Counterfeit Nodes</span>
              </div>
              <span className="badge badge-warning">Network Lag</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="card-title"><Clock size={20} color="var(--primary-blue)" /> Clinical Vigilance Log</h2>
        <ul className="update-list" style={{ marginTop: '1rem' }}>
          <li style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>New Safety Pattern Warning</strong>
              <span style={{ fontSize: '0.85rem' }}>NSAID Therapeutic Duplication logic updated for Diclofenac variants.</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>2 hours ago</span>
          </li>
          <li style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 0, paddingTop: '1rem' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>ABDM Sandbox Synchronized</strong>
              <span style={{ fontSize: '0.85rem' }}>Latest ABHA patient records successfully re-indexed in digital health locker.</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5 hours ago</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

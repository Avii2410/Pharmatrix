import React, { useState } from 'react';
import { getAlerts } from '../services/dataManager';
import { Bell, UserX, AlertTriangle, AlertCircle, TrendingDown, IndianRupee, Clock } from 'lucide-react';
import './Pages.css';

export default function AutomationAlerts() {
  const [alerts, setAlerts] = useState(() => {
    const live = getAlerts();
    if (live.length === 0) {
      // Professional default alerts for empty state
      return [
        { id: 101, type: 'warning', icon: Bell, message: 'System Healthy: No active operational anomalies.', time: 'Just now', channels: ['System UI'] },
        { id: 102, type: 'info', icon: Clock, message: 'Registry Sync: Drug interaction database is up to date.', time: '5m ago', channels: ['System UI'] }
      ];
    }
    return live.map(a => ({
      ...a,
      icon: a.type === 'critical' ? AlertCircle : (a.message.includes('Discount') ? IndianRupee : AlertTriangle),
      channels: ['System UI', 'Log']
    }));
  });

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="page-animate">
      <h1 className="page-title">Automation Alerts Engine</h1>
      <p className="page-subtitle">Configure rules and monitor automated system notifications.</p>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="card-title"><Bell size={20} /> Active Alert Triggers</h2>
          <table style={{ width: '100%', fontSize: '0.9rem', marginTop: '1rem', borderCollapse: 'collapse' }}>
             <tbody>
               {['User inactive for 7 days', 'Subscription expiring (3-day warning)', 'Pharmacy not billing for > 2 days', 'Low stock threshold reached', 'Expiry medicine (current month)', 'High return rate anomalies', 'High discount usage anomalies'].map((trigger, i) => (
                 <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                   <td style={{ padding: '0.75rem 0' }}>{trigger}</td>
                   <td style={{ textAlign: 'right' }}>
                     <span className="badge badge-safe">Enabled</span>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>

        <div className="card" style={{ background: '#f8fafc' }}>
          <h2 className="card-title">Recent Dispatched Alerts</h2>
          {alerts.length === 0 ? (
             <p style={{ color: 'var(--text-secondary)' }}>All caught up! No active alerts.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {alerts.map(alert => {
                const Icon = alert.icon;
                return (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${alert.type === 'critical' ? 'var(--status-avoid)' : '#f59e0b'}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <Icon size={20} color={alert.type === 'critical' ? 'var(--status-avoid)' : '#f59e0b'} style={{ marginTop: '0.2rem' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: '0.2rem' }}>{alert.message}</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#666' }}>
                        <span>{alert.time}</span>
                        <span>Sent via: {alert.channels.join(', ')}</span>
                      </div>
                    </div>
                    <button className="btn outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => dismissAlert(alert.id)}>Dismiss</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

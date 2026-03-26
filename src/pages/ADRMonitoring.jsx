import React, { useState, useEffect } from 'react';
import { ADR_RULES } from '../data/mockData';
import { ShieldAlert, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import './Pages.css';

export default function ADRMonitoring() {
  const [formData, setFormData] = useState({
    medicine: '',
    symptom: '',
    severity: 'Mild'
  });
  
  const [reports, setReports] = useState(() => {
    return JSON.parse(localStorage.getItem('adrReports') || '[]');
  });

  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.medicine || !formData.symptom) return;

    // Evaluate Risk using ADR_RULES
    let ruleMatch = ADR_RULES.find(r => 
      r.symptom.toLowerCase().includes(formData.symptom.toLowerCase()) || 
      formData.symptom.toLowerCase().includes(r.symptom.toLowerCase())
    );

    let riskLevel = 'Unknown';
    let recommendation = 'Monitor symptoms and consult a doctor if condition worsens.';

    if (ruleMatch) {
      riskLevel = ruleMatch.riskLevel;
      recommendation = ruleMatch.recommendation;
    } else if (formData.severity === 'Severe') {
      riskLevel = 'High';
      recommendation = 'Seek immediate medical evaluation due to severe symptoms.';
    } else {
      riskLevel = formData.severity === 'Moderate' ? 'Medium' : 'Low';
    }

    const newReport = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      ...formData,
      riskLevel,
      recommendation
    };

    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    localStorage.setItem('adrReports', JSON.stringify(updatedReports));
    
    setResult(newReport);
    setFormData({ medicine: '', symptom: '', severity: 'Mild' });
  };

  const getRiskBadge = (level) => {
    switch(level) {
      case 'High': return 'badge-avoid';
      case 'Medium': return 'badge-warning';
      case 'Low': return 'badge-safe';
      default: return 'badge-neutral';
    }
  };

  const symptomStats = React.useMemo(() => {
    const counts = {};
    reports.forEach(r => {
      // capitalize first letter for display
      let sym = r.symptom.trim().toLowerCase();
      sym = sym.charAt(0).toUpperCase() + sym.slice(1);
      counts[sym] = (counts[sym] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
    return { list: sorted, maxCount };
  }, [reports]);

  return (
    <div className="page-animate">
      <h1 className="page-title">ADR Monitoring System</h1>
      <p className="page-subtitle">Report and track Adverse Drug Reactions.</p>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">File New Report</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Medicine Suspected</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="E.g. Amoxicillin..."
                value={formData.medicine}
                onChange={e => setFormData({...formData, medicine: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Symptom Observed</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="E.g. Nausea, Severe rash..."
                value={formData.symptom}
                onChange={e => setFormData({...formData, symptom: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select 
                className="form-control"
                value={formData.severity}
                onChange={e => setFormData({...formData, severity: e.target.value})}
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Submit Report
            </button>
          </form>

          {result && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Activity size={20} /> Analysis Result
              </h3>
              <p>Risk Level: <span className={`badge ${getRiskBadge(result.riskLevel)}`}>{result.riskLevel}</span></p>
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '4px', borderLeft: '4px solid var(--primary-blue)' }}>
                <strong>Recommendation:</strong> {result.recommendation}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Recent Reports Dashboard</h2>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Reports</p>
              <h3 style={{ fontSize: '1.5rem' }}>{reports.length}</h3>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>High Risk</p>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--status-avoid)' }}>
                {reports.filter(r => r.riskLevel === 'High').length}
              </h3>
            </div>
          </div>

          {symptomStats.list.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Most Common Symptoms</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {symptomStats.list.map(([sym, count]) => (
                  <div key={sym}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>{sym}</span>
                      <span style={{ fontWeight: 'bold' }}>{count}</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        backgroundColor: 'var(--secondary-teal)', 
                        width: `${(count / symptomStats.maxCount) * 100}%`,
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Recent Submissions</h4>
          <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No reports filed yet.</p>
            ) : (
              reports.map(report => (
                <div key={report.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{report.medicine}</strong>
                    <span className={`badge ${getRiskBadge(report.riskLevel)}`}>{report.riskLevel} Risk</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    Symptom: {report.symptom} ({report.severity})
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Date: {report.date}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

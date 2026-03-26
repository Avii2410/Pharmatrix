import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Plus, X, Search, ShieldCheck, Info, Pill, LucideActivity } from 'lucide-react';
import { analyzeInteractions } from '../services/interactionEngine';
import './Pages.css';

export default function InteractionChecker() {
  const location = useLocation();
  const [drugs, setDrugs] = useState(['Aspirin 75mg', 'Ibuprofen 400mg']);
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (location.state?.initialDrugs) {
      const newList = [...new Set([...drugs, ...location.state.initialDrugs])];
      setDrugs(newList);
      
      // Auto-trigger analysis
      setIsAnalyzing(true);
      setTimeout(() => {
        const analysis = analyzeInteractions(newList);
        setResult(analysis);
        setIsAnalyzing(false);
      }, 1500);
    }
  }, [location.state]);

  const addDrug = () => {
    if (inputVal.trim() && !drugs.includes(inputVal.trim())) {
      setDrugs([...drugs, inputVal.trim()]);
      setInputVal('');
      setResult(null);
    }
  };

  const removeDrug = (drug) => {
    setDrugs(drugs.filter(d => d !== drug));
    setResult(null);
  };

  const checkInteractions = () => {
    if (drugs.length < 1) return;
    setIsAnalyzing(true);
    
    // Simulate clinical processing delay for premium feel
    setTimeout(() => {
      const analysis = analyzeInteractions(drugs);
      setResult(analysis);
      setIsAnalyzing(false);
    }, 800);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Avoid': return 'status-avoid';
      case 'Use with Caution': return 'status-warning';
      case 'Needs Review': return 'status-warning';
      case 'Safe': return 'status-safe';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Avoid': return <AlertTriangle size={28} />;
      case 'Use with Caution': return <AlertTriangle size={28} />;
      case 'Needs Review': return <Info size={28} />;
      case 'Safe': return <ShieldCheck size={28} />;
      default: return <AlertTriangle size={28} />;
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">Drug Interaction Engine</h1>
        <p className="page-subtitle">Advanced rule-based screening for contraindications and therapeutic duplications.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="interaction-inputs">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Pill size={18} color="var(--primary-blue)" /> Patient Medication List
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="Enter medicine name (e.g. Aspirin, Ibuprofen)..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') addDrug(); }}
              />
              <button className="btn btn-secondary" onClick={addDrug}>
                <Plus size={18} />
              </button>
            </div>

            <div className="drug-pill-container" style={{ minHeight: '120px', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
              {drugs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '2rem', fontSize: '0.85rem' }}>Your list is empty</div>
              ) : (
                drugs.map((drug, i) => (
                  <span key={i} className="drug-pill animate-fade-in">
                    {drug}
                    <button onClick={() => removeDrug(drug)} className="pill-remove-btn">
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <button 
            className={`btn btn-primary ${isAnalyzing ? 'btn-loading' : ''}`} 
            onClick={checkInteractions} 
            disabled={drugs.length === 0 || isAnalyzing}
            style={{ width: '100%', marginTop: '1.5rem', height: '48px' }}
          >
            {isAnalyzing ? "Processing Rules..." : (
              <><Search size={18} style={{ marginRight: '8px' }} /> Analyze Clinical Compatibility</>
            )}
          </button>
        </div>

        <div className="card result-card-sticky">
          {!result && !isAnalyzing && (
            <div className="empty-state">
              <LucideActivity size={48} color="#e2e8f0" />
              <h4>Waiting for Input</h4>
              <p>Add medicines and click analyze to start the clinical safety engine.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="scanning-state">
              <div className="scan-line" />
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <LucideActivity size={36} className="spin" color="var(--primary-blue)" />
                <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cross-referencing drug-drug interactions...</p>
              </div>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className={`interaction-result-panel ${getStatusClass(result.status)} animate-scale-in`}>
              <div className="result-main-header">
                <div className="result-icon">
                  {getStatusIcon(result.status)}
                </div>
                <div className="result-content">
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>{result.status} SAFETY RATING</h3>
                  <p className="overall-reason" style={{ fontSize: '1.1rem', fontWeight: 500 }}>{result.reason}</p>
                </div>
              </div>

              <div className="findings-list" style={{ marginTop: '2rem' }}>
                <h4 className="findings-title" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>Detailed Findings</h4>
                {result.findings.length > 0 ? (
                  result.findings.map((f, i) => (
                    <div key={i} className={`finding-item ${getStatusClass(f.status)}`}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1rem' }}>
                        {f.reason}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.5' }}>
                        <strong>Recommendation:</strong> {f.recommendation}
                      </div>
                      {f.alternatives && f.alternatives.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'inherit', opacity: 0.7 }}>SAFER ALTERNATIVES:</span>
                          {f.alternatives.map((alt, idx) => (
                            <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.4)', color: 'inherit', border: '1px solid currentColor', fontWeight: 700 }}>
                              {alt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="finding-item status-safe">
                    No specific contraindications found for this combination. However, clinical judgment is advised.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

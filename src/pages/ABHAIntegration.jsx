import React, { useState } from 'react';
import { CreditCard, ShieldCheck, User, Search, Link as LinkIcon, CheckCircle, AlertCircle, QrCode, FileText, Info, ArrowRight, Activity, Share2, Globe } from 'lucide-react';
import './Pages.css';

export default function ABHAIntegration() {
  const [abhaId, setAbhaId] = useState('12341234123412');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);

  const DEMO_PATIENT = {
    name: "Rahul Sharma",
    age: 34,
    gender: "Male",
    phone: "XXXXXX8921",
    address: "New Delhi, India",
    abhaAddress: "rahul.sharma@abdm"
  };

  const verifyAbha = (e) => {
    e?.preventDefault();
    if (abhaId.length !== 14) {
      alert("Invalid ABHA ID. Must be 14 digits.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setPatient(DEMO_PATIENT);
      setStep(2);
      setLoading(false);
    }, 1500);
  };

  const linkPrescription = () => {
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">Digital Health Record (ABHA)</h1>
        <p className="page-subtitle">Standardized FHIR-based data interoperability with India's Ayushman Bharat Digital Mission.</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="abha-wizard-nav" style={{ marginBottom: '3rem', display: 'flex', gap: '1rem' }}>
          {[
            { id: 1, label: 'Identify Patient', icon: User },
            { id: 2, label: 'Authorize Sync', icon: Share2 },
            { id: 3, label: 'Link Confirmation', icon: CheckCircle },
          ].map(s => (
            <div key={s.id} className={`wizard-step ${step >= s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
               <div className="wizard-icon"><s.icon size={18} /></div>
               <span>{s.label}</span>
               {s.id < 3 && <div className="wizard-line" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card abha-verify-card animate-scale-in" style={{ padding: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
               <div className="abha-logo-box">
                  <Globe size={32} color="white" />
                  <div className="logo-pulse" />
               </div>
               <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Enter Patient ABHA ID</h2>
               <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Global 14-digit Ayushman Bharat Health Account</p>
            </div>

            <form onSubmit={verifyAbha} style={{ textAlign: 'center' }}>
              <div className="abha-id-group">
                <input 
                  type="text" 
                  className="abha-id-input"
                  placeholder="00-0000-0000-0000"
                  maxLength="14"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'center' }}>
                <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} style={{ padding: '0.8rem 3rem' }} disabled={loading}>
                  {loading ? 'Validating Registry...' : 'Lookup Identity'}
                </button>
                <button type="button" className="btn btn-outline">
                  <QrCode size={18} style={{marginRight: '8px'}}/> Scan QR
                </button>
              </div>
            </form>

            <div className="abha-info-box">
               <ShieldCheck size={18} />
               <p>Your connection to the ABDM HRP gateway is encrypted and HIPAA/PHR compliant.</p>
            </div>
          </div>
        )}

        {step === 2 && patient && (
          <div className="card identity-verification-card animate-slide-up">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
               <h3 className="card-title" style={{ margin: 0 }}>Clinical Identity Match Found</h3>
               <div className="verified-badge"><ShieldCheck size={14} /> REGISTERED IN ABDM</div>
            </div>

            <div className="patient-hero-summary">
               <div className="avatar-lg">{patient.name[0]}</div>
               <div className="hero-details">
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-id-tag">ADAM ADDRESS: {patient.abhaAddress}</div>
                  <div className="patient-stats-grid">
                     <div className="p-stat"><strong>{patient.age}</strong><span>Years Old</span></div>
                     <div className="p-stat"><strong>{patient.gender}</strong><span>Gender</span></div>
                     <div className="p-stat"><strong>{patient.phone}</strong><span>Mobile</span></div>
                  </div>
               </div>
            </div>

            <div className="sync-preview-section">
               <p className="sync-title">E-Prescription Node for Sync:</p>
               <div className="node-item premium">
                  <div className="node-icon"><Activity size={20} color="var(--primary-blue)" /></div>
                  <div className="node-info">
                     <div style={{ fontWeight: 700 }}>PRESCRIPTION_TX_#7821-C</div>
                     <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>3 FHIR MedicationRequest Assets • Timestamp: {new Date().toLocaleString()}</div>
                  </div>
                  <CheckCircle size={18} color="#10b981" />
               </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
               <button className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} style={{ flex: 1, height: '52px' }} onClick={linkPrescription} disabled={loading}>
                  {loading ? 'Encrypting & Shipping FHIR...' : (
                    <><LinkIcon size={18} style={{marginRight: '8px'}}/> Secure Sync to Health Locker</>
                  )}
               </button>
               <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>
                  Reject Identity Match
               </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card integration-success-card animate-scale-in">
             <div className="success-visual">
                <div className="confetti-burst" />
                <div className="success-check-circle">
                   <CheckCircle size={64} />
                </div>
             </div>
             <h2 className="success-title">Synchronized Successfully</h2>
             <p className="success-p">Clinical record <strong>#7821-C</strong> has been linked and encrypted within <strong>{patient.name}'s</strong> national health locker.</p>
             
             <div className="fhir-log-container">
                <div className="log-header">
                   <div className="log-dot" />
                   <span>FHIR HL7 INTEROPERABILITY PAYLOAD</span>
                   <button className="log-copy"><FileText size={12} /></button>
                </div>
                <pre className="fhir-json">
{`{
  "resourceType": "Bundle",
  "id": "SYNC-TOKEN-42981-XX",
  "type": "transaction",
  "entry": [
    { "fullUrl": "Patient/${abhaId}", "resource": { "id": "${abhaId}" } },
    { "fullUrl": "MedicationRequest/7821C", "status": "linked" }
  ]
}`}
                </pre>
             </div>

             <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '0.8rem 3rem' }} onClick={() => setStep(1)}>
                   New Link Transaction
                </button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        /* Wizard Nav Styles */
        .abha-wizard-nav { padding: 0 1rem; }
        .wizard-step { flex: 1; display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-weight: 700; font-size: 0.85rem; position: relative; }
        .wizard-step.active { color: var(--primary-blue); }
        .wizard-step.completed { color: #10b981; }
        .wizard-icon { width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        .wizard-step.active .wizard-icon { background: var(--primary-blue); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .wizard-step.completed .wizard-icon { background: #10b981; color: white; }
        .wizard-line { height: 2px; flex: 1; background: #e2e8f0; }
        .wizard-step.completed .wizard-line { background: #10b981; }

        /* Component Styles */
        .abha-logo-box { width: 72px; height: 72px; background: var(--primary-blue); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; position: relative; z-index: 1; }
        .logo-pulse { position: absolute; inset: -4px; background: var(--primary-blue); opacity: 0.2; border-radius: 24px; animation: pulse 2s infinite; z-index: -1; }
        
        .abha-id-group { margin: 0 auto; max-width: 480px; }
        .abha-id-input { width: 100%; border: none; background: #f8fafc; border-radius: 16px; padding: 1.5rem; font-size: 2.2rem; font-weight: 800; color: var(--text-primary); text-align: center; letter-spacing: 0.1em; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .abha-id-input:focus { outline: 2px solid var(--primary-blue); background: white; }

        .abha-info-box { margin-top: 3rem; display: flex; gap: 0.75rem; align-items: center; padding: 1rem 1.5rem; background: #f8fafc; border-radius: 12px; font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
        
        .patient-hero-summary { display: flex; gap: 2rem; align-items: center; padding: 2rem; background: #f8fafc; border-radius: 20px; border: 1.5px solid #f1f5f9; }
        .avatar-lg { width: 80px; height: 80px; border-radius: 50%; background: var(--primary-blue); color: white; font-size: 2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .patient-name { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
        .patient-id-tag { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-top: 0.25rem; }
        .patient-stats-grid { display: flex; gap: 2.5rem; margin-top: 1rem; }
        .p-stat { display: flex; flex-direction: column; }
        .p-stat strong { font-size: 1.1rem; color: var(--text-primary); }
        .p-stat span { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

        .sync-preview-section { margin-top: 2rem; }
        .sync-title { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1rem; padding-left: 0.5rem; }
        .node-item.premium { background: white; padding: 1.25rem; border-radius: 16px; border: 1.5px solid #f1f5f9; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .node-icon { width: 44px; height: 44px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; }

        /* Success & JSON */
        .fhir-log-container { margin-top: 3rem; background: #0f172a; border-radius: 16px; overflow: hidden; }
        .log-header { padding: 0.75rem 1.25rem; background: #1e293b; display: flex; align-items: center; gap: 0.75rem; font-size: 0.65rem; font-weight: 800; color: #94a3b8; }
        .log-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
        .log-copy { margin-left: auto; background: none; border: none; color: #94a3b8; cursor: pointer; }
        .fhir-json { padding: 1.5rem; color: #38bdf8; font-size: 0.85rem; line-height: 1.6; margin: 0; }

        @keyframes pulse {
           0% { transform: scale(1); opacity: 0.2; }
           50% { transform: scale(1.1); opacity: 0.1; }
           100% { transform: scale(1); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

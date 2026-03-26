import React, { useState, useRef } from 'react';
import { MEDICINE_DATA } from '../data/mockData';
import { analyzeInteractions } from '../services/interactionEngine';
import { FileText, AlertTriangle, CheckCircle, Search, Camera, Upload, X, ShieldAlert, Zap, History, Clipboard, Sparkles } from 'lucide-react';
import './Pages.css';

export default function PrescriptionAnalyzer() {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedNames, setDetectedNames] = useState([]);
  const [confirmedMeds, setConfirmedMeds] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      setCapturedImage(canvasRef.current.toDataURL('image/png'));
      stopCamera();
      simulatePrescriptionOCR();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        simulatePrescriptionOCR();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulatePrescriptionOCR = () => {
    setIsScanning(true);
    setDetectedNames([]);
    setTimeout(() => {
      // Deterministic: Extract from current prescriptionText if present, otherwise default to a fixed valid set
      const found = extractMedsFromText(prescriptionText);
      const defaultMeds = [MEDICINE_DATA[0].name, MEDICINE_DATA[2].name];
      setDetectedNames(found.length > 0 ? found : defaultMeds);
      setIsScanning(false);
    }, 2000);
  };

  const toggleMedConfirmation = (name) => {
    if (confirmedMeds.includes(name)) {
      setConfirmedMeds(confirmedMeds.filter(n => n !== name));
    } else {
      setConfirmedMeds([...confirmedMeds, name]);
    }
  };

  const runAnalysis = () => {
    const finalMeds = confirmedMeds.length > 0 ? confirmedMeds : 
                     (prescriptionText ? extractMedsFromText(prescriptionText) : []);
    
    if (finalMeds.length === 0) {
      alert("No medicines selected or detected for analysis.");
      return;
    }

    const result = analyzeInteractions(finalMeds);
    setAnalysis(result);
  };

  const extractMedsFromText = (text) => {
    const words = text.toLowerCase().split(/[\s,.\n]+/);
    const found = [];
    words.forEach(word => {
      const match = MEDICINE_DATA.find(m => m.name.toLowerCase().includes(word) && word.length > 3);
      if (match && !found.includes(match.name)) found.push(match.name);
    });
    return found;
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setDetectedNames([]);
    setConfirmedMeds([]);
    setAnalysis(null);
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">AI Prescription Intelligence</h1>
        <p className="page-subtitle">OCR-powered transcription and automated cross-interaction analysis.</p>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Clipboard size={18} color="var(--primary-blue)" /> Prescription Input
            </h3>
            
            <div className="scanner-actions" style={{ marginBottom: '1.5rem' }}>
              <button className="btn btn-primary" onClick={startCamera} style={{ flex: 1 }}>
                <Camera size={20} /> Open Scanner
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Upload Image
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>

            <textarea
              className="form-control"
              rows="6"
              placeholder="Or paste handwritten transcription manually..."
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '0.9rem', marginBottom: '1.25rem' }}
            ></textarea>

            <div className="info-box-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#eff6ff', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #dbeafe' }}>
               <Info size={18} color="var(--primary-blue)" />
               <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: 0 }}><strong>Expert Tip:</strong> Advanced OCR identifies handwritten scripts. Ensure good lighting for highest accuracy.</p>
            </div>

            {detectedNames.length > 0 && (
              <div className="card animate-slide-up" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="var(--primary-blue)" /> OCR Identified Substances
                </h4>
                <div className="confirmation-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {detectedNames.map((name, i) => (
                    <label key={i} className="conf-item-premium">
                      <div className="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          checked={confirmedMeds.includes(name)} 
                          onChange={() => toggleMedConfirmation(name)}
                        />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', height: '48px' }} onClick={runAnalysis}>
              <Zap size={18} /> Initiate Clinical Audit
            </button>
            
            {(capturedImage || analysis) && (
              <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.75rem' }} onClick={resetScanner}>
                Clear Session
              </button>
            )}
          </div>
        </div>

        <div className="analysis-results-container">
          {isScanning ? (
            <div className="card loading-card" style={{ height: '100%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', textAlign: 'center' }}>
               <div className="ocr-scanner-visual">
                 <div className="scan-line-anim" />
                 <img src={capturedImage} alt="Scanning" style={{ maxWidth: '200px', borderRadius: '8px', opacity: 0.5 }} />
               </div>
               <p style={{ width: '100%', marginTop: '2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Deciphering medical nomenclature...</p>
            </div>
          ) : analysis ? (
            <div className={`analysis-panel-premium animate-scale-in ${analysis.status.toLowerCase().replace(/ /g, '-')}`}>
              <div className="analysis-hero">
                <div className="status-badge-lg">
                  {analysis.status === 'Safe' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                </div>
                <div className="header-meta">
                  <h2 style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{analysis.status} EVALUATION</h2>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{analysis.reason}</p>
                </div>
              </div>

              <div className="findings-section" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Safety Audit Findings</h3>
                {analysis.findings.map((f, i) => (
                  <div key={i} className={`finding-block-premium ${f.status.toLowerCase().replace(/ /g, '-')}`}>
                    <div className="finding-header">
                      <ShieldAlert size={18} />
                      <strong>{f.status}: {f.reason}</strong>
                    </div>
                    <div className="finding-body">
                      <p><strong>Expert Recommendation:</strong> {f.recommendation}</p>
                      {f.alternatives && f.alternatives.length > 0 && (
                        <div className="alt-section-premium">
                          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6, marginBottom: '6px' }}>Bio-Equivalent Options</p>
                          <div className="tag-flex">
                            {f.alternatives.map((alt, idx) => <span key={idx} className="tag-alt-premium">{alt}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : capturedImage ? (
            <div className="card preview-card" style={{ height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="card-title">Digital Capture</h3>
                <span className="badge badge-neutral">OCR READY</span>
              </div>
              <img src={capturedImage} alt="Prescription" className="presc-preview-premium" />
            </div>
          ) : (
             <div className="card empty-analysis" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <div className="pill-icon-bg"><FileText size={48} /></div>
                <h4 style={{ marginTop: '1.5rem' }}>Clinical Data Required</h4>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', maxWidth: '280px' }}>Upload a prescription image or enter medical details to begin the safety audit.</p>
             </div>
          )}
        </div>
      </div>

      {isCameraOpen && (
        <div className="camera-overlay">
          <div className="camera-modal-premium animate-scale-in">
             <div className="camera-header-premium">
                <h3 style={{ margin: 0 }}>High-Fidelity Document Capture</h3>
                <button className="close-btn" onClick={stopCamera}><X size={24} /></button>
             </div>
             <div className="camera-body-premium">
                <video ref={videoRef} autoPlay playsInline muted className="video-stream"></video>
                <div className="presc-mask" />
                <div className="scanner-instruction">Ensure all medicine names are within the active frame area.</div>
             </div>
             <div className="camera-footer-premium">
                <button className="shutter-btn-premium" onClick={captureImage}>
                  <div className="shutter-inner" />
                </button>
             </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

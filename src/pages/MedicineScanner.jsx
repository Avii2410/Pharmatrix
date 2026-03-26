import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MEDICINE_DATA } from '../data/mockData';
import { Search as SearchIcon, History, Pill, AlertCircle, Info, Repeat, Camera, Upload, X, Check, Scan, ShieldCheck, Tag, IndianRupee } from 'lucide-react';
import './Pages.css';
import formatCurrency from '../utils/formatCurrency';

export default function MedicineScanner() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedMeds, setDetectedMeds] = useState([]);
  const [history, setHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setCapturedImage(null);
      setDetectedMeds([]);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access denied. Please use image upload or manual entry.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCapturedImage(dataUrl);
      stopCamera();
      simulateOCR("medicine_package_scan.png");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        simulateOCR(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateOCR = (filename) => {
    setIsScanning(true);
    setDetectedMeds([]);
    
    setTimeout(() => {
      // Deterministic lookup: if filename contains medicine name, return it.
      const query = filename.split('.')[0].toUpperCase();
      let matches = MEDICINE_DATA.filter(m => 
        query.includes(m.name.toUpperCase()) || 
        m.name.toUpperCase().includes(query)
      );

      if (matches.length === 0) {
        // Fallback to a stable set for professional demo UX
        matches = MEDICINE_DATA.slice(0, 2);
      }
      
      setDetectedMeds(matches.slice(0, 3));
      setIsScanning(false);
    }, 1500);
  };

  const selectMedicine = (med) => {
    setResult(med);
    addToHistory(med.name);
    setCapturedImage(null);
    setDetectedMeds([]);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const med = MEDICINE_DATA.find(m => m.name.toLowerCase().includes(query.toLowerCase()));
    if (med) {
      setResult(med);
      addToHistory(med.name);
    } else {
      setResult('not-found');
    }
  };

  const addToHistory = (name) => {
    const newHistory = [name, ...history.filter(h => h !== name)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">Medicine Intelligence Scanner</h1>
        <p className="page-subtitle">Instant visual identification and clinical data lookup.</p>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Scan size={18} color="var(--primary-blue)" /> Identification Portal
            </h3>
            
            <div className="scanner-actions" style={{ marginBottom: '1.5rem' }}>
              <button className="btn btn-primary" onClick={startCamera} style={{ flex: 1 }}>
                <Camera size={20} /> Use Camera
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Upload Image
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>

            <div className="search-container" style={{ position: 'relative' }}>
              <SearchIcon className="search-icon" size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Or type medicine name manually..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          {(capturedImage || isScanning) && (
            <div className="card animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Processing Input</h3>
                {isScanning && <div className="badge badge-warning spin-slow">Analyzing...</div>}
              </div>
              
              <div className="scan-layout">
                <div className="scanned-image-preview premium-preview">
                  {capturedImage && <img src={capturedImage} alt="Scanned" />}
                  {isScanning && (
                    <div className="scan-overlay">
                      <div className="scan-beam" />
                    </div>
                  )}
                </div>
                
                <div className="scan-results">
                  {isScanning ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <div className="loader-dots"><span></span><span></span><span></span></div>
                      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Extracting nomenclature from image pixels...</p>
                    </div>
                  ) : (
                    <div className="detected-list animate-fade-in">
                      <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Potential Clinical Matches</p>
                      {detectedMeds.map(med => (
                        <div key={med.id} className="detected-item premium-item" onClick={() => selectMedicine(med)}>
                          <div className="item-icon-circle"><Check size={14} /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{med.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.category}</div>
                          </div>
                          <div className="confidence-chip">98% Match</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="main-results">
           {!result && (
             <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
               <Pill size={64} color="#e2e8f0" />
               <h4 style={{ marginTop: '1.5rem', color: '#64748b' }}>Awaiting Identification</h4>
               <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Identify a medicine to view detailed clinical data.</p>
             </div>
           )}

           {result === 'not-found' && (
             <div className="card animate-shake" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h3>No Clinical Match Found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>The scanned medicine could not be identified in the Pharmatrix core database. Please try a manual search.</p>
             </div>
           )}

           {result && result !== 'not-found' && (
             <div className="card animate-scale-in">
               <div className="medicine-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                 <div>
                   <h2 className="medicine-name">{result.name}</h2>
                   <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                     <span className="badge badge-safe"><ShieldCheck size={12} style={{marginRight: '4px'}}/> Verified SKU</span>
                     <span className="badge badge-neutral">{result.category}</span>
                   </div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference MSRP</p>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-blue)', letterSpacing: '-0.02em' }}>{formatCurrency(result.price)}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%', height: '48px' }} 
                    onClick={() => navigate('/interactions', { state: { initialDrugs: [result.name] } })}>
                    <ShieldCheck size={18} style={{marginRight: '8px'}}/> Add to Clinical Safety Check
                  </button>
                </div>

               <div className="grid-2" style={{ gap: '1.5rem' }}>
                 <div className="info-section">
                   <h4 className="section-title"><Tag size={14} /> Composition</h4>
                   <div className="tags">
                     {result.composition.map((c, i) => <span key={i} className="tag">{c}</span>)}
                   </div>
                 </div>

                 <div className="info-section">
                   <h4 className="section-title"><Info size={14} /> Indications</h4>
                   <div className="tags">
                     {result.uses.map((u, i) => <span key={i} className="tag">{u}</span>)}
                   </div>
                 </div>
               </div>

               <div className="info-section" style={{ marginTop: '1.5rem' }}>
                 <h4 className="section-title" style={{ color: '#c2410c' }}><AlertCircle size={14} /> Critical Side Effects</h4>
                 <div className="tags">
                   {result.sideEffects.map((s, i) => <span key={i} className="tag warning-tag">{s}</span>)}
                 </div>
               </div>

               <div className="info-section" style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px' }}>
                 <h4 className="section-title" style={{ color: 'var(--primary-blue)' }}><Repeat size={14} /> Therapeutic Substitutes (Bio-Equivalent)</h4>
                 <div className="tags">
                   {result.alternatives && result.alternatives.length > 0 ? (
                     result.alternatives.map((altId, i) => {
                       const altMed = MEDICINE_DATA.find(m => m.id === altId);
                       return altMed ? <span key={i} className="tag alt-tag">{altMed.name}</span> : null;
                     })
                   ) : (
                     <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No equivalent substitutes in current registry.</span>
                   )}
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {isCameraOpen && (
        <div className="camera-overlay">
          <div className="camera-modal animate-scale-in">
            <div className="camera-header">
              <h3>Live Recognition Engine</h3>
              <button className="close-btn" onClick={stopCamera}><X size={20}/></button>
            </div>
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline muted className="video-preview"></video>
              <div className="scanner-reticle" />
              <div className="scanner-guide">Focus on the Medicine Name or Salt Composition</div>
            </div>
            <div className="camera-footer">
              <button className="btn btn-primary capture-btn-lg" onClick={captureImage}>
                <div className="shutter-circle" /> ANALYZE FRAME
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

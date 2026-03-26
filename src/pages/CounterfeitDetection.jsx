import React, { useState, useRef } from 'react';
import { COUNTERFEIT_DB, MEDICINE_DATA } from '../data/mockData';
import { ShieldCheck, ShieldAlert, Zap, Search, Camera, Upload, AlertTriangle, CheckCircle, Info, RefreshCw, BarChart, Binary, Cpu } from 'lucide-react';
import './Pages.css';

export default function CounterfeitDetection() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

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
      runModernScan("CAPTURED_SCAN");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        runModernScan(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const runModernScan = (inputSource) => {
    setIsScanning(true);
    setResult(null);

    // Simulate Deep-Learning molecular/batch pattern analysis
    setTimeout(() => {
      let finalResult = null;
      const cleanCode = code.trim().toUpperCase() || "DEMO-BATCH-X";
      const record = COUNTERFEIT_DB.find(r => r.batchNumber === cleanCode);

      if (record) {
        const expDate = new Date(record.expDate);
        const today = new Date();
        
        if (expDate < today) {
          finalResult = {
            status: 'Expired Batch',
            confidence: 100,
            message: `Batch ${record.batchNumber} is registered but expired on ${record.expDate}.`,
            manufacturer: record.manufacturer,
            medName: record.medicineName,
            color: 'status-warning'
          };
        } else if (record.status === 'Recalled') {
          finalResult = {
            status: 'Recalled Batch',
            confidence: 100,
            message: `Regulatory Alert: Batch ${record.batchNumber} has been recalled by ${record.manufacturer}.`,
            manufacturer: record.manufacturer,
            medName: record.medicineName,
            color: 'status-warning'
          };
        } else {
          finalResult = {
            status: 'Authentic',
            confidence: 99.8,
            message: `Verified Authentic. Batch ${record.batchNumber} matches official manufacturer records.`,
            manufacturer: record.manufacturer,
            medName: record.medicineName,
            color: 'status-safe'
          };
        }
      } else if (cleanCode.includes('FAKE') || cleanCode.includes('SUS')) {
        finalResult = {
          status: 'Suspicious Batch',
          confidence: 85,
          message: 'Warning! Label anomalies and batch ID mismatch detected. Security hologram failed.',
          manufacturer: 'Unknown',
          medName: 'Potential Counterfeit',
          color: 'status-avoid'
        };
      } else if (cleanCode.length > 5) {
        finalResult = {
          status: 'Needs Manual Verification',
          confidence: 60,
          message: 'Batch ID not found in global registry. Please contact manufacturer for SKU verification.',
          manufacturer: 'Unverified',
          medName: 'Unknown Item',
          color: 'status-warning'
        };
      } else {
        finalResult = {
          status: 'Suspicious Batch',
          confidence: 92,
          message: 'Critical mismatch: Packaging security features (hologram/QR) failed verification.',
          manufacturer: 'Unknown',
          medName: 'Illegal Substitute',
          color: 'status-avoid'
        };
      }

      setResult(finalResult);
      setIsScanning(false);
    }, 3000);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Authentic': return <ShieldCheck size={32} />;
      case 'Expired Batch': return <AlertTriangle size={32} />;
      case 'Recalled Batch': return <ShieldAlert size={32} />;
      case 'Needs Manual Verification': return <Info size={32} />;
      case 'Suspicious Batch': return <ShieldAlert size={32} />;
      default: return <ShieldAlert size={32} />;
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">Identity & Integrity Audit</h1>
        <p className="page-subtitle">Multi-layered verification system for medicine batch authenticity and recall monitoring.</p>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Binary size={18} color="var(--primary-blue)" /> Product Verification
            </h3>
            
            <div className="scanner-actions" style={{ marginBottom: '1.5rem' }}>
              <button className="btn btn-primary" onClick={startCamera} style={{ flex: 1 }}>
                <Camera size={20} /> Field Scanner
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Upload Image
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Batch ID / Tracking Serial</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. BATCH123-X99" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && runModernScan("MANUAL")}
                />
                <button className="btn btn-primary" onClick={() => runModernScan("MANUAL")}>Verify SKU</button>
              </div>
            </div>

            <div className="info-box-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fef3c7', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #fde68a' }}>
               <ShieldAlert size={18} color="#d97706" />
               <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0 }}><strong>Security Protocol:</strong> Batch IDs are cross-referenced with the Global Manufacturer Registry including the CDSCO database.</p>
            </div>
          </div>

          <div className="card">
             <h3 className="card-title"><BarChart size={18} color="var(--primary-blue)" /> Global Recall Network</h3>
             <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Connected Nodes</span>
                   <span style={{ fontWeight: 700 }}>2,840</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Last Sync</span>
                   <span style={{ fontWeight: 700 }}>12s ago</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Active Alerts</span>
                   <span style={{ fontWeight: 700, color: '#ef4444' }}>14 Local</span>
                </div>
             </div>
          </div>
        </div>

        <div className="analysis-results-container">
           {isScanning ? (
             <div className="card loading-card-premium" style={{ height: '100%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div className="dna-loader">
                   <div className="dna-strand" />
                   <div className="dna-strand" />
                </div>
                <h3 style={{ width: '100%', marginTop: '3rem' }}>Pharmatrix Neural Audit</h3>
                <p style={{ width: '100%', color: 'var(--text-muted)', maxWidth: '300px', margin: '1rem auto 0' }}>Analyzing molecular fingerprint consistency and batch hash alignment...</p>
                <div style={{ width: '240px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginTop: '2rem' }}>
                   <div className="dna-progress" />
                </div>
             </div>
           ) : result ? (
             <div className={`analysis-panel-premium animate-scale-in ${result.color}`}>
                <div className="analysis-hero">
                   <div className="status-badge-lg">
                      {getStatusIcon(result.status)}
                   </div>
                   <div className="header-meta">
                      <h2 style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{result.status}</h2>
                      <div className="confidence-label">System Confidence Index: {result.confidence}%</div>
                   </div>
                </div>

                <div className="findings-section" style={{ padding: '1.5rem' }}>
                   <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{result.message}</p>
                   </div>

                   <div className="metadata-grid-premium" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="meta-card">
                         <span className="meta-label">Clinical Identifier</span>
                         <div className="meta-value">{result.medName}</div>
                      </div>
                      <div className="meta-card">
                         <span className="meta-label">Origin Record</span>
                         <div className="meta-value">{result.manufacturer}</div>
                      </div>
                   </div>

                   {result.status === 'Authentic' ? (
                     <div className="safety-action-card safe animate-pulse">
                        <ShieldCheck size={20} />
                        <div style={{ fontWeight: 700 }}>Integrity Verified</div>
                        <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>Product matches pharmaceutical specifications for safe dispensing.</p>
                     </div>
                   ) : (
                     <div className="safety-action-card hazard animate-shake">
                        <ShieldAlert size={20} />
                        <div style={{ fontWeight: 700 }}>Integrity Breach</div>
                        <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>DO NOT dispense or consume this unit. Immediate quarantine required.</p>
                     </div>
                   )}
                </div>
             </div>
           ) : capturedImage ? (
             <div className="card preview-card-premium" style={{ height: '100%', overflow: 'hidden' }}>
                <div className="preview-header">
                   <h3 className="card-title">Visual Profile</h3>
                   <div className="badge badge-warning">AWAITING AUDIT</div>
                </div>
                <div className="preview-body">
                   <img src={capturedImage} alt="Captured" />
                </div>
             </div>
           ) : (
             <div className="card empty-analysis-premium" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <div className="icon-stack">
                   <Cpu size={48} />
                   <RefreshCw size={24} className="spin-slow" />
                </div>
                <h4 style={{ marginTop: '2rem' }}>Integrity Engine Idle</h4>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', maxWidth: '280px' }}>Initiate a scan or enter a batch code to verify pharmaceutical authenticity.</p>
             </div>
           )}
        </div>
      </div>

      {isCameraOpen && (
        <div className="camera-overlay">
          <div className="camera-modal-premium animate-scale-in">
             <div className="camera-header-premium">
                <h3 style={{ margin: 0 }}>Field Integrity Capture</h3>
                <button className="close-btn" onClick={stopCamera}><X size={24} /></button>
             </div>
             <div className="camera-body-premium">
                <video ref={videoRef} autoPlay playsInline muted className="video-stream"></video>
                <div className="scanner-overlay-square" />
                <div className="scanner-instruction-bottom">Align Batch Label or Pill Geometry within the square</div>
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

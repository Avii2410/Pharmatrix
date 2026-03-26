import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ 
          margin: '2rem auto', 
          maxWidth: '600px', 
          textAlign: 'center', 
          padding: '3rem',
          border: '2px solid #ef4444',
          backgroundColor: '#fef2f2'
        }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Component Failed to Load</h2>
          <p style={{ color: '#991b1b', marginBottom: '2rem' }}>
            We encountered a technical error while rendering this module.
          </p>
          <div style={{ 
            textAlign: 'left', 
            background: '#fee2e2', 
            padding: '1rem', 
            borderRadius: '8px', 
            fontSize: '0.8rem', 
            fontFamily: 'monospace', 
            color: '#b91c1c',
            marginBottom: '2rem',
            overflowX: 'auto'
          }}>
            {this.state.error?.toString()}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
          >
            <RefreshCw size={18} /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

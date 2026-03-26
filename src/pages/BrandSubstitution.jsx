import React, { useState } from 'react';
import { MEDICINE_DATA } from '../data/mockData';
import { Repeat, ArrowRight, IndianRupee, Search } from 'lucide-react';
import './Pages.css';
import formatCurrency from '../utils/formatCurrency';

export default function BrandSubstitution() {
  const [query, setQuery] = useState('');
  const [originalMed, setOriginalMed] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const med = MEDICINE_DATA.find(m => m.name.toLowerCase().includes(query.toLowerCase()));
    
    if (med) {
      setOriginalMed(med);
      const alts = med.alternatives.map(altId => MEDICINE_DATA.find(m => m.id === altId)).filter(Boolean);
      setAlternatives(alts);
    } else {
      setOriginalMed(null);
      setAlternatives([]);
    }
  };

  return (
    <div className="page-animate">
      <h1 className="page-title">Brand Substitution</h1>
      <p className="page-subtitle">Find cheaper or equivalent generic alternatives.</p>

      <form className="search-container" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={24} />
          <input 
            type="text" 
            className="search-input"
            placeholder="Enter prescribed medicine (e.g. Dolo 650, Omeprazole)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary search-btn">
          Find Alternatives
        </button>
      </form>

      {originalMed && (
        <div className="grid-2">
          <div className="card" style={{ borderTop: '4px solid var(--primary-blue)' }}>
            <h2 className="card-title">Original Prescription</h2>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {originalMed.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}><strong>Composition:</strong> {originalMed.composition.join(', ')}</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}><strong>Uses:</strong> {originalMed.uses.join(', ')}</p>
              <p style={{ color: '#991b1b', marginTop: '0.25rem', fontSize: '0.9rem' }}><strong>Side Effects:</strong> {originalMed.sideEffects.join(', ')}</p>
              <div style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Price: {formatCurrency(originalMed.price)}
              </div>
            </div>
            <div>
              <span className="badge badge-neutral">{originalMed.category}</span>
            </div>
          </div>

          <div className="card" style={{ borderTop: '4px solid var(--secondary-teal)' }}>
            <h2 className="card-title"><Repeat size={20} /> Best Substitutes</h2>
            
            {alternatives.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No direct substitutes found in database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alternatives.map(alt => {
                  const savings = originalMed.price - alt.price;
                  const isCheaper = savings > 0;

                  return (
                    <div key={alt.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{alt.name}</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}><strong>Composition:</strong> {alt.composition.join(', ')}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}><strong>Uses:</strong> {alt.uses.join(', ')}</p>
                        <p style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.25rem' }}><strong>Side Effects:</strong> {alt.sideEffects.join(', ')}</p>
                        <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{alt.category}</span>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', marginRight: '1rem' }}>
                            {formatCurrency(alt.price)}
                          </span>
                          {isCheaper && (
                            <span className="badge badge-safe">
                              Save {formatCurrency(savings)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, ExternalLink, Archive } from 'lucide-react';
import './Pages.css';

export default function SalesReturn() {
  const [invoices, setInvoices] = useState([]);
  const [returnQuery, setReturnQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnReason, setReturnReason] = useState('sealed'); // sealed, damaged

  useEffect(() => {
    const saved = localStorage.getItem('invoices');
    if (saved) {
      // Sort by newest first
      const sorted = JSON.parse(saved).reverse();
      setInvoices(sorted);
    }
  }, []);

  const handleSearch = () => {
    const found = invoices.find(inv => inv.id === returnQuery);
    if (found) {
      setSelectedInvoice(found);
    } else {
      alert("Invoice not found.");
      setSelectedInvoice(null);
    }
  };

  const processReturn = (item) => {
    const invData = JSON.parse(localStorage.getItem('local_inventory') || '[]');
    let updatedInv = [...invData];
    
    const targetIdx = updatedInv.findIndex(inv => inv.id === item.id);
    if (targetIdx !== -1) {
      if (returnReason === 'sealed') {
        const unitsToAdd = item.sellType === 'loose' ? item.quantity : item.quantity * updatedInv[targetIdx].unitsPerStrip;
        updatedInv[targetIdx].totalUnits += unitsToAdd;
        updatedInv[targetIdx].strips = Math.floor(updatedInv[targetIdx].totalUnits / updatedInv[targetIdx].unitsPerStrip);
        updatedInv[targetIdx].looseUnits = updatedInv[targetIdx].totalUnits % updatedInv[targetIdx].unitsPerStrip;
        localStorage.setItem('local_inventory', JSON.stringify(updatedInv));
        alert('Item restocked to main inventory successfully! Credit note generated.');
      } else {
        // Damaged/opened -> quarantine
        const quarantine = JSON.parse(localStorage.getItem('quarantine_stock') || '[]');
        quarantine.push({ ...item, returnDate: new Date().toISOString() });
        localStorage.setItem('quarantine_stock', JSON.stringify(quarantine));
        alert('Item moved to quarantine stock. Credit note generated.');
      }
    }
    
    // Update Return History
    const returns = JSON.parse(localStorage.getItem('return_history') || '[]');
    returns.push({
      invoiceId: selectedInvoice.id,
      itemName: item.name,
      quantity: item.quantity,
      sellType: item.sellType,
      reason: returnReason,
      date: new Date().toISOString()
    });
    localStorage.setItem('return_history', JSON.stringify(returns));
    
    // Minimal mock UX: clear selection
    setSelectedInvoice(null);
    setReturnQuery('');
  };

  return (
    <div className="page-animate">
      <h1 className="page-title">Sales Return System</h1>
      <p className="page-subtitle">Process returns, restock inventory, or quarantine damaged items.</p>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Initiate Return</h2>
          <div className="search-input-wrapper" style={{ marginBottom: '1rem' }}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Enter Invoice ID (e.g. INV16...)"
              value={returnQuery}
              onChange={(e) => setReturnQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>Find Invoice</button>

          {selectedInvoice && (
            <div style={{ marginTop: '2rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              <h3>Invoice: {selectedInvoice.id}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{new Date(selectedInvoice.date).toLocaleString()}</p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Condition of Return</label>
                <select className="form-control" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                  <option value="sealed">Sealed / Intact (Restock directly)</option>
                  <option value="damaged">Opened / Damaged (Move to Quarantine)</option>
                </select>
              </div>

              <h4>Items in Invoice</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedInvoice.items.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #eaeaea', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Qty: {item.quantity} ({item.sellType})</div>
                    </div>
                    <button className="btn outline" onClick={() => processReturn(item)} title="Process Return" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                      <RefreshCcw size={14} style={{ marginRight: '0.3rem' }} /> Return
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card" style={{ background: '#f8fafc' }}>
          <h2 className="card-title"><Archive size={20} /> Recent Invoices</h2>
          {invoices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No recent bills generated.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {invoices.slice(0, 10).map((inv, idx) => (
                <li key={idx} style={{ padding: '0.8rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '6px', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{inv.id}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(inv.date).toLocaleDateString()} • {inv.items.length} items</div>
                  </div>
                  <button className="btn outline" onClick={() => { setReturnQuery(inv.id); handleSearch(); }} style={{ border: 'none', color: '#0ea5e9' }}>
                    <ExternalLink size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

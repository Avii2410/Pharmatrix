import React, { useState } from 'react';
import { getInventory, addPurchase, getMedicineMaster } from '../services/dataManager';
import { ShoppingCart, Search, Plus, Trash2, CheckCircle, Package, Truck, Calendar } from 'lucide-react';
import './Pages.css';
import formatCurrency from '../utils/formatCurrency';

export default function PurchaseManagement() {
  const [supplier, setSupplier] = useState('');
  const [invoice, setInvoice] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [items, setItems] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const masterList = getMedicineMaster();

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setSearchResults([]); return; }
    const res = masterList.filter(m => m.name.toLowerCase().includes(val.toLowerCase()));
    setSearchResults(res.slice(0, 5));
  };

  const addItem = (med) => {
    if (items.find(i => i.id === med.id)) return;
    setItems([...items, { ...med, quantity: 1, purchasePrice: Math.round(med.price * 0.7) }]);
    setQuery('');
    setSearchResults([]);
  };

  const updateItem = (id, field, val) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const total = items.reduce((s, i) => s + (i.quantity * i.purchasePrice), 0);

  const handleSave = () => {
    if (!supplier || !invoice || items.length === 0) {
      alert("Please fill supplier, invoice, and add at least one item.");
      return;
    }

    addPurchase({
      supplier,
      invoiceNumber: invoice,
      items,
      totalAmount: total,
      date: new Date().toISOString()
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setItems([]);
      setSupplier('');
      setInvoice('');
    }, 3000);
  };

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Procurement & Purchases</h1>
          <p className="page-subtitle">Log incoming stock and manage supplier invoices.</p>
        </div>
        {showSuccess && <div className="badge badge-safe" style={{ padding: '0.8rem 1.2rem', fontSize: '1rem' }}><CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Purchase Recorded! Inventory updated.</div>}
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title"><Package size={20} /> Order Information</h2>
          <div className="form-group">
            <label className="form-label">Supplier Name</label>
            <div className="search-input-wrapper">
              <Truck className="search-icon" size={18} />
              <input type="text" className="form-control" style={{ paddingLeft: '2.5rem' }} placeholder="Select or type supplier..." value={supplier} onChange={e => setSupplier(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Number</label>
            <input type="text" className="form-control" placeholder="E.g. INV-2024-001" value={invoice} onChange={e => setInvoice(e.target.value)} />
          </div>

          <hr style={{ margin: '2rem 0', opacity: 0.1 }} />

          <h3 className="card-title" style={{ fontSize: '1rem' }}>Search Medicines</h3>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input type="text" className="form-control" style={{ paddingLeft: '2.5rem' }} placeholder="Search from master database..." value={query} onChange={handleSearch} />
          </div>

          {searchResults.length > 0 && (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '0.5rem' }}>
              {searchResults.map(res => (
                <div key={res.id} onClick={() => addItem(res)} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{res.name}</span>
                  <span className="badge" style={{ background: '#f1f5f9' }}>{res.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title"><ShoppingCart size={20} /> Purchase Items</h2>
          <div style={{ minHeight: '300px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', marginBottom: '1.5rem', background: '#f8fafc' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '5rem' }}>Add medicines from the left panel to begin.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.8rem' }}>Medicine</th>
                    <th style={{ padding: '0.8rem' }}>Qty (Strips)</th>
                    <th style={{ padding: '0.8rem' }}>Unit Price (₹)</th>
                    <th style={{ padding: '0.8rem' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '0.8rem' }}>
                        <input type="number" className="form-control" style={{ width: '70px', padding: '0.3rem' }} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        <input type="number" className="form-control" style={{ width: '90px', padding: '0.3rem' }} value={item.purchasePrice} onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)} />
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.quantity * item.purchasePrice)}</td>
                      <td>
                        <button onClick={() => removeItem(item.id)} style={{ color: 'var(--status-avoid)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 800 }}>
              <span>Total Investment</span>
              <span style={{ color: 'var(--primary-blue)' }}>{formatCurrency(total)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem' }} disabled={items.length === 0} onClick={handleSave}>
              Save Purchase & Refill Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getInventory, updateInventory, addSale, addAlert } from '../services/dataManager';
import { Receipt, Search, Plus, Trash2, Printer, CheckCircle, History, IndianRupee } from 'lucide-react';
import './Pages.css';
import formatCurrency from '../utils/formatCurrency';

export default function BillingSystem() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [billDiscount, setBillDiscount] = useState({ type: 'none', value: 0 }); // type: 'none' | 'flat' | 'percent'
  const [showSuccess, setShowSuccess] = useState(false);
  const [inventory, setInventory] = useState(() => getInventory());

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Unknown User"}');

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const results = inventory.filter(m => m.name.toLowerCase().includes(val.toLowerCase()) && m.totalUnits > 0);
    setSearchResults(results);
  };

  const addToCart = (med, sellType = 'strip') => {
    const existing = cart.find(item => item.id === med.id && item.sellType === sellType);
    
    // Check if enough stock exists for one more item
    const currentUnitsInCart = cart.filter(i => i.id === med.id).reduce((s, i) => s + (i.sellType==='loose'?i.quantity : i.quantity*med.unitsPerStrip), 0);
    const unitsToAdd = sellType === 'strip' ? med.unitsPerStrip : 1;
    
    if (currentUnitsInCart + unitsToAdd > med.totalUnits) {
      alert(`Insufficient stock for ${med.name}! Only ${med.totalUnits - currentUnitsInCart} units remaining.`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => item.id === med.id && item.sellType === sellType 
        ? {...item, quantity: item.quantity + 1} 
        : item));
    } else {
      setCart([...cart, { 
        ...med, 
        quantity: 1, 
        sellType, 
        basePrice: sellType === 'strip' ? med.pricePerStrip : med.pricePerUnit,
        discountRate: 0 // item-wise percentage
      }]);
    }
    setQuery('');
    setSearchResults([]);
  };

  const updateQty = (id, sellType, delta) => {
    setCart(cart.map(item => {
      if (item.id === id && item.sellType === sellType) {
        const med = inventory.find(m => m.id === id);
        const unitsPer = sellType === 'strip' ? med.unitsPerStrip : 1;
        const currentUnitsInCartExceptThis = cart.filter(i => i.id === id && i.sellType !== sellType).reduce((s, i) => s + (i.sellType==='loose'?i.quantity : i.quantity*med.unitsPerStrip), 0);
        
        const newQty = item.quantity + delta;
        if (newQty > 0) {
          if ((newQty * unitsPer) + currentUnitsInCartExceptThis > med.totalUnits) {
             alert(`Insufficient stock for ${med.name}! Only ${med.totalUnits} total units in inventory.`);
             return item;
          }
          return {...item, quantity: newQty};
        }
      }
      return item;
    }));
  };

  const updateItemDiscount = (id, sellType, val) => {
    setCart(cart.map(item => {
      if (item.id === id && item.sellType === sellType) {
        return {...item, discountRate: Number(val)};
      }
      return item;
    }));
  };

  const removeItem = (id, sellType) => {
    setCart(cart.filter(item => !(item.id === id && item.sellType === sellType)));
  };

  const subtotal = cart.reduce((sum, item) => {
    const priceAfterDiscount = item.basePrice * (1 - item.discountRate / 100);
    return sum + (priceAfterDiscount * item.quantity);
  }, 0);

  let finalDiscountAmount = 0;
  if (billDiscount.type === 'flat') {
    finalDiscountAmount = billDiscount.value;
  } else if (billDiscount.type === 'percent') {
    finalDiscountAmount = subtotal * (billDiscount.value / 100);
  }

  const tax = (subtotal - finalDiscountAmount) * 0.05; // 5% mock tax
  const total = Math.max(0, subtotal - finalDiscountAmount + tax);

  const handleCheckout = () => {
    // 1. Update Inventory using dataManager
    let newInventory = [...inventory];
    cart.forEach(item => {
      const idx = newInventory.findIndex(inv => inv.id === item.id);
      if (idx !== -1) {
        let currentInv = {...newInventory[idx]};
        const unitsToDeduct = item.sellType === 'loose' ? item.quantity : item.quantity * currentInv.unitsPerStrip;
        
        currentInv.totalUnits -= unitsToDeduct;
        currentInv.strips = Math.floor(currentInv.totalUnits / currentInv.unitsPerStrip);
        currentInv.looseUnits = currentInv.totalUnits % currentInv.unitsPerStrip;
        newInventory[idx] = currentInv;
      }
    });

    // 2. Add Sale record for Analytics using dataManager
    addSale({
        customer: "Walk-in Customer",
        totalAmount: total,
        medicineNames: cart.map(i => i.name),
        quantity: cart.reduce((s, i) => s + i.quantity, 0),
        status: "Completed",
        branchId: "b1" // Default for now
    });

    // 3. Update global inventory state
    updateInventory(newInventory);
    setInventory(newInventory);

    // 4. Audit Log for High Discounts
    const hasDiscount = finalDiscountAmount > (subtotal * 0.2) || cart.some(i => i.discountRate > 20);
    if (hasDiscount) {
      addAlert({
        type: 'warning',
        message: `High Discount Applied: ${currentUser.name} gave ${formatCurrency(finalDiscountAmount)} off on Bill #${Date.now().toString().slice(-6)}`,
        channels: ['Email']
      });
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setBillDiscount({ type: 'none', value: 0 });
    }, 3000);
  };

  return (
    <div className="page-animate">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 className="page-title">Billing System</h1>
          <p className="page-subtitle">Fast POS, dual-unit sales & discount tracking.</p>
        </div>
        {showSuccess && <div className="badge badge-safe" style={{padding: '0.8rem 1.2rem', fontSize: '1rem'}}><CheckCircle size={18} style={{marginRight: '0.5rem'}}/> Payment Successful! Inventory updated.</div>}
      </div>

      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title">Add Items</h2>
            <div className="search-input-wrapper" style={{ marginBottom: '1rem' }}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search medicine (shows stock availability)..."
                value={query}
                onChange={handleSearch}
              />
            </div>
            
            {searchResults.length > 0 && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map(res => (
                  <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{res.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Stock: {res.strips} strips, {res.looseUnits} loose ({res.totalUnits} total)
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => addToCart(res, 'strip')} title="Sell Full Strip" style={{ fontSize: '0.8rem', padding: '0.4rem' }}>
                        + Strip ({formatCurrency(res.pricePerStrip)})
                      </button>
                      <button className="btn outline" onClick={() => addToCart(res, 'loose')} title="Sell Loose Units" style={{ fontSize: '0.8rem', padding: '0.4rem', borderColor: 'var(--text-secondary)' }}>
                        + Loose ({formatCurrency(res.pricePerUnit)})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title"><Receipt size={20} /> Current Invoice</h2>
          
          <div style={{ flex: 1, minHeight: '300px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No items in cart.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Item</th>
                    <th style={{ padding: '0.5rem' }}>Type</th>
                    <th style={{ padding: '0.5rem' }}>Qty</th>
                    <th style={{ padding: '0.5rem' }}>Disc(%)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '0.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => {
                    const priceExt = item.basePrice * item.quantity;
                    const priceAfterDisc = priceExt * (1 - item.discountRate / 100);
                    return (
                      <tr key={`${item.id}-${item.sellType}-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{item.sellType}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <button onClick={() => updateQty(item.id, item.sellType, -1)} style={{ padding: '0.1rem 0.4rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.sellType, 1)} style={{ padding: '0.1rem 0.4rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input type="number" min="0" max="100" value={item.discountRate} onChange={(e) => updateItemDiscount(item.id, item.sellType, e.target.value)} style={{ width: '50px', padding: '0.2rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(priceAfterDisc)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          <button onClick={() => removeItem(item.id, item.sellType)} style={{ color: 'var(--status-avoid)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontWeight: 600 }}>Bill Discount:</span>
            <select className="form-control" style={{ width: 'auto' }} value={billDiscount.type} onChange={(e) => setBillDiscount({...billDiscount, type: e.target.value, value: 0})}>
              <option value="none">None</option>
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
            {billDiscount.type !== 'none' && (
              <input type="number" min="0" className="form-control" style={{ width: '80px' }} placeholder="Value" value={billDiscount.value} onChange={(e) => setBillDiscount({...billDiscount, value: Number(e.target.value)})} />
            )}
          </div>

          <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {finalDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--status-avoid)' }}>
                <span>Bill Discount</span>
                <span>- {formatCurrency(finalDiscountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <span>Tax (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={cart.length === 0} onClick={handleCheckout}>
              <Printer size={20} /> Checkout & Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

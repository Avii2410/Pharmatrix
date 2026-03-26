import { getInventory, updateInventory } from '../services/dataManager';
import { Box, AlertTriangle, Info, TrendingUp, TrendingDown, IndianRupee, Edit, Plus, Minus, CreditCard, ShoppingCart } from 'lucide-react';
import './Pages.css';
import formatCurrency from '../utils/formatCurrency';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState(() => getInventory());
  const [filter, setFilter] = useState('all'); // all, low_stock, expiring
  const [editingId, setEditingId] = useState(null);

  // Sync with global storage changes
  useEffect(() => {
    const handleStorage = () => setInventory(getInventory());
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const adjustStock = (id, delta) => {
    const newInv = [...inventory];
    const idx = newInv.findIndex(i => i.id === id);
    if (idx !== -1) {
      newInv[idx].totalUnits = Math.max(0, newInv[idx].totalUnits + delta);
      newInv[idx].strips = Math.floor(newInv[idx].totalUnits / newInv[idx].unitsPerStrip);
      newInv[idx].looseUnits = newInv[idx].totalUnits % newInv[idx].unitsPerStrip;
      updateInventory(newInv);
      setInventory(newInv);
    }
  };

  const updateThreshold = (id, val) => {
    const newInv = [...inventory];
    const idx = newInv.findIndex(i => i.id === id);
    if (idx !== -1) {
      newInv[idx].lowStockThreshold = Number(val);
      updateInventory(newInv);
      setInventory(newInv);
    }
  };

  const getFilteredInventory = () => {
    let list = [...inventory];
    if (filter === 'low_stock') {
      list = list.filter(m => m.totalUnits <= m.lowStockThreshold);
    } else if (filter === 'expiring') {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      list = list.filter(m => new Date(m.expiryDate) < sixMonthsFromNow);
    }
    return list;
  };

  const filtered = getFilteredInventory();

  return (
    <div className="page-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Inventory Registry</h1>
          <p className="page-subtitle">Deterministic stock tracking with real-time sync.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }} onClick={() => window.location.href = '/purchase'}>
            <ShoppingCart size={16} style={{marginRight: '0.5rem'}} /> New Procurement
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
        <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All Stock</button>
        <button className={`btn ${filter === 'low_stock' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('low_stock')}>
          <TrendingDown size={16} style={{marginRight: '0.4rem'}} /> Low Stock
        </button>
        <button className={`btn ${filter === 'expiring' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('expiring')}>
          <AlertTriangle size={16} style={{marginRight: '0.4rem'}} /> Expiring
        </button>
      </div>

      <div className="card">
        <h2 className="card-title"><Box size={20} /> Stock Management</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem 0.75rem' }}>SKU Name</th>
                <th style={{ padding: '1rem 0.75rem' }}>Units / Control</th>
                <th style={{ padding: '1rem 0.75rem' }}>Batch Status</th>
                <th style={{ padding: '1rem 0.75rem' }}>Expiry</th>
                <th style={{ padding: '1rem 0.75rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isLow = item.totalUnits <= item.lowStockThreshold;
                const isEditing = editingId === item.id;
                
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: isEditing ? '#f8fafc' : 'transparent' }}>
                    <td style={{ padding: '1.2rem 0.75rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>UP: {formatCurrency(item.pricePerUnit)}</div>
                    </td>
                    <td style={{ padding: '1.2rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.totalUnits}</div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => adjustStock(item.id, -1)} className="btn outline" style={{ padding: '0.2rem', minWidth: '24px' }}><Minus size={12}/></button>
                          <button onClick={() => adjustStock(item.id, 1)} className="btn outline" style={{ padding: '0.2rem', minWidth: '24px' }}><Plus size={12}/></button>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Threshold: </span>
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ display: 'inline', width: '60px', padding: '0.1rem 0.4rem', fontSize: '0.8rem' }}
                            value={item.lowStockThreshold}
                            onChange={(e) => updateThreshold(item.id, e.target.value)}
                          />
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.lowStockThreshold}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1.2rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}>{item.strips} Stp</span>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}>{item.looseUnits} Unt</span>
                        </div>
                        {isLow ? <span className="badge badge-avoid" style={{ fontSize: '0.65rem' }}>Critical Stock</span> : <span className="badge badge-safe" style={{ fontSize: '0.65rem' }}>Healthy</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1.2rem 0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(item.expiryDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Batch #B721-X</div>
                    </td>
                    <td style={{ padding: '1.2rem 0.75rem' }}>
                      <button className="btn outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEditingId(isEditing ? null : item.id)}>
                        {isEditing ? 'Save' : <><Edit size={14} style={{marginRight: '0.4rem'}}/> Edit</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

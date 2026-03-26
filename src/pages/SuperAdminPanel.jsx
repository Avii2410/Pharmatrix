import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, Activity, Building, Smartphone, Mail, MessageSquare, Phone, 
  TrendingUp, IndianRupee, Clock, BarChart2, Filter, Download,
  UserX, AlertCircle, FileText, CheckCircle, Target, ArrowRight, Zap
} from 'lucide-react';
import './Pages.css';
import formatCurrency from '../utils/formatCurrency';

// ─── Helpers & Formatting ─────────────────────────────────────────────────────
const fmt = n => Number(n || 0).toLocaleString('en-IN');
const fmtCur = n => formatCurrency(Math.round(n), { decimals: 0 });
const fmtK = n => formatCurrency(n, { short: true });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Date-range helpers ──────────────────────────────────────────────────────
const DATE_RANGES = [
  { key:'7d',   label:'Last 7 Days',   days:7   },
  { key:'30d',  label:'Last 30 Days',  days:30  },
  { key:'90d',  label:'Last 90 Days',  days:90  },
  { key:'6m',   label:'Last 6 Months', days:180 },
  { key:'1y',   label:'Last 1 Year',   days:365 },
];

function getCutoff(rangeKey) {
  const r = DATE_RANGES.find(x => x.key === rangeKey) || DATE_RANGES[1];
  const d = new Date();
  d.setDate(d.getDate() - r.days);
  return d;
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────
function arrayToCSV(rows, cols) {
  const header = cols.map(c => `"${c.label}"`).join(',');
  const body   = rows.map(r => cols.map(c => {
    const v = r[c.key] ?? '';
    return `"${String(v).replace(/"/g, '""')}"`;
  }).join(','));
  return [header, ...body].join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── SVG Charting Components ──────────────────────────────────────────────────
function ChartTooltip({ tip, containerW }) {
  if (!tip) return null;
  const left = clamp(tip.x + 14, 0, (containerW || 600) - 160);
  const top  = tip.y - 50;
  return (
    <div style={{ position: 'absolute', background: 'rgba(15,23,42,0.98)', color: 'white', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', pointerEvents: 'none', zIndex: 100, left, top, boxShadow: '0 10px 25px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {tip.title && <div style={{ fontWeight: 800, marginBottom: '0.4rem', borderBottom: '1.5px solid rgba(255,255,255,0.15)', paddingBottom: '0.4rem', color: '#60a5fa' }}>{tip.title}</div>}
      {tip.rows?.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {r.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot, boxShadow: `0 0 6px ${r.dot}` }}/>}
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{r.label}</span>
          </div>
          <span style={{ fontWeight: 800 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, xKey, yKey, color = '#3b82f6', label = 'Value', height = 220 }) {
  const cRef = useRef(null);
  const [tip, setTip] = useState(null);
  if (!data?.length) return null;
  
  const VW=700, VH=height, PL=60, PR=20, PT=20, PB=30;
  const plotW = VW-PL-PR, plotH = VH-PT-PB;
  const vals  = data.map(d => Number(d[yKey]));
  const maxV  = Math.max(...vals, 1);
  const minV  = Math.min(...vals, 0);
  const range = maxV - minV;
  
  const toX = i => PL + (data.length>1 ? (i/(data.length-1))*plotW : plotW/2);
  const toY = v => PT + plotH - ((v - minV)/(range||1))*plotH;
  
  const pts = data.map((d,i) => ({ x: toX(i), y: toY(d[yKey]), d }));
  const line = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x},${PT+plotH} L${PL},${PT+plotH} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: minV + f*range, y: PT+plotH - f*plotH }));

  return (
    <div ref={cRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {yTicks.map(t => (
          <g key={t.y}>
            <line x1={PL} x2={VW-PR} y1={t.y} y2={t.y} stroke="#e2e8f0" strokeDasharray="4 2"/>
            <text x={PL-8} y={t.y+4} textAnchor="end" fontSize="11" fontWeight="700" fill="#475569">{t.v > 1000 ? fmtK(t.v) : fmt(Math.round(t.v))}</text>
          </g>
        ))}
        {pts.map((p,i) => {
          if (data.length > 15 && i % Math.ceil(data.length/8) !== 0 && i !== data.length-1) return null;
          return <text key={i} x={p.x} y={VH-8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">{p.d[xKey]}</text>
        })}
        <path d={area} fill={`url(#grad-${color.replace('#','')})`} pointerEvents="none"/>
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/>
        {pts.map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r={12} fill="transparent"
            onMouseMove={e => {
              const r = cRef.current.getBoundingClientRect();
              setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title: p.d[xKey], rows: [{ dot: color, label, value: fmt(p.d[yKey]) }] });
            }}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </svg>
      <ChartTooltip tip={tip} containerW={VW} />
    </div>
  );
}

function HBarChart({ data, labelKey, valueKey, maxRows=10, color='#3b82f6', isCurrency=false }) {
  if (!data?.length) return null;
  const rows = data.slice(0, maxRows);
  const max  = Math.max(...rows.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      {rows.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 800, color: '#1e293b' }} title={d[labelKey]}>{d[labelKey]}</div>
            <div style={{ flex: 1, height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
            </div>
            <div style={{ width: '70px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isCurrency ? fmtK(d[valueKey]) : fmt(d[valueKey])}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ slices, center, sub }) {
  const total = slices.reduce((s,x) => s+x.value, 0);
  const R=40, CX=50, CY=50, IR=24;
  let cum=0;
  const paths = Object.values(slices).map(sl => {
    const pct = sl.value/(total||1);
    const a0 = cum*2*Math.PI - Math.PI/2;
    const a1 = (cum+pct)*2*Math.PI - Math.PI/2;
    cum += pct;
    const x1=CX+R*Math.cos(a0), y1=CY+R*Math.sin(a0);
    const x2=CX+R*Math.cos(a1), y2=CY+R*Math.sin(a1);
    const d = `M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${pct>.5?1:0} 1 ${x2} ${y2}Z`;
    return { ...sl, d, pct: Math.round(pct*100) };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2"/>)}
          <circle cx={CX} cy={CY} r={IR} fill="white"/>
          <text x={CX} y={CY-2} textAnchor="middle" fontSize="12" fontWeight="900" fill="#0f172a">{center}</text>
          <text x={CX} y={CY+8} textAnchor="middle" fontSize="6" fontWeight="800" fill="#475569">{sub}</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {paths.map((p,i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{p.label} ({p.pct}%)</span>
            </div>
            <span style={{ fontWeight: 600 }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortTable({ cols, rows, maxRows=8 }) {
  const [sortCol, setSortCol] = useState(cols[0]?.key);
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const c = cols.find(c => c.key===sortCol);
    return [...rows].sort((a,b) => {
      const av = c?.num ? Number(a[sortCol]) : String(a[sortCol]||'');
      const bv = c?.num ? Number(b[sortCol]) : String(b[sortCol]||'');
      return sortDir==='asc' ? (av>bv?1:-1) : (av<bv?1:-1);
    });
  }, [rows, sortCol, sortDir, cols]);

  const paged = sorted.slice(page*maxRows, (page+1)*maxRows);
  const pages = Math.ceil(sorted.length / maxRows);

  const sort = key => {
    if (sortCol === key) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortCol(key); setSortDir('desc'); }
    setPage(0);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
            {cols.map(c => (
              <th key={c.key} style={{ padding: '0.8rem 0.5rem', cursor: 'pointer', userSelect: 'none' }} onClick={() => sort(c.key)}>
                {c.label} {sortCol===c.key ? (sortDir==='asc'?'↑':'↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map((r,i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {cols.map(c => <td key={c.key} style={{ padding: '0.8rem 0.5rem' }}>{c.render ? c.render(r[c.key], r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0.5rem 0', fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>
          <span>Showing {page*maxRows + 1} to {Math.min((page+1)*maxRows, sorted.length)} of {sorted.length}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>Prev</button>
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={()=>setPage(p=>Math.min(pages-1,p+1))} disabled={page===pages-1}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, val, sub, trend, bg='#fff', color='var(--primary-blue)' }) {
  const IconCmp = icon;
  return (
    <div style={{ background: bg, border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '0.5rem', background: `${color}15`, color, borderRadius: '8px' }}><IconCmp size={18} /></div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600, color: trend >= 0 ? '#059669' : '#dc2626', background: trend >= 0 ? '#ecfdf5' : '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>{val}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginTop: '0.2rem' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Mock Data Generators ─────────────────────────────────────────────────────
const generateTrend = (days, base, volatility) => Array.from({length: days}, (_, i) => {
  const date = new Date(); date.setDate(date.getDate() - (days - i - 1));
  return { date: date.toLocaleDateString('en-US',{month:'short',day:'numeric'}), value: Math.round(base + (Math.random() * volatility * 2 - volatility)) };
});

const KPI = {
  totalUsers: 48201, activeToday: 2145, wau: 18400, mau: 29481,
  newSignups: 412, paidSubs: 8542, trial: 3120, expired: 1844,
  churned: 210, inactive: 4200, mrr: 128450, arr: 1541400, renewalsDue: 340
};

const REV_TREND = generateTrend(30, 4200, 800);
const LOGIN_TREND = generateTrend(14, 2100, 300);

const AUDIT_TRAIL = [
  { id: 'a1', date: new Date(Date.now() - 600000).toISOString(), user: 'Admin User', role: 'Admin', org: 'Apollo Medical', action: 'Created Bill', details: 'INV-8910 (₹14,240)' },
  { id: 'a2', date: new Date(Date.now() - 1500000).toISOString(), user: 'John Doe', role: 'Pharmacist', org: 'Sudhir Medical', action: 'Applied Discount', details: '15% off on bill' },
  { id: 'a3', date: new Date(Date.now() - 3600000).toISOString(), user: 'Sarah Smith', role: 'Patient', org: '-', action: 'Subscription Renewed', details: 'Premium Plan (₹840)' },
  { id: 'a4', date: new Date(Date.now() - 7200000).toISOString(), user: 'Karan Medicals', role: 'Pharmacist', org: 'Bhilai Medical', action: 'Updated Inventory', details: 'Restocked 50 units (ALMOX)' },
  { id: 'a5', date: new Date(Date.now() - 10800000).toISOString(), user: 'Admin User', role: 'Admin', org: 'Apollo Medical', action: 'Processed Return', details: 'INV-8802 (Damaged)' },
  { id: 'a6', date: new Date(Date.now() - 18000000).toISOString(), user: 'Jane Patient', role: 'Patient', org: '-', action: 'Cancelled Plan', details: 'Reason: Too expensive' },
  { id: 'a7', date: new Date(Date.now() - 86400000).toISOString(), user: 'System', role: 'System', org: 'Multiple', action: 'Account Inactivated', details: '45 accounts marked 30-day inactive' },
  { id: 'a8', date: new Date(Date.now() - 90000000).toISOString(), user: 'City Care', role: 'Pharmacist', org: 'City Care Medical', action: 'Created Bill', details: 'INV-8799 (₹8,110)' },
];

const CHURN_RISK = [
  { account: 'Global Hospitals', daysInactive: 28, plan: 'Enterprise', mrr: 450, risk: 'High' },
  { account: 'Manoj Medicals', daysInactive: 15, plan: 'Professional', mrr: 89, risk: 'Medium' },
  { account: 'City Pharmacy #2', daysInactive: 22, plan: 'Basic', mrr: 29, risk: 'Medium' },
  { account: 'Dr. Reddy Clinic', daysInactive: 45, plan: 'Professional', mrr: 89, risk: 'Critical' }
];

const FEATURES = [
  { name: 'Billing POS', users: 8400, calls: 45000, adoption: 98, fails: 12 },
  { name: 'Inventory Sync', users: 7100, calls: 32000, adoption: 83, fails: 45 },
  { name: 'Interaction Checker', users: 2400, calls: 8900, adoption: 28, fails: 0 },
  { name: 'Return Processing', users: 1800, calls: 2100, adoption: 21, fails: 5 },
  { name: 'ADR Reporting', users: 300, calls: 450, adoption: 4, fails: 2 }
];

const ORGS = [
  { name: 'Apollo Medical (HQ)', type: 'Hospital', users: 45, rev: 1200, status: 'Active' },
  { name: 'Sudhir Medical', type: 'Pharmacy', users: 8, rev: 89, status: 'Active' },
  { name: 'Bhilai Branch #3', type: 'Pharmacy', users: 5, rev: 89, status: 'Declining' },
  { name: 'Sunrise Clinic', type: 'Clinic', users: 2, rev: 29, status: 'Inactive (20d)' },
  { name: 'City Care Medical', type: 'Pharmacy', users: 12, rev: 150, status: 'Active' }
];

const TABS = [
  { id: 'exec', label: 'Executive KPI', icon: Activity },
  { id: 'rev', label: 'Revenue & Go-To-Market', icon: IndianRupee },
  { id: 'users', label: 'User Activity & Login', icon: Users },
  { id: 'audit', label: 'Audit Trail', icon: FileText },
  { id: 'churn', label: 'Churn & Inactivity', icon: UserX },
  { id: 'feat', label: 'Feature & Org Analytics', icon: Target },
  { id: 'funnel', label: 'Lifecycle Funnel', icon: Filter },
];

export default function SuperAdminPanel() {
  const [tab, setTab] = useState('exec');
  const [dateRange, setDateRange] = useState('30d');
  const [remindersSent, setRemindersSent] = useState(false);
  const [exporting, setExporting] = useState(null); // null | 'progress' | 'done'

  // ── Pre-compute filtered datasets ──
  const filteredRevTrend = useMemo(() => {
    const r = DATE_RANGES.find(x => x.key === dateRange) || DATE_RANGES[1];
    return generateTrend(r.days, 4200, 800);
  }, [dateRange]);

  const filteredAudit = useMemo(() => {
    const cutoff = getCutoff(dateRange);
    return AUDIT_TRAIL.filter(a => new Date(a.date) >= cutoff).map(a => ({
      ...a,
      time: new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(a.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }, [dateRange]);

  // Dynamic KPI scaling based on range
  const dynamicKPI = useMemo(() => {
    const r = DATE_RANGES.find(x => x.key === dateRange) || DATE_RANGES[1];
    const factor = r.days / 30;
    return {
      ...KPI,
      newSignups: Math.round(KPI.newSignups * factor),
      churned: Math.round(KPI.churned * factor)
    };
  }, [dateRange]);

  const rangeLabel = DATE_RANGES.find(r=>r.key===dateRange)?.label.replace(/\s+/g,'') || 'Period';

  const triggerExport = (type) => {
    setExporting('progress');
    setTimeout(() => {
      let csv = '';
      let filename = '';
      if (type === 'rev') {
        csv = arrayToCSV(filteredRevTrend, [
          { key: 'date', label: 'Date' },
          { key: 'value', label: 'Revenue (₹)' }
        ]);
        filename = `Pharmatrix_RevenueReport_${rangeLabel}.csv`;
      } else if (type === 'audit') {
        csv = arrayToCSV(filteredAudit, [
          { key: 'time', label: 'Timestamp' },
          { key: 'user', label: 'User' },
          { key: 'role', label: 'Role' },
          { key: 'org', label: 'Organization' },
          { key: 'action', label: 'Action' },
          { key: 'details', label: 'Details' }
        ]);
        filename = `Pharmatrix_AuditLog_${rangeLabel}.csv`;
      } else if (type === 'orgs') {
        csv = arrayToCSV(ORGS, [
          { key: 'name', label: 'Organization' },
          { key: 'type', label: 'Type' },
          { key: 'users', label: 'User Count' },
          { key: 'rev', label: 'Monthly Revenue (₹)' },
          { key: 'status', label: 'Status' }
        ]);
        filename = `Pharmatrix_OrganizationInventory_${rangeLabel}.csv`;
      } else if (type === 'kpi') {
        const kpiRows = [
          { metric: 'Total Users', value: KPI.totalUsers },
          { metric: 'Monthly Active Users', value: KPI.mau },
          { metric: 'Monthly Recurring Revenue', value: KPI.mrr },
          { metric: 'Annual Recurring Revenue', value: KPI.arr },
          { metric: 'New Signups (Period)', value: dynamicKPI.newSignups },
          { metric: 'Churned Users (Period)', value: dynamicKPI.churned }
        ];
        csv = arrayToCSV(kpiRows, [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }]);
        filename = `Pharmatrix_ExecutiveKPI_${rangeLabel}.csv`;
      }
      downloadCSV(csv, filename);
      setExporting('done');
      setTimeout(() => setExporting(null), 2500);
    }, 800);
  };

  const tClass = id => `an-tab ${tab === id ? 'active' : ''}`;

  return (
    <div className="page-animate" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ── Header & Action Center ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Pharmatrix Super Admin</h1>
          <p className="page-subtitle">Real-time SaaS operational intelligence, audit logs, and risk monitoring.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'white', padding: '0.3rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          {DATE_RANGES.map(r => (
            <button key={r.key} 
              onClick={() => setDateRange(r.key)}
              style={{ 
                padding: '0.3rem 0.6rem', border: '1px solid', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                background: dateRange === r.key ? 'var(--primary-blue)' : 'transparent',
                color: dateRange === r.key ? 'white' : '#64748b',
                borderColor: dateRange === r.key ? 'var(--primary-blue)' : '#e2e8f0',
                transition: 'all 0.15s'
              }}>
              {r.label}
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.5rem' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {exporting === 'progress' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="spin" style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--primary-blue)', borderTopColor: 'transparent', display: 'inline-block' }} />
                Exporting...
              </span>
            )}
            {exporting === 'done' && (
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>✓ CSV Ready</span>
            )}
            <select 
              className="form-control" 
              onChange={e => { if(e.target.value) triggerExport(e.target.value); e.target.value=''; }}
              defaultValue=""
              style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.82rem', fontWeight: 600, background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', appearance: 'none' }}>
              <option value="" disabled>⬇ Export Report</option>
              <option value="kpi">Executive KPI Report</option>
              <option value="rev">Revenue Detail Report</option>
              <option value="audit">Platform Audit Log</option>
              <option value="orgs">Organization Analytics</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="an-tabs" style={{ marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {TABS.map(t => (
          <button key={t.id} className={tClass(t.id)} onClick={() => setTab(t.id)}>
            <t.icon size={15}/> {t.label}
          </button>
        ))}
      </div>

      {/* ── 1. Executive KPI Overview ── */}
      {tab === 'exec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard icon={Users} label="Total Registered Users" val={fmt(dynamicKPI.totalUsers)} trend={5.2} color="#3b82f6" />
            <StatCard icon={Activity} label="Active Users Today" val={fmt(dynamicKPI.activeToday)} trend={12.4} color="#10b981" />
            <StatCard icon={Activity} label="Monthly Active Users" val={fmt(dynamicKPI.mau)} trend={2.1} color="#0ea5e9" />
            <StatCard icon={UserX} label="System Inactive Users" val={fmt(dynamicKPI.inactive)} trend={-1.5} color="#dc2626" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard icon={IndianRupee} label="Monthly Recurring Rev (MRR)" val={fmtCur(dynamicKPI.mrr)} trend={8.7} color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={IndianRupee} label="Annual Recurring Rev (ARR)" val={fmtCur(dynamicKPI.arr)} trend={4.2} color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={CheckCircle} label="Paid Subscriptions" val={fmt(dynamicKPI.paidSubs)} trend={3.2} color="#8b5cf6" />
            <StatCard icon={Clock} label="Renewals Due (< 7 days)" val={dynamicKPI.renewalsDue} color="#eab308" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard icon={Target} label="New Signups (Period)" val={dynamicKPI.newSignups} trend={15} color="#14b8a6" />
            <StatCard icon={Smartphone} label="Trial Users" val={fmt(dynamicKPI.trial)} color="#6366f1" />
            <StatCard icon={AlertCircle} label="Expired Subscriptions" val={fmt(dynamicKPI.expired)} trend={-5} color="#f43f5e" />
            <StatCard icon={TrendingUp} label="Churned Users" val={dynamicKPI.churned} trend={1.2} color="#ef4444" />
          </div>
        </div>
      )}

      {/* ── 2. Revenue & Go-To-Market ── */}
      {tab === 'rev' && (
        <div className="grid-2">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="card-title"><TrendingUp size={18}/> Platform Revenue Trend (MRR)</h2>
            <div style={{ height: '300px', marginTop: '1.5rem' }}>
              <LineChart data={filteredRevTrend} xKey="date" yKey="value" color="#10b981" label="Revenue (₹)" height={300} />
            </div>
          </div>
          <div className="card">
            <h2 className="card-title"><BarChart2 size={18}/> Revenue by Plan Setup</h2>
            <div style={{ marginTop: '2rem' }}>
              <DonutChart center={fmtCur(KPI.mrr)} sub="Total MRR" slices={[
                { label: 'Enterprise (₹34,500/m)', value: 85000, color: '#6366f1' },
                { label: 'Professional (₹8,500/m)', value: 34000, color: '#0ea5e9' },
                { label: 'Basic (₹2,400/m)', value: 9450, color: '#f59e0b' }
              ]} />
            </div>
          </div>
          <div className="card">
            <h2 className="card-title"><IndianRupee size={18}/> Financial Health Metrics</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1.5px solid #e2e8f0' }}>
                <span style={{ color: '#4b5563', fontWeight: 600 }}>Average Revenue Per Account (ARPA)</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>₹8,450</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1.5px solid #e2e8f0' }}>
                <span style={{ color: '#4b5563', fontWeight: 600 }}>Renewal Revenue Captured</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>₹3,42,100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1.5px solid #e2e8f0' }}>
                <span style={{ color: '#4b5563', fontWeight: 600 }}>Failed Payments / Retry State</span>
                <span style={{ fontWeight: 800, color: '#dc2626' }}>₹84,840 (24 accounts)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem' }}>
                <span style={{ color: '#4b5563', fontWeight: 600 }}>Processed Refunds</span>
                <span style={{ fontWeight: 800, color: '#dc2626' }}>₹12,450</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. User Activity & Login ── */}
      {tab === 'users' && (
        <div className="grid-2">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="card-title"><Users size={18}/> Daily Login Trends</h2>
            <div style={{ height: '250px', marginTop: '1.5rem' }}>
              <LineChart data={LOGIN_TREND} xKey="date" yKey="value" color="#8b5cf6" label="Unique Logins" height={250} />
            </div>
          </div>
          <div className="card">
            <h2 className="card-title"><Activity size={18}/> Role-wise Active Users</h2>
            <div style={{ marginTop: '2rem' }}>
              <DonutChart center={fmt(KPI.mau)} sub="Total MAU" slices={[
                { label: 'Patients', value: 21400, color: '#10b981' },
                { label: 'Pharmacists', value: 6800, color: '#0ea5e9' },
                { label: 'Admins/Owners', value: 1281, color: '#6366f1' }
              ]} />
            </div>
          </div>
          <div className="card">
            <h2 className="card-title"><Zap size={18}/> Engagement Metrics</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              <div><span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 700 }}>Avg Logins per User (Weekly)</span><div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>4.2 sessions</div></div>
              <hr style={{ border: 0, borderTop: '1.5px solid #e2e8f0' }} />
              <div><span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 700 }}>New User Onboarding Completion</span><div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '4px' }}><div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px' }}><div style={{ width: '82%', height: '100%', background: '#0d9488', borderRadius: '4px' }}/></div><span style={{ fontWeight: 800, color: '#0d9488' }}>82%</span></div></div>
              <hr style={{ border: 0, borderTop: '1.5px solid #e2e8f0' }} />
              <div><span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 700 }}>Avg Session Duration</span><div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>18m 45s</div></div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Audit Trail ── */}
      {tab === 'audit' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}><FileText size={18}/> Platform Universal Audit Trail</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="form-control" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}>
                <option>All Modules</option>
                <option>Billing & Returns</option>
                <option>Subscription & Auth</option>
                <option>Inventory</option>
              </select>
              <select className="form-control" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}>
                <option>All Roles</option>
                <option>Admin</option>
                <option>Pharmacist</option>
                <option>Patient</option>
              </select>
            </div>
          </div>
            <SortTable cols={[
            { key: 'time', label: 'Timestamp' },
            { key: 'user', label: 'User / Actor' },
            { key: 'role', label: 'Role', render: v => <span style={{ padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem' }}>{v}</span> },
            { key: 'org', label: 'Organization' },
            { key: 'action', label: 'Action Taken', render: v => <strong style={{ color: 'var(--primary-blue)' }}>{v}</strong> },
            { key: 'details', label: 'Details / Metadata' },
          ]} rows={filteredAudit} maxRows={10} />
        </div>
      )}

      {/* ── 5. Churn & Inactivity ── */}
      {tab === 'churn' && (
        <div className="grid-2">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="card-title"><UserX size={18}/> Inactivity & Churn Risk Radar</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Monitor organizations and users showing signs of declining engagement.</p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>2,840</div><div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase' }}>Inactive &gt; 7 Days</div>
              </div>
              <div style={{ flex: 1, background: '#fffbeb', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1.5px solid #fef3c7' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#92400e' }}>980</div><div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Inactive &gt; 15 Days</div>
              </div>
              <div style={{ flex: 1, background: '#fef2f2', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1.5px solid #fecaca' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#991b1b' }}>380</div><div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Inactive &gt; 30 Days</div>
              </div>
            </div>
            
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>High-Value Accounts at Risk</h3>
            <SortTable cols={[
              { key: 'account', label: 'Organization / Account' },
              { key: 'plan', label: 'Plan Prefix' },
              { key: 'mrr', label: 'MRR At Risk', num: true, render: v => <strong style={{ color: '#dc2626' }}>{fmtCur(v)}</strong> },
              { key: 'daysInactive', label: 'Days Inactive', num: true },
              { key: 'risk', label: 'Risk Level', render: v => <span className={`badge ${v==='Critical'?'badge-avoid':v==='High'?'badge-warning':'badge-neutral'}`}>{v}</span> }
            ]} rows={CHURN_RISK} maxRows={5} />
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', borderLeft: '4px solid var(--primary-blue)' }}>
             <h2 className="card-title"><MessageSquare size={18}/> Retention & Quick Action Center</h2>
             <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Trigger automated re-engagement workflows manually for the segments above.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: '10px' }}><Mail size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e293b' }}>Email Re-engagement</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Send automated "We Miss You" sequence to &gt;15 days cohort</div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ minWidth: '180px' }} onClick={() => { setRemindersSent(true); setTimeout(()=>setRemindersSent(false), 3000); }}>
                  {remindersSent ? 'Batch Dispatched ✓' : 'Dispatch Email Batch'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ color: '#0ea5e9' }}><Smartphone size={18} /></div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>SMS Blast</span>
                  </div>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Send SMS</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ color: '#10b981' }}><MessageSquare size={18} /></div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>WhatsApp Support</span>
                  </div>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Connect</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ color: '#6366f1' }}><Phone size={18} /></div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Follow-up Call</span>
                  </div>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Assign Task</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Feature & Org ── */}
      {tab === 'feat' && (
        <div className="grid-2">
          <div className="card">
            <h2 className="card-title"><Target size={18}/> Feature Usage & Adoption</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <HBarChart data={FEATURES} labelKey="name" valueKey="calls" maxRows={6} color="#0ea5e9" />
            </div>
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.8rem', color: '#4b5563', textTransform: 'uppercase' }}>Feature Adoption & Failure Rates</h3>
              <SortTable cols={[
                { key: 'name', label: 'Feature' },
                { key: 'adoption', label: 'Adoption', render: v => `${v}%` },
                { key: 'fails', label: 'Error Count', render: v => <span style={{ color: v > 10 ? '#dc2626' : '#059669' }}>{v}</span> }
              ]} rows={FEATURES} maxRows={5} />
            </div>
          </div>

          <div className="card">
            <h2 className="card-title"><Building size={18}/> Organization Analytics</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>Pharmacies Onboarded</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>1,204</div>
              </div>
              <div style={{ flex: 1, padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>Hospitals Onboarded</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>340</div>
              </div>
            </div>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: '#64748b' }}>Top vs Underperforming Orgs</h3>
            <SortTable cols={[
              { key: 'name', label: 'Organization' },
              { key: 'type', label: 'Type' },
              { key: 'rev', label: 'MRR', num: true, render: v => fmtCur(v) },
              { key: 'status', label: 'System Status', render: v => <span className={`badge ${v==='Active'?'badge-safe':v==='Declining'?'badge-warning':'badge-avoid'}`}>{v}</span> }
            ]} rows={ORGS} maxRows={5} />
          </div>
        </div>
      )}

      {/* ── 7. Funnel ── */}
      {tab === 'funnel' && (
        <div className="card">
          <h2 className="card-title"><Filter size={18}/> Customer Lifecycle & Conversion Funnel</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem' }}>Identify drop-offs from initial App Download to Subscription Renewal.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto', gap: '0.5rem' }}>
            {[
              { stage: 'App Downloads (Top of Funnel)', val: 115000, drop: '-', color: '#6366f1', w: '100%' },
              { stage: 'Successful Signups', val: 48201, drop: '58% drop-off', color: '#3b82f6', w: '85%' },
              { stage: 'Onboarding Completed', val: 39500, drop: '18% drop-off', color: '#0ea5e9', w: '70%' },
              { stage: 'First Feature Use (Active)', val: 29481, drop: '25% drop-off', color: '#14b8a6', w: '55%' },
              { stage: 'Paid Subscription Conversion', val: 8542, drop: '71% drop-off', color: '#10b981', w: '40%' },
              { stage: 'Successful Renewals', val: 7800, drop: '8% churn', color: '#059669', w: '30%' },
            ].map((f, i) => (
              <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: f.w, background: f.color, padding: '1rem', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'width 0.3s' }}>
                  <span style={{ fontWeight: 500 }}>{f.stage}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{fmt(f.val)}</span>
                </div>
                {i < 5 && (
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ArrowRight size={12} style={{ transform: 'rotate(90deg)' }} /> {f.drop}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

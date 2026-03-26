import React, { useState, useMemo, useRef } from 'react';
import {
  getSales, getInventory, getAlerts, getMedicineMaster
} from '../services/dataManager';
import {
  ANALYTICS_INVENTORY, ANALYTICS_SALES, ANALYTICS_PURCHASES,
  ANALYTICS_EXPIRY, ANALYTICS_SEASONAL, MEDICINE_DATA
} from '../data/mockData';
import {
  TrendingUp, Package, ShoppingCart, AlertTriangle, Clock,
  DollarSign, ArrowUp, ArrowDown, Activity, BarChart2,
  Calendar, Zap, CheckCircle, XCircle, AlertCircle, Layers, RefreshCw, Users, RefreshCcw, Percent, Building
} from 'lucide-react';
import './Analytics.css';
import formatCurrency from '../utils/formatCurrency';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = n => Number(n || 0).toLocaleString('en-IN');
const fmtCur = n => formatCurrency(Math.round(n), { decimals: 0 });
const fmtK   = n => formatCurrency(n, { short: true });
const groupBy = (arr, key) =>
  arr.reduce((acc, x) => { (acc[x[key]] = acc[x[key]] || []).push(x); return acc; }, {});
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ChartTooltip({ tip, containerW }) {
  if (!tip) return null;
  const left = clamp(tip.x + 14, 0, (containerW || 500) - 170);
  const top  = tip.y - 50;
  return (
    <div className="ct-box" style={{ left, top }}>
      {tip.title && <div className="ct-title">{tip.title}</div>}
      {tip.rows?.map((r, i) => (
        <div key={i} className="ct-row">
          {r.dot && <span className="ct-dot" style={{ background: r.dot }}/>}
          <span className="ct-label">{r.label}</span>
          <span className="ct-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function LineChart({ data, xKey, yKey, color = '#6366f1', label = 'Revenue' }) {
  const containerRef = useRef(null);
  const svgRef       = useRef(null);
  const [tip, setTip]     = useState(null);
  const [activeIdx, setAI] = useState(null);

  if (!data?.length) return null;
  const VW=620, VH=220, PL=52, PR=16, PT=16, PB=28;
  const plotW = VW-PL-PR, plotH = VH-PT-PB;
  const vals  = data.map(d => d[yKey]);
  const maxV  = Math.max(...vals, 1);
  const toX   = i => PL + (data.length>1 ? (i/(data.length-1))*plotW : plotW/2);
  const toY   = v => PT + plotH - (v/maxV)*plotH;
  const pts   = data.map((d,i) => ({ x: toX(i), y: toY(d[yKey]), d }));
  const line  = pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area  = `${line} L${pts[pts.length-1].x},${PT+plotH} L${PL},${PT+plotH} Z`;
  const yTicks = [0,0.25,0.5,0.75,1].map(f => ({ v: Math.round(f*maxV), y: PT+plotH - f*plotH }));

  const onMove = (e) => {
    if (!svgRef.current || !containerRef.current) return;
    const sr = svgRef.current.getBoundingClientRect();
    const cr = containerRef.current.getBoundingClientRect();
    const rx = (e.clientX - sr.left) / sr.width * VW;
    let ni=0, md=Infinity;
    pts.forEach((p,i) => { const d=Math.abs(p.x-rx); if(d<md){md=d;ni=i;} });
    setAI(ni);
    setTip({
      x: e.clientX - cr.left,
      y: e.clientY - cr.top,
      title: data[ni][xKey],
      rows: [{ dot: color, label, value: fmtCur(data[ni][yKey]) }]
    });
  };

  return (
    <div ref={containerRef} className="chart-outer">
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`la-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {yTicks.map(t => (
          <g key={t.y}>
            <line x1={PL} x2={VW-PR} y1={t.y} y2={t.y} stroke="#f1f5f9" strokeWidth="1"/>
            <text x={PL-5} y={t.y+4} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="Inter">{fmtK(t.v)}</text>
          </g>
        ))}
        {pts.map((p,i) => (
          <text key={i} x={p.x} y={VH-6} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter">{data[i][xKey]}</text>
        ))}
        {activeIdx !== null && (
          <line x1={pts[activeIdx].x} y1={PT} x2={pts[activeIdx].x} y2={PT+plotH}
            stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
        )}
        <path d={area} fill={`url(#la-${color.replace('#','')})`}/>
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={activeIdx===i?5.5:3.5}
          fill={activeIdx===i?color:'white'} stroke={color} strokeWidth="2" style={{transition:'r 0.1s'}}/>)}
        <rect x={PL} y={PT} width={plotW} height={plotH} fill="transparent"
          onMouseMove={onMove} onMouseLeave={() => { setTip(null); setAI(null); }}/>
      </svg>
      <ChartTooltip tip={tip} containerW={VW} />
    </div>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────
function HBarChart({ data, labelKey, valueKey, maxRows=10, fmtVal, showRanking=false, extraTooltipInfo }) {
  const containerRef = useRef(null);
  const [tip, setTip] = useState(null);
  if (!data?.length) return null;
  const rows = data.slice(0, maxRows);
  const max  = Math.max(...rows.map(d => d[valueKey]), 1);
  const COLS = ['#6366f1','#0ea5e9','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#10b981','#f97316','#06b6d4','#84cc16'];
  const formatV = fmtVal || (v => v > 999 ? fmtCur(v) : fmt(v));

  return (
    <div ref={containerRef} className="hbar-outer">
      {rows.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const col = COLS[i % COLS.length];
        return (
          <div key={i} className="hbar-row"
            onMouseMove={e => {
              const r = containerRef.current.getBoundingClientRect();
              setTip({ x: e.clientX-r.left, y: e.clientY-r.top,
                title: d[labelKey],
                rows: extraTooltipInfo ? extraTooltipInfo(d) : [{ dot: col, label: 'Value', value: formatV(d[valueKey]) }]
              });
            }}
            onMouseLeave={() => setTip(null)}>
            <div className="hbar-label" title={d[labelKey]}>
              {showRanking && <span style={{ marginRight: '0.5rem', fontWeight: 900, opacity: 0.3 }}>#{i+1}</span>}
              {d[labelKey]}
            </div>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width:`${pct}%`, background: col }}/>
            </div>
            <div className="hbar-num">{formatV(d[valueKey])}</div>
          </div>
        );
      })}
      <ChartTooltip tip={tip} containerW={400}/>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, center, sub }) {
  const [tip, setTip] = useState(null);
  const total = slices.reduce((s,x) => s+x.value, 0);
  const R=42, CX=60, CY=60, IR=24;
  const paths = slices.map((sl, idx, arr) => {
    const prior = arr.slice(0,idx).reduce((s,x)=>s+(x.value/(total||1)),0);
    const pct = sl.value/(total||1);
    const a0 = prior*2*Math.PI - Math.PI/2;
    const a1 = (prior+pct)*2*Math.PI - Math.PI/2;
    const x1=CX+R*Math.cos(a0), y1=CY+R*Math.sin(a0);
    const x2=CX+R*Math.cos(a1), y2=CY+R*Math.sin(a1);
    return { d:`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${pct>.5?1:0} 1 ${x2} ${y2}Z`,
      ...sl, pct: Math.round(pct*100) };
  });
  return (
    <div className="donut-outer">
      <div style={{position:'relative'}}>
        <svg width={130} height={130} viewBox="0 0 120 120">
          <defs><filter id="dsf"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12"/></filter></defs>
          {paths.map((p,i) => (
            <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2.5"
              style={{cursor:'default', filter:'url(#dsf)', transition:'opacity 0.15s'}}
              onMouseMove={e => {
                const bbox = e.currentTarget.closest('.donut-outer').getBoundingClientRect();
                setTip({ x:e.clientX-bbox.left, y:e.clientY-bbox.top, title:p.label,
                  rows:[{dot:p.color, label:'Count', value:fmt(p.value)},{label:'Share', value:`${p.pct}%`}] });
              }}
              onMouseLeave={() => setTip(null)}
            />
          ))}
          <circle cx={CX} cy={CY} r={IR} fill="white"/>
          <text x={CX} y={CY-3} textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e293b" fontFamily="Inter">{center}</text>
          <text x={CX} y={CY+10} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="Inter">{sub}</text>
        </svg>
        <ChartTooltip tip={tip} containerW={130}/>
      </div>
      <div className="donut-legend">
        {paths.map((p,i) => (
          <div key={i} className="dl-row">
            <span className="dl-dot" style={{background:p.color}}/>
            <span className="dl-label">{p.label}</span>
            <span className="dl-pct">{p.pct}%</span>
            <span className="dl-val">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SCard({ icon, label, value, sub, accent, trend }) {
  const Icon = icon;
  return (
    <div className={`sc-card sc-${accent}`}>
      <div className="sc-top">
        <div className="sc-icon"><Icon size={18}/></div>
        {trend != null && (
          <div className={`sc-trend ${trend>=0?'sc-up':'sc-dn'}`}>
            {trend>=0 ? <ArrowUp size={11}/> : <ArrowDown size={11}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="sc-val">{value}</div>
      <div className="sc-label">{label}</div>
      {sub && <div className="sc-sub">{sub}</div>}
    </div>
  );
}

// ─── Sortable Table ───────────────────────────────────────────────────────────
function SortTable({ cols, rows, maxRows=8, rowClass }) {
  const [sortCol, setSortCol]  = useState(cols[0]?.key);
  const [sortDir, setSortDir]  = useState('desc');
  const [page, setPage]        = useState(0);

  const sorted = useMemo(() => {
    const c = cols.find(c => c.key===sortCol);
    return [...rows].sort((a,b) => {
      const av = c?.num ? Number(a[sortCol]) : String(a[sortCol]||'');
      const bv = c?.num ? Number(b[sortCol]) : String(b[sortCol]||'');
      return sortDir==='asc' ? (av>bv?1:-1) : (av<bv?1:-1);
    });
  }, [rows, sortCol, sortDir, cols]);

  const pages  = Math.ceil(sorted.length / maxRows);
  const visible = sorted.slice(page*maxRows, (page+1)*maxRows);

  const sort = (key) => {
    if (sortCol===key) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortCol(key); setSortDir('desc'); }
    setPage(0);
  };

  return (
    <div className="stbl-wrap">
      <table className="stbl">
        <thead>
          <tr>{cols.map(c => (
            <th key={c.key} onClick={() => sort(c.key)} className={sortCol===c.key?'active':''}>
              {c.label} {sortCol===c.key ? (sortDir==='asc'?'↑':'↓') : ''}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {visible.map((row,i) => (
            <tr key={i} className={rowClass?.(row)}>
              {cols.map(c => (
                <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pages>1 && (
        <div className="stbl-pager">
          <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0}>‹</button>
          <span>{page+1} / {pages}</span>
          <button onClick={() => setPage(p=>Math.min(pages-1,p+1))} disabled={page===pages-1}>›</button>
        </div>
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function ABadge({ level }) {
  const cfg = {
    'Expired':  { cls:'ab-crit',  icon:<XCircle    size={11}/> },
    'Critical': { cls:'ab-crit',  icon:<XCircle    size={11}/> },
    'Warning':  { cls:'ab-warn',  icon:<AlertCircle size={11}/> },
    'Upcoming': { cls:'ab-info',  icon:<Clock       size={11}/> },
    'Safe':     { cls:'ab-safe',  icon:<CheckCircle size={11}/> },
  };
  const c = cfg[level] || cfg['Safe'];
  return <span className={`ab ${c.cls}`}>{c.icon}{level}</span>;
}

function IBadge({ status }) {
  const cfg = {
    'Healthy':   'ib-ok',
    'Low Stock': 'ib-warn',
    'Critical':  'ib-crit',
  };
  return <span className={`ib ${cfg[status]||'ib-ok'}`}>{status}</span>;
}

// ─── Seasonal Panel ───────────────────────────────────────────────────────────
const SEASONAL_INSIGHTS = [
  { season:'Winter (Oct–Feb)',  emoji:'❄️', color:'#0ea5e9', bg:'#e0f2fe',
    cats:['Cough/Cold'], tip:'Cold & flu surge. Stock cough syrups, decongestants.',
    meds:['ZEDEX SYRUP','NOCOLD SYRUP','REXCOF LS','FLUMONT LC','ZANDU PANCHARISHTA'] },
  { season:'Summer (Mar–Jun)',  emoji:'☀️', color:'#f59e0b', bg:'#fef3c7',
    cats:['Fever','Digestive'], tip:'Heat-related illness, gastric issues surge.',
    meds:['ENO','GELUSIL MPS','DIGEGEL MPS','IBUGESIC PLUS','Dolo 650'] },
  { season:'Monsoon (Jul–Sep)', emoji:'🌧️', color:'#8b5cf6', bg:'#ede9fe',
    cats:['Allergies','Fever'], tip:'Water-borne diseases & allergy spike.',
    meds:['ALMOX 500MG','METRO IV','CEFIX OF TAB','FLUMONT LC','BETADINE SOLUTION'] },
  { season:'Allergy Season',    emoji:'🌿', color:'#10b981', bg:'#d1fae5',
    cats:['Allergies'], tip:'Pollen & dust allergy season. Antihistamines in demand.',
    meds:['FLUMONT LC','Montelukast 10mg','NICIP PLUS','CIPCAL 500'] },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key:'overview',   label:'Overview',       icon:Activity    },
  { key:'inventory',  label:'Inventory',      icon:Package     },
  { key:'expiry',     label:'Expiry Alerts',  icon:Clock       },
  { key:'sales',      label:'Sales & Revenue',icon:TrendingUp  },
  { key:'seasonal',   label:'Seasonal Demand',icon:Calendar    },
  { key:'branches',   label:'Multi-Branch',   icon:Building    },
  { key:'discreturns',label:'Discounts & Returns', icon:RefreshCcw},
  { key:'staff',      label:'Staff Activity', icon:Users       },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
// ─── Date-range helpers ──────────────────────────────────────────────────────
const DATE_RANGES = [
  { key:'7d',   label:'Last 7 Days',   days:7   },
  { key:'30d',  label:'Last 30 Days',  days:30  },
  { key:'90d',  label:'Last 90 Days',  days:90  },
  { key:'6m',   label:'Last 6 Months', days:180 },
  { key:'1y',   label:'Last 1 Year',   days:365 },
];

function getCutoff(rangeKey) {
  const r = DATE_RANGES.find(x => x.key === rangeKey) || DATE_RANGES[2];
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

export default function Analytics() {
  const [tab,       setTab]       = useState('overview');
  const [dateRange, setDateRange] = useState('90d');
  const [exporting, setExporting] = useState(null); // null | 'progress' | 'done'
  const [topMedsFilter, setTopMedsFilter] = useState('revenue'); // revenue | units | month

  // ── Filtered sales dataset (drives all derived metrics) ──────────────────
  const filteredSales = useMemo(() => {
    const cutoff = getCutoff(dateRange);
    const mockFiltered = ANALYTICS_SALES.filter(r => new Date(r.date) >= cutoff);
    const liveSales = getSales().filter(r => new Date(r.date) >= cutoff).map(s => ({
      ...s,
      medicineName: s.items?.[0]?.name || 'Multiple',
      quantitySold: s.items?.reduce((acc, i) => acc + i.quantity, 0) || 1,
    }));
    return [...mockFiltered, ...liveSales];
  }, [dateRange]);

  const filteredPurchases = useMemo(() => {
    const cutoff = getCutoff(dateRange);
    return ANALYTICS_PURCHASES.filter(r => new Date(r.purchaseDate || r.date) >= cutoff);
  }, [dateRange]);

  // ── Derived metrics (all depend on filteredSales) ─────────────────────────
  // ─── Financial Aggregates - Fixed COGS Logic ─────────────────────────
  const costMap = useMemo(() => {
    const map = {};
    ANALYTICS_PURCHASES.forEach(p => {
      if (!map[p.medicineId] || new Date(p.date) > new Date(map[p.medicineId].date)) {
        map[p.medicineId] = { price: p.costPrice, date: p.date };
      }
    });
    return map;
  }, []);

  const totalRev    = useMemo(() => filteredSales.reduce((s,r)=>s+r.totalAmount,0),  [filteredSales]);
  const totalOrders = filteredSales.length;
  
  const totalCOGS = useMemo(() => {
    return filteredSales.reduce((sum, sale) => {
      const purchaseInfo = costMap[sale.medicineId];
      // Use purchase cost if available, otherwise estimate at 75% of sale price (25% margin standard)
      const costPerUnit = purchaseInfo ? purchaseInfo.price : (sale.totalAmount / sale.quantitySold) * 0.75;
      return sum + (costPerUnit * sale.quantitySold);
    }, 0);
  }, [filteredSales, costMap]);

  // Compatibility with existing code that uses totalCost for other purposes
  const totalPurchaseSpend = useMemo(() => filteredPurchases.reduce((s,r)=>s+r.totalCost,0),[filteredPurchases]);
  const unitsSold   = useMemo(() => filteredSales.reduce((s,r)=>s+r.quantitySold,0), [filteredSales]);

  // Inventory value — static (not time-filtered, it's a snapshot)
  const medPriceMap = useMemo(() => {
    const m = {};
    MEDICINE_DATA.forEach(med => { m[med.id] = med.price || 50; });
    return m;
  }, []);
  const invValue    = useMemo(() =>
    ANALYTICS_INVENTORY.reduce((s,i) => s + i.stockCount*(medPriceMap[i.medicineId]||50), 0), [medPriceMap]);

  const invHealthy  = ANALYTICS_INVENTORY.filter(i=>i.status==='Healthy').length;
  const invLow      = ANALYTICS_INVENTORY.filter(i=>i.status==='Low Stock').length;
  const invCritical = ANALYTICS_INVENTORY.filter(i=>i.status==='Critical').length;
  const stockScore  = Math.round((invHealthy / (ANALYTICS_INVENTORY.length||1)) * 100);

  const expiringCount = ANALYTICS_EXPIRY.filter(e=>e.status!=='Safe').length;
  const lowStockCount = invLow + invCritical;

  // Revenue grouped by month (filtered)
  const revenueByMonth = useMemo(() => {
    const map = {};
    filteredSales.forEach(r => {
      const k = r.date.substring(0,7);
      map[k] = (map[k]||0) + r.totalAmount;
    });
    return Object.entries(map)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k, revenue]) => ({ month: k.substring(5)+'/'+k.substring(2,4), revenue: Math.round(revenue) }));
  }, [filteredSales]);

  // Top selling medicines (filtered & sorted by mode)
  const topMeds = useMemo(() => {
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7);
    
    const dataToUse = topMedsFilter === 'month' 
      ? filteredSales.filter(s => s.date.startsWith(currentMonthStr))
      : filteredSales;

    const g = groupBy(dataToUse, 'medicineName');
    return Object.entries(g)
      .map(([name,rows]) => ({
        name,
        units:   rows.reduce((s,r)=>s+Number(r.quantitySold || 0),0),
        revenue: rows.reduce((s,r)=>s+Number(r.totalAmount || 0),0),
        month:   rows[0]?.date.substring(0, 7) || 'N/A'
      }))
      .sort((a,b) => b[topMedsFilter === 'units' ? 'units' : 'revenue'] - a[topMedsFilter === 'units' ? 'units' : 'revenue'])
      .slice(0, 10);
  }, [filteredSales, topMedsFilter]);

  // Payment mix (filtered)
  const payMix = useMemo(() => {
    const g = groupBy(filteredSales,'paymentMethod');
    const COLS={Cash:'#6366f1',UPI:'#14b8a6','Credit Card':'#f59e0b'};
    return Object.entries(g).map(([label,rows])=>({label,value:rows.length,color:COLS[label]||'#94a3b8'}));
  }, [filteredSales]);

  // Inventory donut (static snapshot)
  const invDonut = [
    {label:'Healthy',   value:invHealthy,  color:'#10b981'},
    {label:'Low Stock', value:invLow,      color:'#f59e0b'},
    {label:'Critical',  value:invCritical, color:'#ef4444'},
  ];

  // Expiry rows with alert level (static)
  const expiryRows = useMemo(() =>
    ANALYTICS_EXPIRY.map(e => {
      let alertLevel = 'Safe';
      if (e.daysToExpiry < 0)  alertLevel = 'Expired';
      else if (e.daysToExpiry < 30) alertLevel = 'Critical';
      else if (e.daysToExpiry < 60) alertLevel = 'Warning';
      else if (e.daysToExpiry < 90) alertLevel = 'Upcoming';
      return { ...e, alertLevel };
    }).sort((a,b)=>a.daysToExpiry-b.daysToExpiry)
  , []);

  // Low stock items
  const lowStockRows = useMemo(() =>
    ANALYTICS_INVENTORY
      .filter(i=>i.status!=='Healthy')
      .map(i => ({ ...i, reorderQty: Math.max(i.reorderLevel*2 - i.stockCount, 50) }))
      .sort((a,b)=>a.stockCount-b.stockCount)
  , []);

  // Non-moving stock (uses filtered sales count)
  const salesCountMap = useMemo(() => {
    const m = {};
    filteredSales.forEach(r => { m[r.medicineName] = (m[r.medicineName]||0)+1; });
    return m;
  }, [filteredSales]);
  const nonMoving = useMemo(() =>
    ANALYTICS_INVENTORY
      .filter(i => (salesCountMap[i.medicineName]||0) < 3 && i.stockCount > 50)
      .map(i => ({ ...i, salesCount: salesCountMap[i.medicineName]||0 }))
      .sort((a,b)=>a.salesCount-b.salesCount)
      .slice(0,15)
  , [salesCountMap]);

  // Supplier spend (filtered)
  const supSpend = useMemo(() => {
    const g = groupBy(filteredPurchases,'supplierName');
    return Object.entries(g)
      .map(([name,rows])=>({name,value:rows.reduce((s,r)=>s+r.totalCost,0),orders:rows.length}))
      .sort((a,b)=>b.value-a.value);
  }, [filteredPurchases]);

  // ── Export helpers ────────────────────────────────────────────────────────
  const rangeLabel = DATE_RANGES.find(r=>r.key===dateRange)?.label.replace(/\s+/g,'') || 'Custom';

  const triggerExport = (type) => {
    setExporting('progress');
    setTimeout(() => {
      let csv = '';
      let filename = '';
      if (type === 'sales') {
        csv = arrayToCSV(filteredSales, [
          {key:'id',           label:'Transaction ID'},
          {key:'date',         label:'Date'},
          {key:'medicineName', label:'Medicine'},
          {key:'category',     label:'Category'},
          {key:'quantitySold', label:'Quantity'},
          {key:'totalAmount',  label:'Revenue (INR)'},
          {key:'paymentMethod',label:'Payment Mode'},
        ]);
        filename = `Pharmatrix_SalesReport_${rangeLabel}.csv`;
      } else if (type === 'inventory') {
        csv = arrayToCSV(ANALYTICS_INVENTORY, [
          {key:'medicineName', label:'Medicine'},
          {key:'category',     label:'Category'},
          {key:'batchNumber',  label:'Batch'},
          {key:'stockCount',   label:'Stock'},
          {key:'reorderLevel', label:'Reorder At'},
          {key:'status',       label:'Status'},
        ]);
        filename = `Pharmatrix_InventoryReport_${rangeLabel}.csv`;
      } else if (type === 'expiry') {
        csv = arrayToCSV(expiryRows, [
          {key:'medicineName', label:'Medicine'},
          {key:'batchNumber',  label:'Batch'},
          {key:'stockLeft',    label:'Qty Left'},
          {key:'expiryDate',   label:'Expiry Date'},
          {key:'daysToExpiry', label:'Days to Expiry'},
          {key:'alertLevel',   label:'Alert Level'},
        ]);
        filename = `Pharmatrix_ExpiryReport_${rangeLabel}.csv`;
      } else if (type === 'profit') {
        const rows = revenueByMonth.map(r => ({
          month:  r.month,
          revenue: r.revenue,
          estimatedProfit: Math.round(r.revenue * (gross > 0 ? margin/100 : 0)),
          margin: `${margin}%`,
        }));
        csv = arrayToCSV(rows, [
          {key:'month',            label:'Month'},
          {key:'revenue',          label:'Revenue (INR)'},
          {key:'estimatedProfit',  label:'Estimated Profit (INR)'},
          {key:'margin',           label:'Margin %'},
        ]);
        filename = `Pharmatrix_ProfitReport_${rangeLabel}.csv`;
      }
      downloadCSV(csv, filename);
      setExporting('done');
      setTimeout(() => setExporting(null), 2500);
    }, 500);
  };

  // Seasonal demand by month
  const seasonalByMonth = useMemo(() => {
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map(month => ({
      month,
      total: ANALYTICS_SEASONAL.filter(s=>s.month===month).reduce((s,r)=>s+r.unitsSold,0)
    }));
  }, []);

  const seasonalCats = useMemo(() => {
    const cats = [...new Set(ANALYTICS_SEASONAL.map(s=>s.diseaseCategory))];
    return cats.map(cat => ({
      category: cat,
      data: ANALYTICS_SEASONAL.filter(s=>s.diseaseCategory===cat),
      total: ANALYTICS_SEASONAL.filter(s=>s.diseaseCategory===cat).reduce((s,r)=>s+r.unitsSold,0),
    }));
  }, []);

  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  const gross = totalRev - totalCOGS;
  const margin = totalRev > 0 ? Math.round((gross/totalRev)*100) : 0;

  const grossProps = gross > 0 ? {
    label: "Gross Profit", accent: "green", icon: TrendingUp, trend: margin, value: fmtK(gross), sub: `${margin}% margin`
  } : gross < 0 ? {
    label: "Gross Loss", accent: "red", icon: ArrowDown, trend: margin, value: fmtK(Math.abs(gross)), sub: `${Math.abs(margin)}% loss margin`
  } : {
    label: "Break-even", accent: "blue", icon: Activity, trend: undefined, value: fmtCur(0), sub: `0% margin`
  };

  return (
    <div className="an-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="an-hero">
        <div className="an-hero-bg"/>
        <div className="an-hero-inner">
          <div>
            <div className="an-eyebrow"><span className="live-pulse"/>&nbsp;Live · {today}</div>
            <h1 className="an-title">Pharmacy Analytics</h1>
            <p className="an-sub">Pharmatrix Operational Intelligence — real-time inventory, sales &amp; demand insights</p>
          </div>
          <div className="hero-chips">
            <div className="hchip hc-blue"><DollarSign size={13}/><strong>{fmtK(totalRev)}</strong><span>Revenue</span></div>
            <div className="hchip hc-teal"><TrendingUp size={13}/><strong>{margin}%</strong><span>Margin</span></div>
            <div className="hchip hc-red"><AlertTriangle size={13}/><strong>{expiringCount}</strong><span>Alerts</span></div>
            <div className="hchip hc-purple"><Package size={13}/><strong>{stockScore}%</strong><span>Stock Health</span></div>
          </div>
        </div>
      </div>

      {/* ── Filter + Export Toolbar ──────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', margin:'1rem 0 0.5rem', padding:'0.75rem 1rem', background:'white', borderRadius:'10px', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Activity size={15} color="#64748b"/>
          <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#64748b' }}>Date Range:</span>
          {DATE_RANGES.map(r => (
            <button key={r.key}
              onClick={() => setDateRange(r.key)}
              style={{ padding:'0.3rem 0.7rem', borderRadius:'6px', border:'1px solid', fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
                background: dateRange===r.key ? '#6366f1' : 'transparent',
                color:      dateRange===r.key ? 'white'   : '#64748b',
                borderColor:dateRange===r.key ? '#6366f1' : '#e2e8f0',
                transition: 'all 0.15s'
              }}>{r.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', position:'relative' }}>
          {exporting === 'progress' && (
            <span style={{ fontSize:'0.8rem', color:'#6366f1', fontWeight:500, display:'flex', alignItems:'center', gap:'0.3rem' }}>
              <span style={{ width:10, height:10, borderRadius:'50%', border:'2px solid #6366f1', borderTopColor:'transparent', display:'inline-block', animation:'spin 0.8s linear infinite' }}/>
              Exporting report...
            </span>
          )}
          {exporting === 'done' && (
            <span style={{ fontSize:'0.8rem', color:'#059669', fontWeight:600 }}>✓ CSV downloaded successfully</span>
          )}
          <div style={{ position:'relative' }}>
            <select
              onChange={e => { if (e.target.value) triggerExport(e.target.value); e.target.value=''; }}
              defaultValue=""
              style={{ padding:'0.35rem 2rem 0.35rem 0.75rem', borderRadius:'7px', border:'1px solid #6366f1', background:'#6366f1', color:'white', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', appearance:'none' }}>
              <option value="" disabled>⬇ Export CSV</option>
              <option value="sales">Export Sales Report</option>
              <option value="inventory">Export Inventory Report</option>
              <option value="expiry">Export Expiry Report</option>
              <option value="profit">Export Profit Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="an-tabs">
        {TABS.map(t => {
          const Icn = t.icon;
          return <button key={t.key} className={`an-tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}><Icn size={14}/>{t.label}</button>;
        })}
      </div>

      {/* ════════════════ OVERVIEW ══════════════════════════════════════════ */}
      {tab==='overview' && (
        <div className="tab-body">
          {/* Summary Cards */}
          <div className="sc-grid">
            <SCard icon={DollarSign}    label="Total Revenue"        value={fmtK(totalRev)} sub={`${totalOrders} orders`} accent="blue"   trend={12}/>
            <SCard {...grossProps} />
            <SCard icon={Layers}        label="Inventory Value"      value={fmtK(invValue)} sub="Estimated stock value"    accent="purple"/>
            <SCard icon={Clock}         label="Expiring Medicines"   value={expiringCount}  sub="Need immediate action"   accent="orange"/>
            <SCard icon={AlertTriangle} label="Low Stock Items"      value={lowStockCount}  sub={`${invCritical} critical`} accent="red"/>
            <SCard icon={CheckCircle}   label="Stock Health Score"   value={`${stockScore}%`} sub={`${invHealthy} SKUs healthy`} accent="green"/>
          </div>

          {/* Revenue + Donut */}
          <div className="an-2col-70" style={{marginTop:'1.5rem'}}>
            <div className="an-card">
              <div className="card-hdr"><BarChart2 size={16}/><span>Monthly Revenue Trend</span></div>
              <LineChart data={revenueByMonth} xKey="month" yKey="revenue" color="#6366f1" label="Revenue"/>
            </div>
            <div className="an-card">
              <div className="card-hdr"><Package size={16}/><span>Inventory Health</span></div>
              <DonutChart slices={invDonut} center={ANALYTICS_INVENTORY.length} sub="Total SKUs"/>
            </div>
          </div>

          {/* Top Medicines */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <TrendingUp size={16}/><span>Top 10 Medicines</span>
                <span className="card-sub">{topMedsFilter === 'revenue' ? 'by Revenue' : topMedsFilter === 'units' ? 'by Quantity' : 'Current Month Performance'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="tab-select" 
                  value={topMedsFilter} 
                  onChange={(e) => setTopMedsFilter(e.target.value)}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value="revenue">Revenue-wise</option>
                  <option value="units">Quantity-wise</option>
                  <option value="month">Month-wise</option>
                </select>
              </div>
            </div>
            <HBarChart 
              data={topMeds} 
              labelKey="name" 
              valueKey={topMedsFilter === 'units' ? 'units' : 'revenue'} 
              maxRows={10}
              showRanking={true}
              extraTooltipInfo={(d) => [
                { label: 'Revenue', value: fmtCur(d.revenue) },
                { label: 'Qty Sold', value: fmt(d.units) },
                { label: 'Month', value: d.month }
              ]}
            />
          </div>

          {/* Low Stock preview + Expiry preview */}
          <div className="an-2col-50" style={{marginTop:'1.5rem'}}>
            <div className="an-card">
              <div className="card-hdr"><AlertTriangle size={16} className="icon-warn"/><span>Low Stock Alert</span>
                <button className="card-link" onClick={()=>setTab('inventory')}>View All →</button></div>
              <SortTable maxRows={5} rows={lowStockRows.slice(0,8)}
                cols={[
                  {key:'medicineName',label:'Medicine'},
                  {key:'stockCount',  label:'Stock',num:true, render:v=><strong style={{color:v<20?'#ef4444':'#f59e0b'}}>{v}</strong>},
                  {key:'status',      label:'Status',render:v=><IBadge status={v}/>},
                ]}/>
            </div>
            <div className="an-card">
              <div className="card-hdr"><Clock size={16} className="icon-crit"/><span>Expiry Alerts</span>
                <button className="card-link" onClick={()=>setTab('expiry')}>View All →</button></div>
              <SortTable maxRows={5} rows={expiryRows.filter(e=>e.alertLevel!=='Safe').slice(0,8)}
                cols={[
                  {key:'medicineName',label:'Medicine'},
                  {key:'daysToExpiry',label:'Days',num:true,
                    render:v=><span style={{fontWeight:700,color:v<0?'#ef4444':v<30?'#ef4444':'#f59e0b'}}>{v<0?`${Math.abs(v)}d ago`:`${v}d`}</span>},
                  {key:'alertLevel',label:'Level',render:v=><ABadge level={v}/>},
                ]}/>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ INVENTORY ═════════════════════════════════════════ */}
      {tab==='inventory' && (
        <div className="tab-body">
          <div className="sc-grid">
            <SCard icon={Package}     label="Total SKUs"    value={ANALYTICS_INVENTORY.length} sub="Unique medicine lines" accent="blue"/>
            <SCard icon={CheckCircle} label="Healthy Stock" value={invHealthy}  sub="Well stocked"     accent="teal"/>
            <SCard icon={AlertCircle} label="Low Stock"     value={invLow}      sub="Needs reorder"    accent="orange"/>
            <SCard icon={XCircle}     label="Critical"      value={invCritical} sub="Immediate action" accent="red"/>
            <SCard icon={Layers}      label="Inventory Value" value={fmtK(invValue)} accent="purple"/>
            <SCard icon={Activity}    label="Stock Health"  value={`${stockScore}%`} accent="green"/>
          </div>

          {/* Stock health progress + donut */}
          <div className="an-2col-50" style={{marginTop:'1.5rem'}}>
            <div className="an-card">
              <div className="card-hdr"><Activity size={16}/><span>Stock Status Distribution</span></div>
              <DonutChart slices={invDonut} center={ANALYTICS_INVENTORY.length} sub="SKUs"/>
              <div className="progress-section">
                <div className="progress-label"><span>Stock Health Score</span><strong>{stockScore}%</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{width:`${stockScore}%`}}/></div>
                <p className="progress-note">{stockScore>=80?'🟢 Excellent — inventory well maintained':stockScore>=60?'🟡 Moderate — restock recommended':'🔴 Critical — urgent restock needed'}</p>
              </div>
            </div>
            <div className="an-card">
              <div className="card-hdr"><BarChart2 size={16}/><span>Stock Distribution (Top 15 SKUs)</span></div>
              <HBarChart data={ANALYTICS_INVENTORY.slice(0,15)} labelKey="medicineName" valueKey="stockCount"
                fmtVal={v=>fmt(v)+' units'}/>
            </div>
          </div>

          {/* Low stock table */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><AlertTriangle size={16} className="icon-warn"/><span>Low Stock — Reorder Required</span>
              <span className="card-sub">{lowStockRows.length} items need attention</span></div>
            <SortTable rows={lowStockRows} maxRows={10}
              cols={[
                {key:'medicineName',label:'Medicine'},
                {key:'category',    label:'Category'},
                {key:'batchNumber', label:'Batch'},
                {key:'stockCount',  label:'Current Stock',num:true, render:v=><strong style={{color:v<20?'#ef4444':'#f59e0b'}}>{v}</strong>},
                {key:'reorderLevel',label:'Reorder At',num:true},
                {key:'reorderQty',  label:'Reorder Qty',num:true, render:v=><span className="reorder-pill">{v}</span>},
                {key:'status',      label:'Status',render:v=><IBadge status={v}/>},
              ]}/>
          </div>

          {/* Non-moving stock */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><RefreshCw size={16} className="icon-info"/><span>Non-Moving Stock</span>
              <span className="card-sub">Items with stock &gt;50 but &lt;3 sales transactions — review for clearance</span></div>
            <SortTable rows={nonMoving} maxRows={10}
              cols={[
                {key:'medicineName',label:'Medicine'},
                {key:'category',    label:'Category'},
                {key:'stockCount',  label:'Stock',num:true},
                {key:'salesCount',  label:'Sales Txns',num:true,
                  render:v=><span style={{fontWeight:700,color:v===0?'#ef4444':'#f59e0b'}}>{v}</span>},
                {key:'status',      label:'Stock Status',render:v=><IBadge status={v}/>},
              ]}/>
          </div>
        </div>
      )}

      {/* ════════════════ EXPIRY ALERTS ═════════════════════════════════════ */}
      {tab==='expiry' && (
        <div className="tab-body">
          <div className="sc-grid">
            <SCard icon={Clock}       label="Total Tracked" value={ANALYTICS_EXPIRY.length} accent="blue"/>
            <SCard icon={XCircle}     label="Expired"       value={expiryRows.filter(e=>e.alertLevel==='Expired').length}  accent="red"/>
            <SCard icon={AlertCircle} label="Critical (<30d)" value={expiryRows.filter(e=>e.alertLevel==='Critical').length} accent="orange"/>
            <SCard icon={AlertTriangle} label="Warning (<60d)" value={expiryRows.filter(e=>e.alertLevel==='Warning').length} accent="yellow"/>
            <SCard icon={Calendar}    label="Upcoming (<90d)" value={expiryRows.filter(e=>e.alertLevel==='Upcoming').length} accent="purple"/>
            <SCard icon={CheckCircle} label="Safe"           value={expiryRows.filter(e=>e.alertLevel==='Safe').length}    accent="green"/>
          </div>

          {/* Alert cards grid */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><AlertTriangle size={16} className="icon-crit"/><span>Urgent Expiry Alerts</span>
              <span className="card-sub">Expired &amp; Critical batches requiring immediate action</span></div>
            <div className="alert-cards-grid">
              {expiryRows.filter(e=>['Expired','Critical'].includes(e.alertLevel)).map((e,i) => (
                <div key={i} className={`alert-card ac-${e.alertLevel==='Expired'?'crit':'warn'}`}>
                  <div className="ac-top"><ABadge level={e.alertLevel}/><span className="ac-batch">#{e.batchNumber}</span></div>
                  <div className="ac-name" title={e.medicineName}>{e.medicineName}</div>
                  <div className="ac-meta"><span>{e.stockLeft} units</span><span>{e.expiryDate}</span></div>
                  <div className={`ac-days ${e.daysToExpiry<0?'ad-red':'ad-amber'}`}>
                    {e.daysToExpiry<0?`${Math.abs(e.daysToExpiry)} days overdue`:`${e.daysToExpiry} days left`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full sortable expiry table */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><Clock size={16}/><span>Complete Expiry Register</span>
              <span className="card-sub">Click column headers to sort</span></div>
            <SortTable rows={expiryRows} maxRows={12}
              cols={[
                {key:'medicineName',label:'Medicine'},
                {key:'batchNumber', label:'Batch #'},
                {key:'stockLeft',   label:'Qty',num:true},
                {key:'expiryDate',  label:'Expiry Date'},
                {key:'daysToExpiry',label:'Days Left',num:true,
                  render:v=><span style={{fontWeight:700,color:v<0?'#ef4444':v<30?'#ef4444':v<60?'#f59e0b':'#10b981'}}>{v<0?`${Math.abs(v)}d ago`:`${v}d`}</span>},
                {key:'alertLevel',  label:'Alert Level', render:v=><ABadge level={v}/>},
              ]}/>
          </div>
        </div>
      )}

      {/* ════════════════ SALES & REVENUE ═══════════════════════════════════ */}
      {tab==='sales' && (
        <div className="tab-body">
          <div className="sc-grid">
            <SCard icon={DollarSign}  label="Total Revenue"   value={fmtK(totalRev)}  sub={`${totalOrders} transactions`} accent="blue"   trend={12}/>
            <SCard {...grossProps} />
            <SCard icon={ShoppingCart}label="Purchase Spend"  value={fmtK(totalPurchaseSpend)} sub={`${filteredPurchases.length} orders`} accent="purple" trend={-3}/>
            <SCard icon={Package}     label="Units Sold"      value={fmt(unitsSold)}  sub={DATE_RANGES.find(r=>r.key===dateRange)?.label} accent="indigo"/>
            <SCard icon={Activity}    label="Avg Transaction" value={totalOrders ? fmtK(totalRev/totalOrders) : '₹0'} accent="orange"/>
            <SCard icon={Zap}         label="Top Category"    value="Analgesic"       sub="by revenue"                   accent="green"/>
          </div>

          {/* Revenue line chart */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><TrendingUp size={16}/><span>Monthly Revenue Trend</span>
              <span className="card-sub">Hover line to see exact value · 6-month view</span></div>
            <LineChart data={revenueByMonth} xKey="month" yKey="revenue" color="#6366f1" label="Revenue"/>
          </div>

          {/* Top medicines + supplier spend */}
          <div className="an-2col-60" style={{marginTop:'1.5rem'}}>
            <div className="an-card">
              <div className="card-hdr"><BarChart2 size={16}/><span>Top 10 Medicines by Revenue</span>
                <span className="card-sub">Hover bar for exact value</span></div>
              <HBarChart data={topMeds} labelKey="name" valueKey="revenue" maxRows={10}/>
            </div>
            <div className="an-card">
              <div className="card-hdr"><ShoppingCart size={16}/><span>Supplier Spend</span></div>
              <HBarChart data={supSpend} labelKey="name" valueKey="value" maxRows={4}/>
              <div style={{marginTop:'1rem'}}>
                <div className="card-hdr"><BarChart2 size={16}/><span>Payment Mix</span></div>
                <DonutChart slices={payMix} center={totalOrders} sub="Transactions"/>
              </div>
            </div>
          </div>

          {/* Sales transaction log */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><Activity size={16}/><span>Sales Transaction Log</span>
              <span className="card-sub">{filteredSales.length} entries for {DATE_RANGES.find(r=>r.key===dateRange)?.label} · click headers to sort</span></div>
            <SortTable rows={[...filteredSales].reverse()} maxRows={12}
              cols={[
                {key:'id',           label:'TXN ID'},
                {key:'date',         label:'Date'},
                {key:'medicineName', label:'Medicine'},
                {key:'category',     label:'Category'},
                {key:'quantitySold', label:'Qty',num:true},
                {key:'totalAmount',  label:'Amount',num:true,render:v=><strong>{fmtCur(v)}</strong>},
                {key:'paymentMethod',label:'Mode',render:v=><span className="tag-chip">{v}</span>},
              ]}/>
          </div>
        </div>
      )}

      {/* ════════════════ SEASONAL DEMAND ═══════════════════════════════════ */}
      {tab==='seasonal' && (
        <div className="tab-body">
          <div className="sc-grid-5">
            {seasonalCats.map((cat,i) => {
              const pk = cat.data.reduce((a,b)=>a.unitsSold>b.unitsSold?a:b);
              const ACCS=['blue','teal','purple','orange','red'];
              return <SCard key={i} icon={Calendar} label={cat.category}
                value={fmt(cat.total)} sub={`Peak: ${pk.month}`} accent={ACCS[i%ACCS.length]}/>;
            })}
          </div>

          {/* Monthly demand trend */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><BarChart2 size={16}/><span>Monthly Demand Trend</span>
              <span className="card-sub">Total units across all categories · hover for exact value</span></div>
            <LineChart data={seasonalByMonth} xKey="month" yKey="total" color="#8b5cf6" label="Units Sold"/>
          </div>

          {/* Demand heatmap */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><Calendar size={16}/><span>Seasonal Demand Heatmap</span>
              <span className="card-sub">Hover any cell for details · darker = higher demand</span></div>
            <SeasonalHeatmap data={ANALYTICS_SEASONAL} cats={seasonalCats}/>
          </div>

          {/* Seasonal insights */}
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><Zap size={16}/><span>Seasonal Stock Insights</span>
              <span className="card-sub">Recommended stocking strategy by season</span></div>
            <div className="season-insights-grid">
              {SEASONAL_INSIGHTS.map((s,i) => (
                <div key={i} className="si-card" style={{'--sic':s.color,'--sib':s.bg}}>
                  <div className="si-header">
                    <span className="si-emoji">{s.emoji}</span>
                    <div>
                      <div className="si-season">{s.season}</div>
                      <div className="si-cats">{s.cats.join(' · ')}</div>
                    </div>
                  </div>
                  <p className="si-tip">{s.tip}</p>
                  <div className="si-meds">
                    {s.meds.map((m,j) => <span key={j} className="si-med-pill">{m}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MULTI-BRANCH ═════════════════════════════════════ */}
      {tab==='branches' && (
        <div className="tab-body">
          <div className="sc-grid">
            <SCard icon={Building} label="Total Branches" value="12" accent="blue"/>
            <SCard icon={TrendingUp} label="Top Branch" value="Branch #4" sub="Highest Revenue" accent="green"/>
            <SCard icon={AlertCircle} label="Underperforming" value="Branch #7" accent="orange"/>
          </div>
          <div className="an-card" style={{marginTop:'1.5rem'}}>
            <div className="card-hdr"><Building size={16}/><span>Branch Performance</span></div>
            <SortTable maxRows={12} rows={[
              {branch: 'Branch #1', rev: '$45,200', inv: '98%', status: 'Healthy'},
              {branch: 'Branch #2', rev: '$38,100', inv: '91%', status: 'Healthy'},
              {branch: 'Branch #3', rev: '$52,800', inv: '88%', status: 'Low Stock warnings'},
              {branch: 'Branch #4', rev: '$64,500', inv: '95%', status: 'Excellent'},
            ]} cols={[
              {key: 'branch', label: 'Branch Name'}, {key: 'rev', label: 'Monthly Revenue'}, {key: 'inv', label: 'Inventory Health'}, {key: 'status', label: 'Status Notice'}
            ]} />
          </div>
        </div>
      )}

      {/* ════════════════ DISCOUNTS & RETURNS ══════════════════════════════ */}
      {tab==='discreturns' && (
        <div className="tab-body">
          <div className="an-card" style={{marginBottom:'1.5rem'}}>
            <div className="card-hdr"><Percent size={16} className="icon-warn"/><span>Discount Logs (Audit)</span></div>
            <SortTable maxRows={10} rows={JSON.parse(localStorage.getItem('discount_audit')||'[]')} cols={[
              {key: 'date', label: 'Date', render: v => new Date(v).toLocaleString()},
              {key: 'user', label: 'Issued By'},
              {key: 'billTotal', label: 'Bill Total', render: v => `$${Number(v).toFixed(2)}`},
              {key: 'flatDiscount', label: 'Flat Disc', render: v => `$${Number(v).toFixed(2)}`},
              {key: 'itemDiscounts', label: 'Item Disc', render: v => v?.map(i => `${i.name}(${i.discount})`).join(', ') || 'None'},
            ]} />
          </div>

          <div className="an-card">
            <div className="card-hdr"><RefreshCcw size={16} className="icon-crit"/><span>Sales Return Logs</span></div>
            <SortTable maxRows={10} rows={JSON.parse(localStorage.getItem('return_history')||'[]')} cols={[
              {key: 'date', label: 'Date', render: v => new Date(v).toLocaleString()},
              {key: 'invoiceId', label: 'Invoice ID'},
              {key: 'itemName', label: 'Returned Item'},
              {key: 'quantity', label: 'Qty'},
              {key: 'reason', label: 'Condition/Action'},
            ]} />
          </div>
        </div>
      )}

      {/* ════════════════ STAFF ACTIVITY ═════════════════════════════════════ */}
      {tab==='staff' && (
        <div className="tab-body">
          <div className="an-card">
            <div className="card-hdr"><Users size={16}/><span>Staff System Activity Logs</span></div>
            <SortTable maxRows={15} rows={[
              {user: 'Admin User', action: 'Generated Monthly Report', time: '10 mins ago', module: 'Analytics'},
              {user: 'Pharmacist User', action: 'Billed Invoice #INV13912', time: '1 hour ago', module: 'Billing POS'},
              {user: 'Pharmacist User', action: 'Restocked Amoxicillin', time: '2 hours ago', module: 'Inventory'},
              {user: 'Admin User', action: 'Logged in', time: '5 hours ago', module: 'Auth'},
              {user: 'Patient User', action: 'Scanned Paracetamol 500mg', time: '1 day ago', module: 'Medicine Scanner'},
            ]} cols={[
              {key: 'time', label: 'Timestamp'}, {key: 'user', label: 'Staff/User'}, {key: 'module', label: 'Module'}, {key: 'action', label: 'Action Details'}
            ]} />
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Seasonal Heatmap Component ───────────────────────────────────────────────
function SeasonalHeatmap({ cats }) {
  const containerRef = useRef(null);
  const [tip, setTip] = useState(null);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const COLS   = ['#6366f1','#0ea5e9','#14b8a6','#f59e0b','#ef4444'];

  return (
    <div ref={containerRef} className="hm-outer" style={{position:'relative'}}>
      <div className="hm-scroll">
        <div className="hm-grid">
          <div className="hm-header-row">
            <div className="hm-cat-col"/>
            {MONTHS.map(m => <div key={m} className="hm-month">{m}</div>)}
          </div>
          {cats.map((cat,ci) => {
            const col = COLS[ci%COLS.length];
            const mx  = Math.max(...cat.data.map(d=>d.unitsSold),1);
            return (
              <div key={ci} className="hm-row">
                <div className="hm-cat-col">{cat.category}</div>
                {cat.data.map((d,mi) => {
                  const opacity = 0.12 + (d.unitsSold/mx)*0.88;
                  return (
                    <div key={mi} className="hm-cell"
                      style={{background:col, opacity}}
                      onMouseMove={e => {
                        if (!containerRef.current) return;
                        const r = containerRef.current.getBoundingClientRect();
                        setTip({ x:e.clientX-r.left, y:e.clientY-r.top,
                          title:`${d.month} — ${cat.category}`,
                          rows:[
                            {dot:col, label:'Units Sold',    value:fmt(d.unitsSold)},
                            {label:'Expected Demand', value:fmt(d.expectedDemand)},
                          ]
                        });
                      }}
                      onMouseLeave={() => setTip(null)}>
                      <span className="hm-val">{d.unitsSold}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <ChartTooltip tip={tip} containerW={640}/>
    </div>
  );
}

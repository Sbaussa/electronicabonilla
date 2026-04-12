import { useEffect, useState } from 'react';
import { reportService } from '../services';
import { fmt } from '../utils/formatters';
import './Dashboard.css';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { REPAIR_STATUSES } from '../utils/formatters';

// ── Mini sparkline inline ────────────────────────────────────────
function Spark({ data = [], color = '#00d4ff' }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width={80} height={36}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="total" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Progress bar ─────────────────────────────────────────────────
function Bar2({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4,
        transition: 'width 0.8s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

// ── Status dot ───────────────────────────────────────────────────
const STATUS_DOT = {
  recibido:           '#94a3b8',
  diagnostico:        '#f59e0b',
  en_reparacion:      '#7c3aed',
  esperando_repuesto: '#ef4444',
  listo:              '#10b981',
  entregado:          '#00d4ff',
  garantia:           '#f59e0b',
  no_repara:          '#6b7280',
};

const fmtShortDate = d => d?.slice(5) ?? '';

const PIE_COLORS = ['#00d4ff', '#10b981', '#f59e0b', '#7c3aed', '#ef4444', '#94a3b8'];

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.dashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-body">
      <div style={{ padding: '3rem', display: 'flex', gap: '1rem', flexDirection: 'column', opacity: 0.4 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 80, background: 'var(--bg2)', borderRadius: 12,
            animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
  if (!data) return null;

  // ── Derived metrics ──────────────────────────────────────────
  const salesToday   = data.sales_today?.total   ?? 0;
  const salesMonth   = data.sales_month?.total   ?? 0;
  const salesAvgDay  = salesMonth > 0 ? (salesMonth / 30) : 0;
  const salesVsAvg   = salesAvgDay > 0 ? ((salesToday / salesAvgDay - 1) * 100).toFixed(0) : 0;
  const repairsOpen  = data.repairs_open  ?? 0;
  const repairsReady = data.repairs_ready ?? 0;
  const lowStock     = data.low_stock_count ?? 0;

  // Repair status breakdown from recent repairs
  const statusCount = {};
  (data.recent_repairs ?? []).forEach(r => {
    statusCount[r.status] = (statusCount[r.status] || 0) + 1;
  });
  const pieData = Object.entries(statusCount).map(([k, v]) => ({
    name: REPAIR_STATUSES[k]?.label ?? k, value: v,
  }));

  const stats = [
    {
      label: 'Ventas Hoy',
      value: fmt.currency(salesToday),
      sub: `${data.sales_today?.count ?? 0} transacciones`,
      trend: salesVsAvg >= 0 ? `+${salesVsAvg}% vs promedio` : `${salesVsAvg}% vs promedio`,
      trendUp: salesVsAvg >= 0,
      color: 'var(--accent)',
      icon: '💰',
      sparkData: data.sales_chart?.slice(-7),
    },
    {
      label: 'Ventas del Mes',
      value: fmt.currency(salesMonth),
      sub: `${data.sales_month?.count ?? 0} transacciones`,
      trend: `Promedio diario ${fmt.currency(salesAvgDay)}`,
      trendUp: true,
      color: 'var(--success)',
      icon: '📈',
      sparkData: data.sales_chart,
    },
    {
      label: 'Reparaciones',
      value: repairsOpen,
      sub: `${repairsReady} listas para entregar`,
      trend: repairsReady > 0 ? `${Math.round((repairsReady/repairsOpen)*100)}% listas` : 'Ninguna lista',
      trendUp: repairsReady > 0,
      color: 'var(--warning)',
      icon: '🔧',
      progress: { value: repairsReady, max: repairsOpen },
    },
    {
      label: 'Stock Bajo',
      value: lowStock,
      sub: 'productos bajo mínimo',
      trend: lowStock > 20 ? '⚠ Atención urgente' : lowStock > 5 ? 'Revisar pronto' : 'Bajo control',
      trendUp: lowStock <= 5,
      color: lowStock > 20 ? 'var(--danger)' : lowStock > 5 ? 'var(--warning)' : 'var(--success)',
      icon: '📦',
    },
  ];

  return (
    <div className="page-body db-root">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header db-header">
        <div>
          <h2 className="db-title">Dashboard</h2>
          <div className="page-subtitle db-sub">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="db-live-badge">
          <span className="db-live-dot" />
          En vivo
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="db-stat-grid">
        {stats.map((s, i) => (
          <div key={s.label} className="db-stat-card" style={{ '--accent-color': s.color, animationDelay: `${i * 0.07}s` }}>
            <div className="db-stat-top">
              <div className="db-stat-meta">
                <span className="db-stat-label">{s.label}</span>
                <span className={`db-trend ${s.trendUp ? 'up' : 'down'}`}>{s.trend}</span>
              </div>
              <div className="db-stat-icon-wrap">
                <span className="db-stat-icon">{s.icon}</span>
              </div>
            </div>
            <div className="db-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="db-stat-sub">{s.sub}</div>
            {s.sparkData && (
              <div className="db-spark">
                <Spark data={s.sparkData} color={s.color} />
              </div>
            )}
            {s.progress && (
              <div style={{ marginTop: '0.6rem' }}>
                <Bar2 value={s.progress.value} max={s.progress.max} color={s.color} />
              </div>
            )}
            <div className="db-stat-bar" style={{ background: s.color }} />
          </div>
        ))}
      </div>

      {/* ── Main row: chart + repairs ──────────────────────────── */}
      <div className="db-main-grid">
        {/* Area Chart */}
        <div className="card db-chart-card">
          <div className="card-header">
            <span className="card-title">Ventas — últimos 30 días</span>
            <span className="db-chart-total">{fmt.currency(salesMonth)}</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.sales_chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
                tickFormatter={fmtShortDate} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={42} />
              <Tooltip
                contentStyle={{ background: '#0f1929', border: '1px solid #1e2d45', borderRadius: 10, fontSize: 12 }}
                formatter={v => [fmt.currency(v), 'Ventas']}
                labelFormatter={l => `📅 ${l}`}
                cursor={{ stroke: '#00d4ff', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area type="monotone" dataKey="total" stroke="#00d4ff" strokeWidth={2}
                fill="url(#areaGrad)" activeDot={{ r: 4, fill: '#00d4ff', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Repairs */}
        <div className="card db-repairs-card">
          <div className="card-header">
            <span className="card-title">Reparaciones recientes</span>
            <span className="db-badge-count">{repairsOpen} abiertas</span>
          </div>
          <div className="db-repairs-list">
            {(!data.recent_repairs || data.recent_repairs.length === 0) && (
              <div className="text-muted" style={{ fontSize: '0.85rem', padding: '1rem 0' }}>Sin reparaciones</div>
            )}
            {data.recent_repairs?.map(r => (
              <div key={r.ticket_number} className="db-repair-row">
                <div className="db-repair-dot" style={{ background: STATUS_DOT[r.status] ?? '#94a3b8' }} />
                <div className="db-repair-info">
                  <div className="db-repair-device">
                    {r.device_brand} {r.device_model}
                    {r.priority === 'urgente' && <span className="db-urgent">🚨</span>}
                  </div>
                  <div className="db-repair-meta">{r.client_name} · {r.ticket_number}</div>
                </div>
                <span className={`badge badge-${REPAIR_STATUSES[r.status]?.color || 'muted'}`} style={{ fontSize: '0.62rem', flexShrink: 0 }}>
                  {REPAIR_STATUSES[r.status]?.label || r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secondary row: bar chart + pie + top products ──────── */}
      <div className="db-secondary-grid">

        {/* Daily bar chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ventas diarias — semana actual</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.sales_chart?.slice(-7)} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false}
                tickFormatter={fmtShortDate} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#0f1929', border: '1px solid #1e2d45', borderRadius: 10, fontSize: 12 }}
                formatter={v => [fmt.currency(v), 'Ventas']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.sales_chart?.slice(-7).map((_, i, arr) => (
                  <Cell key={i} fill={i === arr.length - 1 ? '#00d4ff' : 'rgba(0,212,255,0.3)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Repair status pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Estado de reparaciones</span>
          </div>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <PieChart width={110} height={110}>
                <Pie data={pieData} cx={50} cy={50} innerRadius={30} outerRadius={50}
                  dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text2)', flex: 1 }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Sin datos</div>
          )}
        </div>

        {/* Top products */}
        {data.top_products?.length > 0 && (
          <div className="card db-top-products">
            <div className="card-header">
              <span className="card-title">Top productos del mes</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.top_products.slice(0, 5).map((p, i) => {
                const maxRev = data.top_products[0]?.revenue ?? 1;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt.currency(p.revenue)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bar2 value={p.revenue} max={maxRev} color={PIE_COLORS[i % PIE_COLORS.length]} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text2)', flexShrink: 0 }}>{p.qty_sold} uds</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { reportService } from '../services';
import { fmt } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from 'recharts';
import * as XLSX from 'xlsx';

const today    = new Date().toISOString().split('T')[0];
const firstDay = today.slice(0, 7) + '-01';
const firstYr  = today.slice(0, 4) + '-01-01';

const COLORS = ['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6'];

const REPAIR_STATUS_LABELS = {
  recibido: 'Recibido', diagnostico: 'Diagnóstico', en_reparacion: 'En reparación',
  esperando_repuesto: 'Esp. repuesto', listo: 'Listo', entregado: 'Entregado',
  no_repara: 'No repara', garantia: 'Garantía',
};

// ── Helpers ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'var(--accent)', icon, trend }) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stat-label">{label}</div>
        {icon && <span style={{ fontSize: '1.3rem' }}>{icon}</span>}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub   && <div className="stat-sub" style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
      {trend && <div style={{ fontSize: '0.7rem', marginTop: 4, color: trend.up ? 'var(--success)' : 'var(--danger)' }}>{trend.label}</div>}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{children}</h3>
      {action}
    </div>
  );
}

// ── Excel export ──────────────────────────────────────────────────
function exportSalesExcel(salesData, from, to, groupBy) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen por período
  const resumen = salesData.map(r => ({
    'Período':          r.period,
    'N° Ventas':        Number(r.sales_count),
    'Ingresos (COP)':   Number(r.revenue),
    'Descuentos (COP)': Number(r.discounts || 0),
    'Ticket Promedio':  Number(r.avg_ticket || 0),
  }));
  const ws1 = XLSX.utils.json_to_sheet(resumen);
  ws1['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Ventas por período');

  const filename = `ventas_${from}_${to}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function exportInventoryExcel(inventory) {
  const wb = XLSX.utils.book_new();
  const data = inventory.map(p => ({
    'Código':          p.code,
    'Producto':        p.name,
    'Marca':           p.brand || '',
    'Categoría':       p.category || '',
    'Stock':           Number(p.stock),
    'P. Compra (COP)': Number(p.purchase_price || 0),
    'P. Venta (COP)':  Number(p.sale_price || 0),
    'Valor Inv. (COP)':Number(p.inventory_value || 0),
    'Estado':          p.stock_status === 'ok' ? 'Normal' : p.stock_status === 'bajo' ? 'Bajo' : 'Agotado',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, `inventario_${today}.xlsx`);
}

function exportRepairsExcel(repairs, from, to) {
  if (!repairs) return;
  const wb = XLSX.utils.book_new();

  const byStatus = (repairs.by_status || []).map(r => ({
    'Estado':        REPAIR_STATUS_LABELS[r.status] || r.status,
    'Cantidad':      Number(r.count),
    'Ingresos (COP)': Number(r.revenue || 0),
  }));
  const ws1 = XLSX.utils.json_to_sheet(byStatus);
  ws1['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Por estado');

  const byTech = (repairs.by_technician || []).map(t => ({
    'Técnico':       t.technician || 'Sin asignar',
    'Reparaciones':  Number(t.count),
    'Ingresos (COP)':Number(t.revenue || 0),
  }));
  const ws2 = XLSX.utils.json_to_sheet(byTech);
  ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Por técnico');

  XLSX.writeFile(wb, `reparaciones_${from}_${to}.xlsx`);
}

// ── Componente principal ──────────────────────────────────────────
export default function Reports() {
  const [tab, setTab]             = useState('sales');
  const [salesData, setSalesData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [repairs, setRepairs]     = useState(null);
  const [from, setFrom]           = useState(firstDay);
  const [to, setTo]               = useState(today);
  const [groupBy, setGroupBy]     = useState('day');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = tab === 'sales'
      ? reportService.sales({ from, to, group_by: groupBy }).then(setSalesData)
      : tab === 'inventory'
      ? reportService.inventory().then(setInventory)
      : reportService.repairs({ from, to }).then(setRepairs);
    p.finally(() => setLoading(false));
  }, [tab, from, to, groupBy]);

  // ── Métricas derivadas ────────────────────────────────────────
  const totalRevenue  = salesData.reduce((s, r) => s + Number(r.revenue), 0);
  const totalSales    = salesData.reduce((s, r) => s + Number(r.sales_count), 0);
  const totalDiscount = salesData.reduce((s, r) => s + Number(r.discounts || 0), 0);
  const avgTicket     = totalSales > 0 ? totalRevenue / totalSales : 0;
  const maxRevDay     = salesData.length ? Math.max(...salesData.map(r => Number(r.revenue))) : 0;
  const bestPeriod    = salesData.find(r => Number(r.revenue) === maxRevDay);

  const inventoryVal  = inventory.reduce((s, p) => s + Number(p.inventory_value), 0);
  const stockOk       = inventory.filter(p => p.stock_status === 'ok').length;
  const stockBajo     = inventory.filter(p => p.stock_status === 'bajo').length;
  const stockAgotado  = inventory.filter(p => p.stock_status === 'agotado').length;
  const topBrands     = Object.entries(
    inventory.reduce((acc, p) => { acc[p.brand || 'Sin marca'] = (acc[p.brand || 'Sin marca'] || 0) + Number(p.inventory_value); return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const tooltipStyle = { background: '#0f1929', border: '1px solid #1e2d45', borderRadius: 10, fontSize: 12 };

  return (
    <div className="page-body">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Reportes</h2>
          <div className="page-subtitle">Análisis del negocio · {from} → {to}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 'auto' }} />
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={{ width: 'auto' }} />
          <button className="btn btn-secondary btn-sm" onClick={() => { setFrom(firstDay); setTo(today); }}>Este mes</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setFrom(firstYr);  setTo(today); }}>Este año</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setFrom('2020-01-01'); setTo(today); }}>Todo</button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="status-tabs mb-2">
        {[['sales','📈 Ventas'], ['inventory','📦 Inventario'], ['repairs','🔧 Reparaciones']].map(([key, label]) => (
          <button key={key} className={`status-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text2)', fontSize: '0.85rem' }}>Cargando datos…</div>}

      {/* ══════════════ VENTAS ══════════════ */}
      {!loading && tab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* KPIs */}
          <div className="stat-grid">
            <StatCard label="Ingresos totales"    value={fmt.currency(totalRevenue)}  icon="💰" color="var(--accent)"   sub={`${totalSales} transacciones en el período`} />
            <StatCard label="Ticket promedio"      value={fmt.currency(avgTicket)}     icon="🧾" color="var(--success)"  sub="Por transacción" />
            <StatCard label="Descuentos aplicados" value={fmt.currency(totalDiscount)} icon="🏷️" color="var(--warning)"  sub={totalRevenue > 0 ? `${((totalDiscount / (totalRevenue + totalDiscount)) * 100).toFixed(1)}% del bruto` : '—'} />
            <StatCard label="Mejor período"        value={bestPeriod?.period ?? '—'}   icon="🏆" color="var(--accent2)"  sub={bestPeriod ? fmt.currency(bestPeriod.revenue) : 'Sin datos'} />
          </div>

          {/* Filtro agrupación + botón exportar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[['day','Por día'], ['month','Por mes']].map(([v, l]) => (
                <button key={v} className={`btn btn-sm ${groupBy === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGroupBy(v)}>{l}</button>
              ))}
            </div>
            <button
              className="btn btn-sm"
              style={{ background: '#1d6f42', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => exportSalesExcel(salesData, from, to, groupBy)}
            >
              📥 Exportar Excel
            </button>
          </div>

          {/* Gráfica área ingresos */}
          <div className="card">
            <SectionTitle>Ingresos por período</SectionTitle>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={salesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'revenue' ? fmt.currency(v) : v, n === 'revenue' ? 'Ingresos' : 'Ventas']} />
                <Legend formatter={v => v === 'revenue' ? 'Ingresos' : 'N° Ventas'} />
                <Area type="monotone" dataKey="revenue"     stroke="#00d4ff" strokeWidth={2} fill="url(#rg1)" dot={false} />
                <Area type="monotone" dataKey="sales_count" stroke="#7c3aed" strokeWidth={2} fill="url(#rg2)" dot={false} yAxisId={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla detalle */}
          <div className="card">
            <SectionTitle>Detalle por período</SectionTitle>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Período</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Ingresos</th>
                    <th className="text-right">Descuentos</th>
                    <th className="text-right">Ticket prom.</th>
                    <th className="text-right">% del total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map(r => (
                    <tr key={r.period}>
                      <td className="fw-600">{r.period}</td>
                      <td className="text-right text-mono">{r.sales_count}</td>
                      <td className="text-right text-mono fw-600 text-accent">{fmt.currency(r.revenue)}</td>
                      <td className="text-right text-mono text-danger">{fmt.currency(r.discounts)}</td>
                      <td className="text-right text-mono">{fmt.currency(r.avg_ticket)}</td>
                      <td className="text-right text-mono text-muted">
                        {totalRevenue > 0 ? `${((Number(r.revenue) / totalRevenue) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  {salesData.length === 0 && <tr><td colSpan={6}><div className="empty-state"><p>Sin datos en el período</p></div></td></tr>}
                  {salesData.length > 0 && (
                    <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                      <td>TOTAL</td>
                      <td className="text-right text-mono">{totalSales}</td>
                      <td className="text-right text-mono text-accent">{fmt.currency(totalRevenue)}</td>
                      <td className="text-right text-mono text-danger">{fmt.currency(totalDiscount)}</td>
                      <td className="text-right text-mono">{fmt.currency(avgTicket)}</td>
                      <td className="text-right text-mono">100%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ INVENTARIO ══════════════ */}
      {!loading && tab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="stat-grid">
            <StatCard label="Valor en inventario" value={fmt.currency(inventoryVal)} icon="💼" color="var(--accent)"  sub={`${inventory.length} productos activos`} />
            <StatCard label="Stock normal"         value={stockOk}                   icon="✅" color="var(--success)" sub="Productos con stock suficiente" />
            <StatCard label="Stock bajo"           value={stockBajo}                 icon="⚠️" color="var(--warning)" sub="Por debajo del mínimo" />
            <StatCard label="Agotados"             value={stockAgotado}              icon="🚨" color="var(--danger)"  sub="Sin unidades disponibles" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
              Valor potencial de venta: <strong style={{ color: 'var(--accent)' }}>{fmt.currency(inventory.reduce((s, p) => s + Number(p.sale_price) * Number(p.stock), 0))}</strong>
            </span>
            <button
              className="btn btn-sm"
              style={{ background: '#1d6f42', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => exportInventoryExcel(inventory)}
            >
              📥 Exportar Excel
            </button>
          </div>

          {/* Pie por marca */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <SectionTitle>Valor de inventario por marca</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={topBrands} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {topBrands.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => fmt.currency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <SectionTitle>Estado del stock</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'Normal',  value: stockOk,      fill: '#10b981' },
                  { name: 'Bajo',    value: stockBajo,    fill: '#f59e0b' },
                  { name: 'Agotado', value: stockAgotado, fill: '#ef4444' },
                ]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {[stockOk, stockBajo, stockAgotado].map((_, i) => (
                      <Cell key={i} fill={['#10b981','#f59e0b','#ef4444'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla */}
          <div className="card">
            <SectionTitle>Inventario completo</SectionTitle>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Código</th><th>Producto</th><th>Categoría</th><th className="text-right">Stock</th><th className="text-right">P. Compra</th><th className="text-right">P. Venta</th><th className="text-right">Margen</th><th className="text-right">Valor inv.</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {inventory.map(p => {
                    const margin = p.purchase_price > 0 ? ((p.sale_price - p.purchase_price) / p.purchase_price * 100).toFixed(0) : null;
                    return (
                      <tr key={p.id}>
                        <td className="text-mono text-muted">{p.code}</td>
                        <td><div className="fw-600">{p.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>{p.brand}</div></td>
                        <td><span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{p.category || '—'}</span></td>
                        <td className="text-right text-mono">{p.stock}</td>
                        <td className="text-right text-mono">{fmt.currency(p.purchase_price)}</td>
                        <td className="text-right text-mono fw-600">{fmt.currency(p.sale_price)}</td>
                        <td className="text-right text-mono" style={{ color: margin > 30 ? 'var(--success)' : margin > 0 ? 'var(--warning)' : 'var(--danger)' }}>
                          {margin !== null ? `${margin}%` : '—'}
                        </td>
                        <td className="text-right text-mono">{fmt.currency(p.inventory_value)}</td>
                        <td>
                          <span className={`badge ${p.stock_status === 'ok' ? 'badge-success' : p.stock_status === 'bajo' ? 'badge-warning' : 'badge-danger'}`}>
                            {p.stock_status === 'ok' ? 'Normal' : p.stock_status === 'bajo' ? 'Bajo' : 'Agotado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REPARACIONES ══════════════ */}
      {!loading && tab === 'repairs' && repairs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* KPIs reparaciones */}
          <div className="stat-grid">
            <StatCard
              label="Total reparaciones"
              value={repairs.by_status?.reduce((s, r) => s + Number(r.count), 0) ?? 0}
              icon="🔧" color="var(--warning)"
            />
            <StatCard
              label="Ingresos reparaciones"
              value={fmt.currency(repairs.by_status?.reduce((s, r) => s + Number(r.revenue || 0), 0) ?? 0)}
              icon="💵" color="var(--success)"
            />
            <StatCard
              label="Listas para entregar"
              value={repairs.by_status?.find(r => r.status === 'listo')?.count ?? 0}
              icon="✅" color="var(--accent)"
              sub="Clientes esperando"
            />
            <StatCard
              label="Técnicos activos"
              value={repairs.by_technician?.filter(t => t.technician).length ?? 0}
              icon="👨‍🔧" color="var(--accent2)"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-sm"
              style={{ background: '#1d6f42', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => exportRepairsExcel(repairs, from, to)}
            >
              📥 Exportar Excel
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Pie por estado */}
            <div className="card">
              <SectionTitle>Distribución por estado</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <PieChart width={150} height={150}>
                  <Pie data={repairs.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={38} outerRadius={65} strokeWidth={0}>
                    {repairs.by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, REPAIR_STATUS_LABELS[n] || n]} />
                </PieChart>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {repairs.by_status.map((r, i) => (
                    <div key={r.status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text2)' }}>{REPAIR_STATUS_LABELS[r.status] || r.status}</span>
                      <span style={{ fontWeight: 700 }}>{r.count}</span>
                      {r.revenue > 0 && <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>{fmt.currency(r.revenue)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Por técnico */}
            <div className="card">
              <SectionTitle>Rendimiento por técnico</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={repairs.by_technician} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="technician" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={90}
                    tickFormatter={v => v || 'Sin asignar'} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'count' ? v : fmt.currency(v), n === 'count' ? 'Reparaciones' : 'Ingresos']} />
                  <Bar dataKey="count"   fill="#00d4ff" radius={[0,4,4,0]} name="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla técnicos */}
          <div className="card">
            <SectionTitle>Detalle por técnico</SectionTitle>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Técnico</th><th className="text-right">Reparaciones</th><th className="text-right">Ingresos</th><th className="text-right">Ticket prom.</th></tr></thead>
                <tbody>
                  {repairs.by_technician.map((t, i) => (
                    <tr key={i}>
                      <td className="fw-600">{t.technician || <span className="text-muted">Sin asignar</span>}</td>
                      <td className="text-right text-mono">{t.count}</td>
                      <td className="text-right text-mono fw-600 text-accent">{fmt.currency(t.revenue)}</td>
                      <td className="text-right text-mono">{fmt.currency(t.count > 0 ? t.revenue / t.count : 0)}</td>
                    </tr>
                  ))}
                  {repairs.by_technician.length === 0 && <tr><td colSpan={4}><div className="empty-state"><p>Sin datos</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { reportService } from '../services';
import { fmt } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const today = new Date().toISOString().split('T')[0];
const firstDay = today.slice(0, 7) + '-01';

const COLORS = ['#00d4ff','#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4'];

export default function Reports() {
  const [tab, setTab]           = useState('sales');
  const [salesData, setSalesData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [repairs, setRepairs]   = useState(null);
  const [from, setFrom]         = useState(firstDay);
  const [to, setTo]             = useState(today);
  const [groupBy, setGroupBy]   = useState('day');

  useEffect(() => {
    if (tab === 'sales')     reportService.sales({ from, to, group_by: groupBy }).then(setSalesData);
    if (tab === 'inventory') reportService.inventory().then(setInventory);
    if (tab === 'repairs')   reportService.repairs({ from, to }).then(setRepairs);
  }, [tab, from, to, groupBy]);

  const totalRevenue  = salesData.reduce((s, r) => s + Number(r.revenue), 0);
  const totalSales    = salesData.reduce((s, r) => s + Number(r.sales_count), 0);
  const inventoryVal  = inventory.reduce((s, p) => s + Number(p.inventory_value), 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2>Reportes</h2><div className="page-subtitle">Análisis del negocio</div></div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width:'auto' }} />
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={{ width:'auto' }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="status-tabs mb-2">
        {[['sales','📈 Ventas'], ['inventory','📦 Inventario'], ['repairs','🔧 Reparaciones']].map(([key, label]) => (
          <button key={key} className={`status-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Sales Tab */}
      {tab === 'sales' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Ingresos totales</div>
              <div className="stat-value text-accent">{fmt.currency(totalRevenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total transacciones</div>
              <div className="stat-value text-success">{fmt.number(totalSales)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ticket promedio</div>
              <div className="stat-value">{fmt.currency(totalSales > 0 ? totalRevenue / totalSales : 0)}</div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'0.75rem' }}>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ width:'auto' }}>
              <option value="day">Por día</option>
              <option value="month">Por mes</option>
            </select>
          </div>

          <div className="card mb-2">
            <div className="card-header"><span className="card-title">Ingresos por período</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <XAxis dataKey="period" tick={{ fontSize:11, fill:'#475569' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background:'#1a2236', border:'1px solid #1e2d45', borderRadius:8, fontSize:12 }}
                  formatter={(v, name) => [name === 'revenue' ? fmt.currency(v) : v, name === 'revenue' ? 'Ingresos' : 'Ventas']}
                />
                <Bar dataKey="revenue" fill="#00d4ff" radius={[4,4,0,0]} />
                <Bar dataKey="sales_count" fill="#7c3aed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Detalle por período</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Período</th><th className="text-right">Ventas</th><th className="text-right">Ingresos</th><th className="text-right">Descuentos</th><th className="text-right">Ticket prom.</th></tr></thead>
                <tbody>
                  {salesData.map(r => (
                    <tr key={r.period}>
                      <td className="fw-600">{r.period}</td>
                      <td className="text-right text-mono">{r.sales_count}</td>
                      <td className="text-right text-mono fw-600 text-accent">{fmt.currency(r.revenue)}</td>
                      <td className="text-right text-mono text-danger">{fmt.currency(r.discounts)}</td>
                      <td className="text-right text-mono">{fmt.currency(r.avg_ticket)}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && <tr><td colSpan={5}><div className="empty-state"><p>Sin datos en el período</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Valor en inventario</div>
              <div className="stat-value text-accent">{fmt.currency(inventoryVal)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total productos</div>
              <div className="stat-value">{inventory.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Stock agotado</div>
              <div className="stat-value text-danger">{inventory.filter(p => p.stock_status === 'agotado').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Stock bajo</div>
              <div className="stat-value text-warning">{inventory.filter(p => p.stock_status === 'bajo').length}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Inventario completo</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th className="text-right">Stock</th><th className="text-right">P. Compra</th><th className="text-right">P. Venta</th><th className="text-right">Valor inv.</th><th>Estado</th></tr></thead>
                <tbody>
                  {inventory.map(p => (
                    <tr key={p.id}>
                      <td className="text-mono text-muted">{p.code}</td>
                      <td><div className="fw-600">{p.name}</div><div style={{ fontSize:'0.72rem', color:'var(--text2)' }}>{p.brand}</div></td>
                      <td><span className="badge badge-accent" style={{ fontSize:'0.7rem' }}>{p.category || '—'}</span></td>
                      <td className="text-right text-mono">{p.stock}</td>
                      <td className="text-right text-mono">{fmt.currency(p.purchase_price)}</td>
                      <td className="text-right text-mono fw-600">{fmt.currency(p.sale_price)}</td>
                      <td className="text-right text-mono">{fmt.currency(p.inventory_value)}</td>
                      <td>
                        <span className={`badge ${p.stock_status === 'ok' ? 'badge-success' : p.stock_status === 'bajo' ? 'badge-warning' : 'badge-danger'}`}>
                          {p.stock_status === 'ok' ? 'OK' : p.stock_status === 'bajo' ? 'Bajo' : 'Agotado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Repairs Tab */}
      {tab === 'repairs' && repairs && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Por estado</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={repairs.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                  {repairs.by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1a2236', border:'1px solid #1e2d45', borderRadius:8, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Por técnico</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Técnico</th><th className="text-right">Reparaciones</th><th className="text-right">Ingresos</th></tr></thead>
                <tbody>
                  {repairs.by_technician.map((t, i) => (
                    <tr key={i}>
                      <td className="fw-600">{t.technician || 'Sin asignar'}</td>
                      <td className="text-right text-mono">{t.count}</td>
                      <td className="text-right text-mono fw-600 text-accent">{fmt.currency(t.revenue)}</td>
                    </tr>
                  ))}
                  {repairs.by_technician.length === 0 && <tr><td colSpan={3}><div className="empty-state"><p>Sin datos</p></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

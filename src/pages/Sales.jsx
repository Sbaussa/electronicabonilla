import { useState, useEffect } from 'react';
import { saleService } from '../services';
import { fmt } from '../utils/formatters';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

// Fecha de hoy y primer día del mes como default
const today    = new Date().toISOString().split('T')[0];
const firstDay = today.slice(0, 7) + '-01';

export default function Sales() {
  const [sales, setSales]   = useState([]);
  const [detail, setDetail] = useState(null);
  const [modal, setModal]   = useState(false);
  const [from, setFrom]     = useState(firstDay);
  const [to, setTo]         = useState(today);
  const [status, setStatus] = useState('');

  const load = () => saleService.getAll({ from, to, status, limit: 200 }).then(setSales);
  useEffect(() => { load(); }, [from, to, status]);

  const openDetail = (s) => { saleService.getById(s.id).then(setDetail); setModal(true); };

  const handleCancel = async (id) => {
    if (!confirm('¿Anular esta venta? Se revertirá el stock.')) return;
    try {
      await saleService.cancel(id);
      toast.success('Venta anulada');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const totalRevenue = sales.filter(s => s.status === 'completada').reduce((s, v) => s + Number(v.total), 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2>Historial de Ventas</h2>
          <div className="page-subtitle">{sales.length} registros · {fmt.currency(totalRevenue)} total</div>
        </div>
      </div>

      <div className="search-bar mb-2">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width:'auto' }} />
        <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={{ width:'auto' }} />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ width:'auto' }}>
          <option value="">Todos los estados</option>
          <option value="completada">Completada</option>
          <option value="anulada">Anulada</option>
        </select>
        <button className="btn btn-secondary" onClick={() => { setFrom(firstDay); setTo(today); setStatus(''); }}>
          Hoy
        </button>
        <button className="btn btn-secondary" onClick={() => { setFrom('2020-01-01'); setTo(today); setStatus(''); }}>
          Todo
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Factura</th><th>Cliente</th><th>Vendedor</th><th>Fecha</th><th>Pago</th><th className="text-right">Total</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td className="text-mono text-accent fw-600">{s.invoice_number}</td>
                  <td>{s.client_name || <span className="text-muted">Mostrador</span>}</td>
                  <td className="text-muted">{s.user_name}</td>
                  <td className="text-muted">{fmt.datetime(s.created_at)}</td>
                  <td><span className="badge badge-muted" style={{ fontSize:'0.7rem' }}>{s.payment_method}</span></td>
                  <td className="text-right text-mono fw-600">{fmt.currency(s.total)}</td>
                  <td>
                    <span className={`badge ${s.status === 'completada' ? 'badge-success' : s.status === 'anulada' ? 'badge-danger' : 'badge-warning'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => openDetail(s)}>Ver</button></td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><p>No hay ventas en el período</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={`Venta ${detail?.invoice_number}`} size="lg"
        footer={detail?.status === 'completada' && (
          <button className="btn btn-danger" onClick={() => handleCancel(detail.id)}>Anular venta</button>
        )}
      >
        {detail && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', fontSize:'0.85rem' }}>
              <div><div className="form-label">Cliente</div><div className="fw-600">{detail.client_name || 'Mostrador'}</div></div>
              <div><div className="form-label">Vendedor</div><div>{detail.user_name}</div></div>
              <div><div className="form-label">Fecha</div><div>{fmt.datetime(detail.created_at)}</div></div>
              <div><div className="form-label">Pago</div><div className="fw-600">{detail.payment_method}</div></div>
              <div><div className="form-label">Recibido</div><div className="text-mono">{fmt.currency(detail.payment_received)}</div></div>
              <div><div className="form-label">Cambio</div><div className="text-mono">{fmt.currency(detail.change_amount)}</div></div>
            </div>

            <div>
              <div className="form-label mb-1">Productos vendidos</div>
              <table style={{ width:'100%', fontSize:'0.82rem' }}>
                <thead><tr><th>Producto</th><th className="text-right">Cant.</th><th className="text-right">Precio</th><th className="text-right">Subtotal</th></tr></thead>
                <tbody>
                  {detail.items?.map(i => (
                    <tr key={i.id}>
                      <td>
                        <div className="fw-600">{i.product_name}</div>
                        <div className="text-mono text-muted" style={{ fontSize:'0.72rem' }}>{i.product_code}</div>
                      </td>
                      <td className="text-right text-mono">{i.quantity}</td>
                      <td className="text-right text-mono">{fmt.currency(i.unit_price)}</td>
                      <td className="text-right text-mono fw-600">{fmt.currency(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop:'1px solid var(--border)', paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              {detail.discount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.875rem' }}>
                  <span className="text-muted">Descuento</span>
                  <span className="text-mono text-danger">- {fmt.currency(detail.discount)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1.1rem', fontWeight:700 }}>
                <span>TOTAL</span>
                <span className="text-accent text-mono">{fmt.currency(detail.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { repairService, clientService, userService } from '../services';
import { fmt, REPAIR_STATUSES } from '../utils/formatters';
import { printRepairTicket, getAvailablePrinters, savePrinter, getSavedPrinter, clearPrinter } from '../utils/thermalPrint';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import './Repairs.css';

const EMPTY_REPAIR = {
  client_id:'', device_brand:'', device_model:'', device_serial:'',
  screen_size:'', problem_desc:'', accessories:'', priority:'normal',
  estimated_date:'', notes:'', technician_id:'', advance_payment:0,
};

// ── Modal configuración impresora ─────────────────────────────────
function PrinterSetupModal({ open, onClose }) {
  const [printers, setPrinters]   = useState([]);
  const [selected, setSelected]   = useState(getSavedPrinter() || '');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    getAvailablePrinters()
      .then(list => {
        setPrinters(list);
        if (!list.length) setError('No se pudo conectar a QZ Tray. Verifica que esté ejecutándose.');
      })
      .catch(() => setError('QZ Tray no está disponible.'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSave = () => {
    if (!selected) return toast.error('Selecciona una impresora');
    savePrinter(selected);
    toast.success(`Impresora guardada: ${selected}`);
    onClose();
  };

  const handleClear = () => {
    clearPrinter();
    setSelected('');
    toast.success('Impresora predeterminada eliminada');
  };

  return (
    <Modal open={open} onClose={onClose} title="⚙️ Configurar Impresora Térmica"
      footer={<>
        <button className="btn btn-danger btn-sm" onClick={handleClear}>Limpiar</button>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!selected}>Guardar</button>
      </>}
    >
      <div className="form-grid" style={{ gap:'1rem' }}>
        {loading && <div className="text-muted animate-pulse">Buscando impresoras…</div>}

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid var(--danger)', borderRadius:'var(--radius)', padding:'0.75rem', fontSize:'0.85rem' }}>
            <div className="fw-600 text-danger">⚠️ {error}</div>
            <div className="text-muted" style={{ marginTop:'0.4rem' }}>
              Descarga e instala QZ Tray en{' '}
              <a href="https://qz.io/download/" target="_blank" rel="noreferrer" style={{ color:'var(--accent)' }}>
                qz.io/download
              </a>
              {' '}y ejecútalo antes de continuar.
            </div>
          </div>
        )}

        {!loading && printers.length > 0 && (
          <div className="form-group">
            <label className="form-label">Selecciona la impresora térmica</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {printers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {getSavedPrinter() && (
              <div className="form-hint" style={{ marginTop:'0.35rem' }}>
                Guardada actualmente: <b>{getSavedPrinter()}</b>
              </div>
            )}
          </div>
        )}

        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'0.75rem', fontSize:'0.82rem', color:'var(--text2)' }}>
          <div className="fw-600" style={{ marginBottom:'0.35rem' }}>¿Cómo funciona?</div>
          <div>1. Instala y ejecuta <b>QZ Tray</b> en tu PC (ícono en la bandeja del sistema)</div>
          <div>2. Selecciona tu impresora térmica aquí</div>
          <div>3. Los tickets se imprimirán automáticamente sin mostrar ningún diálogo</div>
        </div>
      </div>
    </Modal>
  );
}

// ── Página Reparaciones ───────────────────────────────────────────
export default function Repairs() {
  const [repairs, setRepairs]       = useState([]);
  const [clients, setClients]       = useState([]);
  const [technicians, setTechs]     = useState([]);
  const [statusFilter, setStatus]   = useState('');
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(EMPTY_REPAIR);
  const [detail, setDetail]         = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus]   = useState('');
  const [statusComment, setComment] = useState('');
  const [loading, setLoading]       = useState(false);
  const [printerModal, setPrinterModal] = useState(false);

  const load = () => repairService.getAll({ status: statusFilter, search }).then(setRepairs);

  useEffect(() => { load(); }, [statusFilter, search]);
  useEffect(() => {
    clientService.getAll().then(setClients);
    userService.getAll().then(u => setTechs(u.filter(x => x.role === 'tecnico' || x.role === 'admin')));
  }, []);

  const openCreate  = () => { setForm(EMPTY_REPAIR); setModal('create'); };
  const openEdit    = (r) => { setSelected(r); setForm({ ...r }); setModal('edit'); };
  const openDetail  = (r) => { repairService.getById(r.id).then(setDetail); setModal('detail'); };
  const openStatus  = (r) => { setSelected(r); setNewStatus(r.status); setComment(''); setStatusModal(true); };

  const handlePrint = async (repairOrId) => {
    try {
      let data = repairOrId;
      if (typeof repairOrId === 'number' || typeof repairOrId === 'string') {
        data = await repairService.getById(repairOrId);
      }
      await printRepairTicket(data);
    } catch {
      toast.error('Error al imprimir');
    }
  };

  const handleSave = async () => {
    if (!form.device_brand || !form.problem_desc) {
      return toast.error('Marca del equipo y descripción del problema son requeridos');
    }
    setLoading(true);
    try {
      if (modal === 'create') {
        const res = await repairService.create(form);
        toast.success(`Orden creada: ${res.ticket_number}`);
        // Imprimir automáticamente al crear
        const newRepair = await repairService.getById(res.id);
        await handlePrint(newRepair);
      } else {
        await repairService.update(selected.id, form);
        toast.success('Orden actualizada');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async () => {
    setLoading(true);
    try {
      await repairService.changeStatus(selected.id, { status: newStatus, comment: statusComment });
      toast.success('Estado actualizado');
      setStatusModal(false);
      load();
      // Imprimir ticket actualizado si quedó listo
      if (newStatus === 'listo' || newStatus === 'entregado') {
        const updated = await repairService.getById(selected.id);
        await handlePrint(updated);
      }
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const STATUS_LIST = Object.entries(REPAIR_STATUSES);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2>Órdenes de Reparación</h2>
          <div className="page-subtitle">{repairs.length} órdenes</div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setPrinterModal(true)}>
            🖨 {getSavedPrinter() ? `Impresora: ${getSavedPrinter().slice(0,18)}…` : 'Configurar impresora'}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>+ Nueva Orden</button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="status-tabs mb-2">
        <button className={`status-tab${!statusFilter ? ' active' : ''}`} onClick={() => setStatus('')}>Todas</button>
        {STATUS_LIST.map(([key, { label }]) => (
          <button key={key} className={`status-tab${statusFilter === key ? ' active' : ''}`} onClick={() => setStatus(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="search-bar mb-2">
        <div className="search-input-wrap" style={{ flex:1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Buscar por ticket, cliente, modelo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Técnico</th>
                <th>Recibido</th>
                <th>Costo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="fw-600 text-mono text-accent">{r.ticket_number}</div>
                    {r.priority === 'urgente' && (
                      <span className="badge badge-danger" style={{ fontSize:'0.65rem' }}>URGENTE</span>
                    )}
                  </td>
                  <td>
                    <div className="fw-600">{r.client_name || 'Sin cliente'}</div>
                    <div style={{ fontSize:'0.73rem', color:'var(--text2)' }}>{r.client_phone}</div>
                  </td>
                  <td>
                    <div className="fw-600">{r.device_brand} {r.device_model}</div>
                    {r.screen_size && (
                      <div style={{ fontSize:'0.73rem', color:'var(--text2)' }}>TV {r.screen_size}"</div>
                    )}
                  </td>
                  <td className="text-muted">{r.technician_name || '—'}</td>
                  <td className="text-muted">{fmt.date(r.received_at)}</td>
                  <td className="text-mono fw-600">{r.total_cost > 0 ? fmt.currency(r.total_cost) : '—'}</td>
                  <td>
                    <button
                      className={`badge status-${r.status}`}
                      style={{ cursor:'pointer', border:'none' }}
                      onClick={() => openStatus(r)}
                    >
                      {REPAIR_STATUSES[r.status]?.label || r.status}
                    </button>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'0.35rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(r)} title="Ver detalle">👁</button>
                      <button className="btn btn-purple btn-sm" onClick={() => handlePrint(r)} title="Imprimir ticket">🖨</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)} title="Editar">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {repairs.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state"><p>No hay órdenes de reparación</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear / editar */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nueva Orden de Reparación' : `Editar Orden ${selected?.ticket_number}`}
        size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando…' : modal === 'create' ? 'Crear y imprimir ticket' : 'Guardar cambios'}
          </button>
        </>}
      >
        <div className="form-grid">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select value={form.client_id} onChange={f('client_id')}>
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Técnico asignado</label>
              <select value={form.technician_id} onChange={f('technician_id')}>
                <option value="">Sin asignar</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label">Marca TV *</label>
              <input value={form.device_brand} onChange={f('device_brand')} placeholder="Samsung, LG, Sony…" />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input value={form.device_model} onChange={f('device_model')} placeholder="UN32J4300" />
            </div>
            <div className="form-group">
              <label className="form-label">Tamaño pantalla</label>
              <input value={form.screen_size} onChange={f('screen_size')} placeholder='32, 40, 55...' />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Serial</label>
              <input value={form.device_serial} onChange={f('device_serial')} placeholder="Número de serie" />
            </div>
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select value={form.priority} onChange={f('priority')}>
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problema reportado *</label>
            <textarea value={form.problem_desc} onChange={f('problem_desc')} rows={3} placeholder="Describe el problema del equipo…" />
          </div>

          <div className="form-group">
            <label className="form-label">Accesorios recibidos</label>
            <input value={form.accessories} onChange={f('accessories')} placeholder="Control, base, cables…" />
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Fecha estimada entrega</label>
              <input type="date" value={form.estimated_date?.slice(0,10) || ''} onChange={f('estimated_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">Anticipo recibido</label>
              <input type="number" value={form.advance_payment} onChange={f('advance_payment')} placeholder="0" />
            </div>
          </div>

          {modal === 'edit' && <>
            <div className="form-group">
              <label className="form-label">Diagnóstico técnico</label>
              <textarea value={form.diagnosis || ''} onChange={f('diagnosis')} rows={2} placeholder="Diagnóstico del técnico…" />
            </div>
            <div className="form-group">
              <label className="form-label">Trabajo realizado</label>
              <textarea value={form.work_done || ''} onChange={f('work_done')} rows={2} placeholder="Descripción del trabajo…" />
            </div>
            <div className="form-group">
              <label className="form-label">Repuestos usados</label>
              <input value={form.parts_used || ''} onChange={f('parts_used')} placeholder="Lista de repuestos utilizados" />
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Costo mano de obra</label>
                <input type="number" value={form.labor_cost || 0} onChange={f('labor_cost')} />
              </div>
              <div className="form-group">
                <label className="form-label">Costo repuestos</label>
                <input type="number" value={form.parts_cost || 0} onChange={f('parts_cost')} />
              </div>
            </div>
          </>}

          <div className="form-group">
            <label className="form-label">Notas adicionales</label>
            <input value={form.notes || ''} onChange={f('notes')} placeholder="Notas internas…" />
          </div>
        </div>
      </Modal>

      {/* Modal cambio de estado */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title={`Cambiar estado — ${selected?.ticket_number}`}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setStatusModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleStatus} disabled={loading}>
            {loading ? '…' : 'Actualizar estado'}
          </button>
        </>}
      >
        <div className="form-grid" style={{ gap:'1rem' }}>
          <div className="status-selector">
            {STATUS_LIST.map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                className={`status-option${newStatus === key ? ' active' : ''} status-${key}`}
                onClick={() => setNewStatus(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Comentario</label>
            <textarea value={statusComment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Detalle del cambio de estado…" />
          </div>
          {(newStatus === 'listo' || newStatus === 'entregado') && (
            <div style={{ fontSize:'0.82rem', color:'var(--accent)', background:'rgba(0,212,255,0.08)', padding:'0.6rem 0.85rem', borderRadius:'var(--radius)' }}>
              🖨 Se imprimirá el ticket automáticamente al guardar este estado.
            </div>
          )}
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal
        open={modal === 'detail'}
        onClose={() => setModal(null)}
        title={`Detalle — ${detail?.ticket_number}`}
        size="lg"
        footer={
          detail && (
            <button className="btn btn-purple" onClick={() => handlePrint(detail)}>
              🖨 Imprimir ticket
            </button>
          )
        }
      >
        {detail && (
          <div className="form-grid" style={{ gap:'0.75rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <div className="form-label">Cliente</div>
                <div className="fw-600">{detail.client_name || '—'}</div>
                {detail.client_phone && <div className="text-muted">{detail.client_phone}</div>}
              </div>
              <div>
                <div className="form-label">Equipo</div>
                <div className="fw-600">{detail.device_brand} {detail.device_model} {detail.screen_size && `(${detail.screen_size}")`}</div>
                {detail.device_serial && <div className="text-muted">Serial: {detail.device_serial}</div>}
              </div>
              <div>
                <div className="form-label">Técnico</div>
                <div>{detail.technician_name || 'Sin asignar'}</div>
              </div>
              <div>
                <div className="form-label">Estado</div>
                <span className={`badge status-${detail.status}`}>{REPAIR_STATUSES[detail.status]?.label}</span>
                {detail.priority === 'urgente' && <span className="badge badge-danger" style={{ marginLeft:'0.4rem' }}>URGENTE</span>}
              </div>
              <div>
                <div className="form-label">Problema</div>
                <div>{detail.problem_desc}</div>
              </div>
              {detail.accessories && (
                <div>
                  <div className="form-label">Accesorios</div>
                  <div>{detail.accessories}</div>
                </div>
              )}
              {detail.diagnosis && (
                <div>
                  <div className="form-label">Diagnóstico</div>
                  <div>{detail.diagnosis}</div>
                </div>
              )}
              {detail.work_done && (
                <div>
                  <div className="form-label">Trabajo realizado</div>
                  <div>{detail.work_done}</div>
                </div>
              )}
              <div>
                <div className="form-label">Costo total</div>
                <div className="fw-700 text-accent text-mono" style={{ fontSize:'1.1rem' }}>{fmt.currency(detail.total_cost)}</div>
              </div>
              <div>
                <div className="form-label">Anticipo</div>
                <div className="text-mono">{fmt.currency(detail.advance_payment)}</div>
              </div>
              {detail.total_cost > 0 && detail.advance_payment > 0 && (
                <div>
                  <div className="form-label">Saldo pendiente</div>
                  <div className="fw-700 text-warning text-mono">{fmt.currency(detail.total_cost - detail.advance_payment)}</div>
                </div>
              )}
            </div>

            {detail.history?.length > 0 && (
              <div>
                <div className="form-label mb-1">Historial de estados</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                  {detail.history.map(h => (
                    <div key={h.id} style={{ fontSize:'0.8rem', display:'flex', gap:'0.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
                      <span className="text-muted">{fmt.datetime(h.created_at)}</span>
                      <span className={`badge status-${h.new_status}`} style={{ fontSize:'0.68rem' }}>
                        {REPAIR_STATUSES[h.new_status]?.label || h.new_status}
                      </span>
                      {h.comment && <span className="text-muted">{h.comment}</span>}
                      <span className="text-muted">— {h.user_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal configuración impresora */}
      <PrinterSetupModal open={printerModal} onClose={() => setPrinterModal(false)} />
    </div>
  );
}
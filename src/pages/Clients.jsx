import { useState, useEffect } from 'react';
import { clientService } from '../services';
import { fmt } from '../utils/formatters';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const EMPTY = { name:'', document_type:'CC', document:'', phone:'', email:'', address:'', notes:'' };

const waLink = (phone) => {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('57') ? clean : `57${clean}`;
  return `https://wa.me/${num}`;
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => clientService.getAll({ search }).then(setClients);
  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (c) => { setSelected(c); setForm({ ...c }); setModal('edit'); };
  const openDetail = (c) => { clientService.getById(c.id).then(setDetail); setModal('detail'); };

  const handleSave = async () => {
    if (!form.name) return toast.error('El nombre es requerido');
    setLoading(true);
    try {
      if (modal === 'create') await clientService.create(form);
      else await clientService.update(selected.id, form);
      toast.success(modal === 'create' ? 'Cliente creado' : 'Cliente actualizado');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este cliente?')) return;
    await clientService.delete(id);
    toast.success('Cliente desactivado'); load();
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2>Clientes</h2><div className="page-subtitle">{clients.length} clientes activos</div></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Cliente</button>
      </div>

      <div className="search-bar mb-2">
        <div className="search-input-wrap" style={{ flex:1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Buscar por nombre, documento, teléfono…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Email</th><th className="text-right">Total compras</th><th>Acciones</th></tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td className="fw-600">{c.name}</td>
                  <td className="text-mono text-muted">{c.document_type} {c.document || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td className="text-muted">{c.email || '—'}</td>
                  <td className="text-right text-mono fw-600 text-accent">{fmt.currency(c.total_purchases)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                      {c.phone && (
                        <a
                          href={waLink(c.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                          style={{ background: '#25d366', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          title="Escribir por WhatsApp"
                        >
                          <i className="fa fa-whatsapp" style={{ fontSize: '1rem' }} />
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="btn btn-sm"
                          style={{ background: '#3b82f6', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          title="Enviar correo"
                        >
                          <i className="fa fa-envelope" style={{ fontSize: '0.9rem' }} />
                        </a>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(c)}>👁</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><p>No hay clientes</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Nombre completo *</label><input value={form.name} onChange={f('name')} placeholder="Juan Pérez" /></div>
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Tipo documento</label>
              <select value={form.document_type} onChange={f('document_type')}>
                <option value="CC">Cédula (CC)</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula extranjería</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Número documento</label><input value={form.document} onChange={f('document')} /></div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Teléfono</label><input value={form.phone} onChange={f('phone')} placeholder="+57 300 0000000" /></div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={form.email} onChange={f('email')} /></div>
          </div>
          <div className="form-group"><label className="form-label">Dirección</label><input value={form.address} onChange={f('address')} /></div>
          <div className="form-group"><label className="form-label">Notas</label><textarea value={form.notes} onChange={f('notes')} rows={2} /></div>
        </div>
      </Modal>

      {/* Detail */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={`Cliente — ${detail?.name}`} size="lg">
        {detail && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
              {[['Documento', `${detail.document_type} ${detail.document || '—'}`], ['Teléfono', detail.phone || '—'], ['Email', detail.email || '—'], ['Dirección', detail.address || '—'], ['Total compras', fmt.currency(detail.total_purchases)]].map(([k,v]) => (
                <div key={k}><div className="form-label">{k}</div><div className="fw-600">{v}</div></div>
              ))}
            </div>
            {detail.sales?.length > 0 && (
              <div>
                <div className="form-label mb-1">Últimas ventas</div>
                <table style={{ width:'100%', fontSize:'0.82rem' }}>
                  <thead><tr><th>Factura</th><th>Fecha</th><th className="text-right">Total</th><th>Estado</th></tr></thead>
                  <tbody>
                    {detail.sales.map(s => (
                      <tr key={s.id}>
                        <td className="text-mono text-accent">{s.invoice_number}</td>
                        <td className="text-muted">{fmt.date(s.created_at)}</td>
                        <td className="text-right text-mono fw-600">{fmt.currency(s.total)}</td>
                        <td><span className={`badge badge-${s.status === 'completada' ? 'success' : 'danger'}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {detail.repairs?.length > 0 && (
              <div>
                <div className="form-label mb-1">Últimas reparaciones</div>
                <table style={{ width:'100%', fontSize:'0.82rem' }}>
                  <thead><tr><th>Ticket</th><th>Equipo</th><th>Fecha</th><th>Estado</th></tr></thead>
                  <tbody>
                    {detail.repairs.map(r => (
                      <tr key={r.id}>
                        <td className="text-mono text-accent">{r.ticket_number}</td>
                        <td>{r.device_brand} {r.device_model}</td>
                        <td className="text-muted">{fmt.date(r.received_at)}</td>
                        <td><span className={`badge status-${r.status}`} style={{ fontSize:'0.68rem' }}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
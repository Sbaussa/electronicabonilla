import { useState, useEffect } from 'react';
import { supplierService } from '../services';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const EMPTY = { name:'', contact_name:'', phone:'', email:'', address:'', notes:'' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = () => supplierService.getAll().then(setSuppliers);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (s) => { setSelected(s); setForm({ ...s }); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name) return toast.error('El nombre es requerido');
    setLoading(true);
    try {
      if (modal === 'create') await supplierService.create(form);
      else await supplierService.update(selected.id, form);
      toast.success(modal === 'create' ? 'Proveedor creado' : 'Proveedor actualizado');
      setModal(null); load();
    } catch (err) { toast.error('Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar proveedor?')) return;
    await supplierService.delete(id);
    toast.success('Proveedor desactivado'); load();
  };

  const waLink = (phone) => {
    const clean = phone.replace(/\D/g, '');
    // Si empieza con 3 (Colombia sin prefijo) le añadimos 57
    const num = clean.startsWith('57') ? clean : `57${clean}`;
    return `https://wa.me/${num}`;
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2>Proveedores</h2><div className="page-subtitle">{suppliers.length} proveedores activos</div></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Proveedor</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr></thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="fw-600">{s.name}</td>
                  <td className="text-muted">{s.contact_name || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td className="text-muted">{s.email || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                      {s.phone && (
                        <a
                          href={waLink(s.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                          style={{ background: '#25d366', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          title="Escribir por WhatsApp"
                        >
                          <i className="fa fa-whatsapp" style={{ fontSize: '1rem' }} />
                        </a>
                      )}
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          className="btn btn-sm"
                          style={{ background: '#3b82f6', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          title="Enviar correo"
                        >
                          <i className="fa fa-envelope" style={{ fontSize: '0.9rem' }} />
                        </a>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state"><p>No hay proveedores</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Nombre empresa *</label><input value={form.name} onChange={f('name')} placeholder="Distribuidora de Repuestos S.A.S" /></div>
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Persona de contacto</label><input value={form.contact_name} onChange={f('contact_name')} /></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input value={form.phone} onChange={f('phone')} /></div>
          </div>
          <div className="form-group"><label className="form-label">Email</label><input type="email" value={form.email} onChange={f('email')} /></div>
          <div className="form-group"><label className="form-label">Dirección</label><input value={form.address} onChange={f('address')} /></div>
          <div className="form-group"><label className="form-label">Notas</label><textarea value={form.notes} onChange={f('notes')} rows={2} /></div>
        </div>
      </Modal>
    </div>
  );
}
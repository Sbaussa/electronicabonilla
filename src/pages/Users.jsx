import { useState, useEffect } from 'react';
import { userService } from '../services';
import { ROLES } from '../utils/formatters';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const EMPTY = { name:'', username:'', password:'', role:'vendedor' };

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [pwdForm, setPwdForm] = useState({ password:'', confirm:'' });
  const [loading, setLoading] = useState(false);

  const load = () => userService.getAll().then(setUsers);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (u) => { setSelected(u); setForm({ name: u.name, username: u.username, role: u.role, active: u.active }); setModal('edit'); };
  const openPwd    = (u) => { setSelected(u); setPwdForm({ password:'', confirm:'' }); setModal('password'); };

  const handleSave = async () => {
    if (!form.name || !form.username) return toast.error('Nombre y usuario son requeridos');
    if (modal === 'create' && !form.password) return toast.error('La contraseña es requerida');
    setLoading(true);
    try {
      if (modal === 'create') await userService.create(form);
      else await userService.update(selected.id, { name: form.name, role: form.role, active: form.active });
      toast.success(modal === 'create' ? 'Usuario creado' : 'Usuario actualizado');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const handlePwd = async () => {
    if (pwdForm.password.length < 6) return toast.error('Mínimo 6 caracteres');
    if (pwdForm.password !== pwdForm.confirm) return toast.error('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await userService.changePassword(selected.id, { password: pwdForm.password });
      toast.success('Contraseña actualizada');
      setModal(null);
    } catch (err) { toast.error('Error'); }
    finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2>Usuarios del Sistema</h2><div className="page-subtitle">{users.length} usuarios</div></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Usuario</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="fw-600">{u.name}</td>
                  <td className="text-mono text-muted">@{u.username}</td>
                  <td><span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'tecnico' ? 'purple' : 'accent'}`}>{ROLES[u.role] || u.role}</span></td>
                  <td><span className={`badge ${u.active ? 'badge-success' : 'badge-muted'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="text-muted">{new Date(u.created_at).toLocaleDateString('es-CO')}</td>
                  <td>
                    <div style={{ display:'flex', gap:'.35rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                      <button className="btn btn-warning btn-sm" onClick={() => openPwd(u)}>🔑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo Usuario' : `Editar — ${selected?.name}`}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? '…' : 'Guardar'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Nombre completo *</label><input value={form.name} onChange={f('name')} /></div>
          <div className="form-group"><label className="form-label">Usuario *</label><input value={form.username} onChange={f('username')} disabled={modal === 'edit'} /></div>
          {modal === 'create' && (
            <div className="form-group"><label className="form-label">Contraseña *</label><input type="password" value={form.password} onChange={f('password')} /></div>
          )}
          <div className="form-group"><label className="form-label">Rol</label>
            <select value={form.role} onChange={f('role')}>
              {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {modal === 'edit' && (
            <div className="form-group"><label className="form-label">Estado</label>
              <select value={form.active} onChange={e => setForm(p => ({ ...p, active: Number(e.target.value) }))}>
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={modal === 'password'} onClose={() => setModal(null)}
        title={`Cambiar contraseña — ${selected?.name}`}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-warning" onClick={handlePwd} disabled={loading}>{loading ? '…' : 'Cambiar contraseña'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Nueva contraseña</label><input type="password" value={pwdForm.password} onChange={e => setPwdForm(p => ({ ...p, password: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Confirmar contraseña</label><input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}

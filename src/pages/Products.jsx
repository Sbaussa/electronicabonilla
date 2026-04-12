import { useState, useEffect } from 'react';
import { productService, categoryService, supplierService } from '../services';
import { fmt } from '../utils/formatters';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const EMPTY = { code:'', name:'', description:'', category_id:'', supplier_id:'', purchase_price:'', sale_price:'', stock:'', min_stock:2, unit:'und', brand:'', model_compat:'' };

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [lowStock, setLowStock]   = useState(false);
  const [modal, setModal]         = useState(null); // null | 'create' | 'edit' | 'stock'
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [image, setImage]         = useState(null);
  const [stockForm, setStockForm] = useState({ quantity: '', type: 'entrada', notes: '' });
  const [loading, setLoading]     = useState(false);

  const load = () => {
    productService.getAll({ search, category_id: catFilter, low_stock: lowStock ? 1 : undefined }).then(setProducts);
  };

  useEffect(() => { load(); }, [search, catFilter, lowStock]);
  useEffect(() => {
    categoryService.getAll().then(setCategories);
    supplierService.getAll().then(setSuppliers);
  }, []);

  const openCreate = () => { setForm(EMPTY); setImage(null); setModal('create'); };
  const openEdit   = (p)  => { setSelected(p); setForm({ ...p }); setImage(null); setModal('edit'); };
  const openStock  = (p)  => { setSelected(p); setStockForm({ quantity: '', type: 'entrada', notes: '' }); setModal('stock'); };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.sale_price) return toast.error('Nombre, código y precio de venta son requeridos');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== '' && v !== null && fd.append(k, v));
      if (image) fd.append('image', image);

      if (modal === 'create') await productService.create(fd);
      else                    await productService.update(selected.id, fd);

      toast.success(modal === 'create' ? 'Producto creado' : 'Producto actualizado');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setLoading(false); }
  };

  const handleStock = async () => {
    if (!stockForm.quantity) return toast.error('Ingresa la cantidad');
    setLoading(true);
    try {
      await productService.adjustStock(selected.id, stockForm);
      toast.success('Stock ajustado');
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await productService.delete(id);
    toast.success('Producto desactivado'); load();
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div><h2>Productos & Repuestos</h2><div className="page-subtitle">{products.length} productos</div></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Producto</button>
      </div>

      {/* Filters */}
      <div className="search-bar mb-2">
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Buscar por nombre, código, marca…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:'.4rem', fontSize:'.85rem', color:'var(--text2)', cursor:'pointer' }}>
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} style={{ width:'auto' }} />
          Solo stock bajo
        </label>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Marca</th><th>Stock</th><th className="text-right">Compra</th><th className="text-right">Venta</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="text-mono text-muted">{p.code}</td>
                  <td>
                    <div className="fw-600">{p.name}</div>
                    {p.model_compat && <div style={{ fontSize:'0.72rem', color:'var(--text2)' }}>Comp: {p.model_compat}</div>}
                  </td>
                  <td><span className="badge badge-accent" style={{ fontSize:'0.72rem' }}>{p.category_name || '—'}</span></td>
                  <td className="text-muted">{p.brand || '—'}</td>
                  <td>
                    <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.min_stock ? 'badge-warning' : 'badge-success'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="text-right text-mono">{fmt.currency(p.purchase_price)}</td>
                  <td className="text-right text-mono fw-600 text-accent">{fmt.currency(p.sale_price)}</td>
                  <td>
                    <div style={{ display:'flex', gap:'.35rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openStock(p)}>📦</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><p>No hay productos</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo Producto' : 'Editar Producto'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</button>
        </>}
      >
        <div className="form-grid">
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Código *</label><input value={form.code} onChange={f('code')} placeholder="EJ-001" /></div>
            <div className="form-group"><label className="form-label">Nombre *</label><input value={form.name} onChange={f('name')} placeholder="Tarjeta principal Samsung..." /></div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group"><label className="form-label">Categoría</label>
              <select value={form.category_id} onChange={f('category_id')}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Proveedor</label>
              <select value={form.supplier_id} onChange={f('supplier_id')}>
                <option value="">Sin proveedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid form-grid-3">
            <div className="form-group"><label className="form-label">Precio compra</label><input type="number" value={form.purchase_price} onChange={f('purchase_price')} placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Precio venta *</label><input type="number" value={form.sale_price} onChange={f('sale_price')} placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Unidad</label>
              <select value={form.unit} onChange={f('unit')}>
                <option value="und">Unidad</option>
                <option value="kit">Kit</option>
                <option value="par">Par</option>
              </select>
            </div>
          </div>
          <div className="form-grid form-grid-3">
            <div className="form-group"><label className="form-label">Stock inicial</label><input type="number" value={form.stock} onChange={f('stock')} placeholder="0" /></div>
            <div className="form-group"><label className="form-label">Stock mínimo</label><input type="number" value={form.min_stock} onChange={f('min_stock')} /></div>
            <div className="form-group"><label className="form-label">Marca</label><input value={form.brand} onChange={f('brand')} placeholder="Samsung, LG, Sony..." /></div>
          </div>
          <div className="form-group"><label className="form-label">Modelos compatibles</label><input value={form.model_compat} onChange={f('model_compat')} placeholder="UN32, UN40, UN43..." /></div>
          <div className="form-group"><label className="form-label">Descripción</label><textarea value={form.description} onChange={f('description')} rows={2} /></div>
          <div className="form-group"><label className="form-label">Imagen del producto</label>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ padding:'0.4rem' }} />
          </div>
        </div>
      </Modal>

      {/* Stock Modal */}
      <Modal open={modal === 'stock'} onClose={() => setModal(null)}
        title={`Ajustar Stock — ${selected?.name}`}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleStock} disabled={loading}>{loading ? '…' : 'Aplicar'}</button>
        </>}
      >
        <div className="form-grid">
          <div style={{ background:'var(--bg3)', padding:'0.75rem 1rem', borderRadius:'var(--radius)', display:'flex', justifyContent:'space-between' }}>
            <span className="text-muted">Stock actual</span>
            <span className="fw-700 text-mono text-accent">{selected?.stock} {selected?.unit}</span>
          </div>
          <div className="form-group"><label className="form-label">Tipo de movimiento</label>
            <select value={stockForm.type} onChange={e => setStockForm(p => ({ ...p, type: e.target.value }))}>
              <option value="entrada">Entrada (agregar)</option>
              <option value="salida">Salida (restar)</option>
              <option value="ajuste">Ajuste (fijar en)</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Cantidad</label>
            <input type="number" value={stockForm.quantity} min={1} onChange={e => setStockForm(p => ({ ...p, quantity: e.target.value }))} />
          </div>
          <div className="form-group"><label className="form-label">Nota</label>
            <input value={stockForm.notes} onChange={e => setStockForm(p => ({ ...p, notes: e.target.value }))} placeholder="Motivo del ajuste..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}

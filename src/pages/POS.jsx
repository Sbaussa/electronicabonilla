import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { POSProvider, usePOS } from '../context/POSContext';
import { productService, clientService, saleService } from '../services';
import { fmt, PAYMENT_METHODS } from '../utils/formatters';
import { printSaleTicket } from '../utils/thermalPrint';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import './POS.css';

// ── Colores por marca ─────────────────────────────────────────────
const BRAND_COLORS = {
  LG:        { bg: 'rgba(168,0,45,0.15)',  color: '#e8466a' },
  SAMSUNG:   { bg: 'rgba(20,110,210,0.15)', color: '#3b9cf5' },
  PANASONIC: { bg: 'rgba(0,100,180,0.15)',  color: '#2fa4d4' },
  GENERICO:  { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  SONY:      { bg: 'rgba(0,0,0,0.2)',       color: '#a0aec0' },
};

const BRAND_ICONS = {
  LG: '📺', SAMSUNG: '📺', PANASONIC: '📺', GENERICO: '🔩', SONY: '📺',
};

const ITEMS_PER_PAGE = 40;

// ── Barcode Scanner Hook ──────────────────────────────────────────
function useBarcodeScanner(onScan) {
  const buffer = useRef('');
  const timer  = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'TEXTAREA') return;
      if (tag === 'SELECT') return;
      if (tag === 'INPUT' && !e.target.dataset.barcode) return;

      if (e.key === 'Enter') {
        if (buffer.current.length >= 3) {
          onScan(buffer.current.trim());
        }
        buffer.current = '';
        clearTimeout(timer.current);
        return;
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { buffer.current = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer.current);
    };
  }, [onScan]);
}

// ── Product Grid ──────────────────────────────────────────────────
function ProductGrid({ onAdd, allProducts }) {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [brandFilter, setBrand] = useState('');
  const [page, setPage]         = useState(1);
  const searchRef = useRef(null);

  const categories = useMemo(() => {
    return [...new Map(
      allProducts.filter(p => p.category_id)
        .map(p => [p.category_id, { id: p.category_id, name: p.category_name }])
    ).values()];
  }, [allProducts]);

  const brands = useMemo(() => {
    return [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  }, [allProducts]);

  const filtered = useMemo(() => {
    return allProducts.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q);
      const matchCat = !category || String(p.category_id) === category;
      const matchBrand = !brandFilter || p.brand === brandFilter;
      return matchSearch && matchCat && matchBrand;
    });
  }, [allProducts, search, category, brandFilter]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, category, brandFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="pos-products-panel">
      <div className="pos-search">
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            placeholder="Buscar por nombre, código o marca…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <select value={brandFilter} onChange={e => setBrand(e.target.value)} style={{ width: 'auto', minWidth: 110 }}>
          <option value="">Todas marcas</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">Categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Info bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text3)' }}>
        <span>📦 {filtered.length} productos{search || brandFilter ? ' (filtrado)' : ''}</span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            >←</button>
            <span>{page} / {totalPages}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            >→</button>
          </div>
        )}
      </div>

      <div className="product-grid">
        {paginated.map(p => {
          const bc = BRAND_COLORS[p.brand] || BRAND_COLORS.GENERICO;
          const icon = BRAND_ICONS[p.brand] || '🔩';
          return (
            <button
              key={p.id}
              className={`product-card${p.stock === 0 ? ' out-of-stock' : ''}`}
              onClick={() => p.stock > 0 && onAdd(p)}
              title={p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock} · Click para agregar`}
            >
              <div className="product-card-img" style={{ background: bc.bg }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} />
                  : <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                }
              </div>
              <div className="product-card-info">
                <div className="product-card-name">{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                  <span className="product-card-code text-mono">{p.code}</span>
                  {p.brand && (
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem',
                      borderRadius: 4, background: bc.bg, color: bc.color,
                      textTransform: 'uppercase', letterSpacing: '0.03em',
                    }}>
                      {p.brand}
                    </span>
                  )}
                </div>
                <div className="product-card-price">{fmt.currency(p.sale_price)}</div>
                <div className={`product-card-stock${p.stock <= (p.min_stock || 2) ? ' low' : ''}`}>
                  Stock: {p.stock} {p.unit || 'und'}
                </div>
              </div>
            </button>
          );
        })}
        {paginated.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cart ──────────────────────────────────────────────────────────
function Cart() {
  const { items, client, discount, subtotal, total, setClient, setDiscount, removeItem, updateQty, updatePrice, clearCart } = usePOS();
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [showClients, setShowClients]     = useState(false);
  const [payModal, setPayModal]           = useState(false);
  const [payMethod, setPayMethod]         = useState('efectivo');
  const [received, setReceived]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [lastSale, setLastSale]           = useState(null);

  const searchClient = async (q) => {
    setClientSearch(q);
    if (q.length < 2) { setClientResults([]); return; }
    const data = await clientService.getAll({ search: q });
    setClientResults(data.slice(0, 6));
    setShowClients(true);
  };

  const selectClient = (c) => { setClient(c); setClientSearch(c.name); setShowClients(false); };
  const clearClient  = () => { setClient(null); setClientSearch(''); };

  const change = received ? Math.max(0, Number(received) - total) : 0;

  const handlePay = async () => {
    if (!items.length) return toast.error('El carrito está vacío');
    setLoading(true);
    try {
      const res = await saleService.create({
        client_id: client?.id || null,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity:   i.quantity,
          unit_price: i.unit_price,
          discount:   i.discount || 0,
        })),
        discount,
        payment_method:   payMethod,
        payment_received: Number(received) || total,
      });

      const saleDetail = await saleService.getById(res.id);
      setLastSale(saleDetail);
      await printSaleTicket(saleDetail);

      toast.success(`✅ ${res.invoice_number} — Cambio: ${fmt.currency(res.change_amount || 0)}`);
      clearCart();
      setPayModal(false);
      setReceived('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!lastSale) return;
    printSaleTicket(lastSale);
  };

  return (
    <div className="pos-cart">
      {/* Client selector */}
      <div className="cart-client">
        <div style={{ position: 'relative' }}>
          <div className="search-input-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input placeholder="Buscar cliente…" value={clientSearch} onChange={e => searchClient(e.target.value)} />
          </div>
          {showClients && clientResults.length > 0 && (
            <div className="client-dropdown">
              {clientResults.map(c => (
                <div key={c.id} className="client-option" onClick={() => selectClient(c)}>
                  <span className="fw-600">{c.name}</span>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>{c.document} · {c.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {client && (
          <div className="selected-client">
            <span>👤 {client.name}</span>
            <button className="btn-icon" onClick={clearClient} style={{ fontSize: '0.9rem' }}>✕</button>
          </div>
        )}
      </div>

      {/* Última venta */}
      {lastSale && (
        <div className="last-sale-bar">
          <span>✅ Última: <b>{lastSale.invoice_number}</b></span>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Reimprimir</button>
        </div>
      )}

      {/* Items */}
      <div className="cart-items">
        {items.length === 0 && (
          <div className="empty-state">
            <span style={{ fontSize: '2.5rem' }}>🛒</span>
            <p>Selecciona productos o escanea un código</p>
          </div>
        )}
        {items.map(item => (
          <div key={item.product_id} className="cart-item">
            <div className="cart-item-name">{item.name}</div>
            <div className="cart-item-code text-mono text-muted">{item.code}</div>
            <div className="cart-item-controls">
              <div className="qty-control">
                <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                <input
                  type="number"
                  className="qty-input"
                  value={item.quantity}
                  min={1}
                  max={item.stock}
                  onChange={e => updateQty(item.product_id, Number(e.target.value))}
                />
                <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
              </div>
              <input
                type="number"
                className="price-input"
                value={item.unit_price}
                onChange={e => updatePrice(item.product_id, Number(e.target.value))}
                title="Precio unitario"
              />
              <div className="cart-item-subtotal">{fmt.currency(item.subtotal)}</div>
              <button className="btn-icon" onClick={() => removeItem(item.product_id)} style={{ color: 'var(--danger)' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="cart-totals">
        <div className="totals-row">
          <span>Subtotal</span>
          <span className="text-mono">{fmt.currency(subtotal)}</span>
        </div>
        <div className="totals-row">
          <span>Descuento</span>
          <input
            type="number"
            value={discount}
            min={0}
            onChange={e => setDiscount(Number(e.target.value))}
            style={{ width: 100, textAlign: 'right', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
          />
        </div>
        <div className="totals-row total-row">
          <span>TOTAL</span>
          <span className="text-accent text-mono">{fmt.currency(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="cart-actions">
        <button className="btn btn-secondary" onClick={clearCart}>Vaciar</button>
        <button
          className="btn btn-success btn-lg"
          style={{ flex: 1 }}
          onClick={() => setPayModal(true)}
          disabled={!items.length}
        >
          💳 Cobrar {fmt.currency(total)}
        </button>
      </div>

      {/* Payment Modal */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title="Registrar Pago"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancelar</button>
            <button className="btn btn-success btn-lg" onClick={handlePay} disabled={loading}>
              {loading ? 'Procesando…' : '✅ Confirmar y cobrar'}
            </button>
          </>
        }
      >
        <div className="form-grid" style={{ gap: '1rem' }}>
          <div className="totals-summary">
            <div className="totals-row total-row">
              <span>Total a cobrar</span>
              <span className="text-accent text-mono" style={{ fontSize: '1.5rem' }}>{fmt.currency(total)}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Método de pago</label>
            <div className="payment-methods">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={`payment-method-btn${payMethod === m.value ? ' active' : ''}`}
                  onClick={() => setPayMethod(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Valor recibido</label>
            <input
              type="number"
              value={received}
              onChange={e => setReceived(e.target.value)}
              placeholder={String(total)}
              autoFocus
            />
          </div>
          {change > 0 && (
            <div className="change-display">
              <span>💵 Cambio</span>
              <span className="text-success text-mono" style={{ fontSize: '1.3rem' }}>{fmt.currency(change)}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── POSLayout ─────────────────────────────────────────────────────
function POSLayout() {
  const { addItem } = usePOS();
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    productService.getAll({ active: 1 }).then(setAllProducts);
  }, []);

  const handleScan = useCallback((code) => {
    const product = allProducts.find(
      p => p.code === code || p.code === code.replace(/^0+/, '')
    );
    if (!product) {
      toast.error(`Código no encontrado: ${code}`, { icon: '📷' });
      return;
    }
    if (product.stock === 0) {
      toast.error(`Sin stock: ${product.name}`, { icon: '⚠️' });
      return;
    }
    addItem(product);
    toast.success(`➕ ${product.name}`, { duration: 1500 });
  }, [allProducts, addItem]);

  useBarcodeScanner(handleScan);

  return (
    <div className="pos-layout">
      <ProductGrid onAdd={addItem} allProducts={allProducts} />
      <Cart />
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────
export default function POS() {
  return (
    <POSProvider>
      <POSLayout />
    </POSProvider>
  );
}
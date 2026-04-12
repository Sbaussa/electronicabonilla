import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Landing.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_BASE.replace('/api', '/api/public') });

const SERVICES = [
  { icon: 'fa-television',    title: 'Diagnóstico',       desc: 'Revisión completa del equipo. Presupuesto sin costo.', tag: 'Gratis' },
  { icon: 'fa-wrench',        title: 'Reparación de TV',  desc: 'Samsung, LG, Sony, Hisense, TCL y más marcas.', tag: 'Garantía' },
  { icon: 'fa-desktop',       title: 'Pantallas',         desc: 'Reemplazo de paneles LED, LCD y OLED.', tag: 'Todas las pulgadas' },
  { icon: 'fa-bolt',          title: 'Fuentes de Poder',  desc: 'TV que no enciende. Tarjetas de poder y backlight.', tag: 'Especialistas' },
  { icon: 'fa-microchip',     title: 'Tarjetas Main',     desc: 'Main board, T-Con, módulos Wi-Fi y Smart TV.', tag: 'Originales' },
  { icon: 'fa-lightbulb-o',   title: 'Backlights LED',    desc: 'Tiras LED, inversores. TV con sonido pero sin imagen.', tag: 'Rápido' },
  { icon: 'fa-shopping-cart',  title: 'Venta Repuestos',  desc: 'Repuestos originales y alternativos para todas las marcas.', tag: 'Envíos' },
  { icon: 'fa-shield',        title: 'Garantía',          desc: 'Hasta 6 meses de garantía en nuestras reparaciones.', tag: '6 meses' },
];

const SERVICE_TYPES = [
  { value: 'diagnostico', label: 'Diagnóstico',     icon: 'fa-stethoscope' },
  { value: 'reparacion',  label: 'Reparación',      icon: 'fa-wrench' },
  { value: 'repuesto',    label: 'Repuesto / Pieza', icon: 'fa-cog' },
];

const STATUS_INFO = {
  recibido:           { label: 'Recibido en taller',  color: '#94a3b8', step: 1, icon: 'fa-inbox' },
  diagnostico:        { label: 'En diagnóstico',      color: '#f59e0b', step: 2, icon: 'fa-stethoscope' },
  en_reparacion:      { label: 'En reparación',       color: '#7c3aed', step: 3, icon: 'fa-wrench' },
  esperando_repuesto: { label: 'Esperando repuesto',  color: '#ef4444', step: 3, icon: 'fa-clock-o' },
  listo:              { label: 'Listo para retirar',   color: '#10b981', step: 4, icon: 'fa-check-circle' },
  entregado:          { label: 'Entregado',           color: '#00d4ff', step: 5, icon: 'fa-handshake-o' },
  no_repara:          { label: 'No tiene reparación',  color: '#6b7280', step: 5, icon: 'fa-times-circle' },
  garantia:           { label: 'En garantía',         color: '#f59e0b', step: 3, icon: 'fa-shield' },
};

const STEPS = ['Recibido', 'Diagnóstico', 'Reparación', 'Listo', 'Entregado'];

const BRAND_COLORS = {
  LG:        '#e8466a',
  SAMSUNG:   '#3b9cf5',
  PANASONIC: '#2fa4d4',
  GENERICO:  '#f59e0b',
  SONY:      '#a0aec0',
};

const fmtDate = (d) => {
  if (!d) return '---';
  try { return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return String(d); }
};

const fmtCOP = (n) => {
  if (Number(n) <= 0) return null;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
};

// ── Sección de Productos ──────────────────────────────────────────
function ProductsCatalog() {
  const [products, setProducts]   = useState([]);
  const [brands, setBrands]       = useState([]);
  const [search, setSearch]       = useState('');
  const [brand, setBrand]         = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (brand) params.brand = brand;
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setBrands(res.data.brands);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [page, search, brand]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, brand]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <section className="landing-products" id="productos">
      <div className="landing-container">
        <div className="section-header">
          <h2 className="section-title">Catálogo de Repuestos</h2>
          <p className="section-sub">Repuestos originales y alternativos para todas las marcas de televisores</p>
        </div>

        {/* Brand Pills */}
        <div className="brand-pills">
          <button className={`brand-pill${!brand ? ' active' : ''}`} onClick={() => setBrand('')}>
            Todas ({total})
          </button>
          {brands.map(b => (
            <button
              key={b.name}
              className={`brand-pill${brand === b.name ? ' active' : ''}`}
              onClick={() => setBrand(brand === b.name ? '' : b.name)}
              style={brand === b.name ? { borderColor: BRAND_COLORS[b.name] || '#00d4ff', color: BRAND_COLORS[b.name] || '#00d4ff' } : {}}
            >
              {b.name} ({b.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="catalog-search">
          <i className="fa fa-search catalog-search-icon"></i>
          <input
            placeholder="Buscar por modelo, código o referencia…  Ej: BA004, UN32J4300, LG 32"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="catalog-search-clear" onClick={() => { setSearch(''); setPage(1); }}>
              <i className="fa fa-times"></i>
            </button>
          )}
        </form>

        {/* Grid */}
        {loading ? (
          <div className="catalog-loading">
            <div className="loading-spinner"></div>
            <span>Cargando productos...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="catalog-empty">
            <i className="fa fa-search" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
            <p>No se encontraron productos{search ? ` para "${search}"` : ''}</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {products.map(p => (
              <div key={p.id} className="catalog-card">
                <div className="catalog-card-top" style={{ borderTopColor: BRAND_COLORS[p.brand] || '#00d4ff' }}>
                  <span className="catalog-card-brand" style={{ color: BRAND_COLORS[p.brand] || '#00d4ff' }}>
                    {p.brand || 'GENÉRICO'}
                  </span>
                  <span className="catalog-card-code">{p.code}</span>
                </div>
                <div className="catalog-card-body">
                  <div className="catalog-card-name">{p.name}</div>
                  {p.category && <span className="catalog-card-cat">{p.category}</span>}
                </div>
                <div className="catalog-card-footer">
                  <span className="catalog-card-price">{fmtCOP(p.sale_price)}</span>
                  <span className="catalog-card-stock">
                    <i className="fa fa-cube"></i> {p.stock} {p.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="catalog-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <i className="fa fa-chevron-left"></i> Anterior
            </button>
            <span className="catalog-page-info">Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Siguiente <i className="fa fa-chevron-right"></i>
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="catalog-cta">
          <p>¿No encuentras lo que buscas? Contáctanos y te ayudamos</p>
          <a href="https://wa.me/573000000000?text=Hola, busco un repuesto para mi TV" target="_blank" rel="noreferrer" className="btn-wa">
            <i className="fa fa-whatsapp"></i> Consultar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Página Landing Principal ──────────────────────────────────────
export default function Landing() {
  const navigate    = useNavigate();
  const [tab, setTab]           = useState('quote');
  const [ticket, setTicket]     = useState('');
  const [repair, setRepair]     = useState(null);
  const [tracking, setTracking] = useState(false);
  const [sending, setSending]   = useState(false);
  const [done, setDone]         = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '',
    device_brand: '', device_model: '', screen_size: '',
    problem_desc: '', service_type: 'reparacion',
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const resetForm = () => {
    setDone(null);
    setForm({ client_name: '', client_phone: '', client_email: '', device_brand: '', device_model: '', screen_size: '', problem_desc: '', service_type: 'reparacion' });
  };

  const handleQuote = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.client_phone || !form.device_brand || !form.problem_desc) {
      return toast.error('Completa todos los campos requeridos');
    }
    setSending(true);
    try {
      const res = await api.post('/quote', form);
      setDone(res.data.ticket_number);
      toast.success('Solicitud enviada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar');
    } finally { setSending(false); }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticket.trim()) return toast.error('Ingresa tu número de ticket');
    setTracking(true);
    try {
      const res = await api.get('/repair/' + ticket.trim());
      setRepair(res.data);
    } catch {
      toast.error('Ticket no encontrado.');
      setRepair(null);
    } finally { setTracking(false); }
  };

  // Auto-refresh repair status every 30s
  useEffect(() => {
    if (!repair) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/repair/' + repair.ticket_number);
        setRepair(res.data);
      } catch { /* silently fail */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [repair]);

  return (
    <div className="landing">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="landing-header">
        <div className="landing-container lh-inner">
          <div className="landing-brand">
            <i className="fa fa-television landing-brand-icon"></i>
            <div>
              <div className="landing-brand-name">Junior Technical Service</div>
              <div className="landing-brand-sub">Servicio Técnico y Repuestos TV</div>
            </div>
          </div>

          <nav className="landing-nav desktop-only">
            <button onClick={() => scrollTo('servicios')}>Servicios</button>
            <button onClick={() => scrollTo('productos')}>Repuestos</button>
            <button onClick={() => scrollTo('cotizar')}>Cotizar</button>
            <button onClick={() => scrollTo('rastrear')}>Rastrear</button>
          </nav>

          <div className="landing-header-actions desktop-only">
            <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-wa">
              <i className="fa fa-whatsapp"></i> WhatsApp
            </a>
            <button className="btn-admin" onClick={() => navigate('/login')}>
              <i className="fa fa-lock"></i> Admin
            </button>
          </div>

          <button className="hamburger mobile-only" onClick={() => setMenuOpen(v => !v)}>
            <i className={'fa ' + (menuOpen ? 'fa-times' : 'fa-bars')}></i>
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <button className="mobile-menu-item" onClick={() => scrollTo('servicios')}>Servicios</button>
            <button className="mobile-menu-item" onClick={() => scrollTo('productos')}>Repuestos</button>
            <button className="mobile-menu-item" onClick={() => scrollTo('cotizar')}>Cotizar</button>
            <button className="mobile-menu-item" onClick={() => scrollTo('rastrear')}>Rastrear Equipo</button>
            <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="btn-wa mobile-menu-item">
              <i className="fa fa-whatsapp"></i> WhatsApp
            </a>
            <button className="btn-admin mobile-menu-item" onClick={() => navigate('/login')}>
              <i className="fa fa-lock"></i> Administración
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-container hero-center">
          <div className="hero-badge">
            <i className="fa fa-map-marker"></i> Barranquilla, Colombia
          </div>
          <h1 className="hero-title">
            Reparamos tu TV<br />
            <span className="hero-accent">con garantía</span>
          </h1>
          <p className="hero-sub">
            Diagnóstico sin costo · Repuestos originales · Garantía hasta 6 meses
          </p>
          <div className="hero-actions">
            <button className="hero-btn-primary hero-btn-full" onClick={() => scrollTo('cotizar')}>
              <i className="fa fa-clipboard"></i> Solicitar cotización
            </button>
            <button className="hero-btn-secondary hero-btn-full" onClick={() => scrollTo('rastrear')}>
              <i className="fa fa-search"></i> Rastrear mi equipo
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">+500</span>
              <span>Equipos reparados</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">6</span>
              <span>Meses garantía</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">24h</span>
              <span>Diagnóstico</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────── */}
      <section className="landing-services" id="servicios">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Nuestros Servicios</h2>
            <p className="section-sub">Soluciones profesionales para tu televisor</p>
          </div>
          <div className="services-grid">
            {SERVICES.map(s => (
              <div key={s.title} className="service-card">
                <div className="service-card-head">
                  <i className={'fa ' + s.icon + ' service-icon'}></i>
                  <span className="service-tag">{s.tag}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS CATALOG ───────────────────────────────────── */}
      <ProductsCatalog />

      {/* ── COTIZACIÓN ─────────────────────────────────────────── */}
      <section className="landing-action" id="cotizar">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Solicitar Cotización</h2>
            <p className="section-sub">Te contactamos a la brevedad con el presupuesto</p>
          </div>

          <div className="action-panel">
            {done ? (
              <div className="done-box">
                <i className="fa fa-check-circle done-icon"></i>
                <h3>¡Solicitud enviada!</h3>
                <p>Tu número de ticket es:</p>
                <div className="done-ticket">{done}</div>
                <p className="done-hint">Guarda este número para rastrear tu equipo en tiempo real.</p>
                <div className="done-actions">
                  <button className="hero-btn-secondary" onClick={resetForm}>
                    <i className="fa fa-plus"></i> Nueva solicitud
                  </button>
                  <button className="hero-btn-primary" onClick={() => { setTicket(done); scrollTo('rastrear'); }}>
                    <i className="fa fa-search"></i> Rastrear ahora
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuote} className="quote-form">
                <div className="form-section-label">Tipo de servicio</div>
                <div className="service-type-grid">
                  {SERVICE_TYPES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      className={'service-type-btn' + (form.service_type === s.value ? ' active' : '')}
                      onClick={() => setForm(p => ({ ...p, service_type: s.value }))}
                    >
                      <i className={'fa ' + s.icon}></i> {s.label}
                    </button>
                  ))}
                </div>

                <div className="form-section-label">Tus datos</div>
                <div className="quote-grid-2">
                  <div className="q-group">
                    <label>Nombre completo *</label>
                    <input value={form.client_name} onChange={f('client_name')} placeholder="Juan Pérez" required />
                  </div>
                  <div className="q-group">
                    <label>Teléfono / WhatsApp *</label>
                    <input type="tel" value={form.client_phone} onChange={f('client_phone')} placeholder="+57 300 0000000" required />
                  </div>
                </div>
                <div className="q-group">
                  <label>Email (opcional)</label>
                  <input type="email" value={form.client_email} onChange={f('client_email')} placeholder="correo@ejemplo.com" />
                </div>

                <div className="form-section-label">Datos del equipo</div>
                <div className="q-group">
                  <label>Marca del TV *</label>
                  <input value={form.device_brand} onChange={f('device_brand')} placeholder="Samsung, LG, Sony..." required />
                </div>
                <div className="quote-grid-2">
                  <div className="q-group">
                    <label>Modelo</label>
                    <input value={form.device_model} onChange={f('device_model')} placeholder="UN32J4300" />
                  </div>
                  <div className="q-group">
                    <label>Pulgadas</label>
                    <input type="number" value={form.screen_size} onChange={f('screen_size')} placeholder="32" />
                  </div>
                </div>

                <div className="q-group">
                  <label>Describe el problema *</label>
                  <textarea
                    value={form.problem_desc}
                    onChange={f('problem_desc')}
                    rows={4}
                    placeholder="Ej: No enciende, pantalla con líneas, sin imagen pero sí sonido..."
                    required
                  />
                </div>

                <button type="submit" className="hero-btn-primary btn-block" disabled={sending}>
                  <i className="fa fa-paper-plane"></i> {sending ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── RASTREO ────────────────────────────────────────────── */}
      <section className="landing-track" id="rastrear">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Rastrear mi Equipo</h2>
            <p className="section-sub">Consulta el estado de tu reparación en tiempo real</p>
          </div>

          <div className="action-panel">
            <form onSubmit={handleTrack} className="track-form">
              <input
                value={ticket}
                onChange={e => setTicket(e.target.value.toUpperCase())}
                placeholder="REP-202604-0001"
                className="track-input"
              />
              <button type="submit" className="hero-btn-primary" disabled={tracking}>
                <i className="fa fa-search"></i> {tracking ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {repair && (
              <div className="repair-result">
                {/* Status banner */}
                <div className="repair-status-banner" style={{ borderColor: STATUS_INFO[repair.status]?.color || '#94a3b8' }}>
                  <div className="repair-status-label" style={{ color: STATUS_INFO[repair.status]?.color || '#94a3b8' }}>
                    <i className={'fa ' + (STATUS_INFO[repair.status]?.icon || 'fa-circle')}></i>
                    {STATUS_INFO[repair.status]?.label || repair.status}
                  </div>
                  <div className="repair-ticket-num">{repair.ticket_number}</div>
                  <div className="repair-live-badge">
                    <span className="live-dot"></span> Actualización en tiempo real
                  </div>
                </div>

                {/* Progress */}
                <div className="repair-progress">
                  <div className="progress-line" />
                  <div className="progress-line-fill" style={{
                    width: `${((STATUS_INFO[repair.status]?.step || 1) - 1) / (STEPS.length - 1) * 100}%`
                  }} />
                  {STEPS.map((s, i) => {
                    const step = STATUS_INFO[repair.status]?.step || 1;
                    const isDone = i + 1 <= step;
                    const isCurrent = i + 1 === step;
                    return (
                      <div key={s} className="progress-step">
                        <div className={'progress-dot' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '')}>
                          {isDone && <i className="fa fa-check" style={{ fontSize: '9px', color: '#000' }}></i>}
                        </div>
                        <div className={'progress-label' + (isDone ? ' done' : '')}>{s}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Grid */}
                <div className="repair-info-grid">
                  <div className="repair-info-item">
                    <div className="repair-info-label"><i className="fa fa-television"></i> Equipo</div>
                    <div className="repair-info-value">
                      {repair.device_brand} {repair.device_model}
                      {repair.screen_size ? ` (${repair.screen_size}")` : ''}
                    </div>
                  </div>
                  <div className="repair-info-item">
                    <div className="repair-info-label"><i className="fa fa-calendar"></i> Recibido</div>
                    <div className="repair-info-value">{fmtDate(repair.received_at)}</div>
                  </div>
                  {repair.estimated_date && (
                    <div className="repair-info-item">
                      <div className="repair-info-label"><i className="fa fa-clock-o"></i> Entrega estimada</div>
                      <div className="repair-info-value">{String(repair.estimated_date).slice(0, 10)}</div>
                    </div>
                  )}
                  {repair.technician_name && (
                    <div className="repair-info-item">
                      <div className="repair-info-label"><i className="fa fa-user"></i> Técnico</div>
                      <div className="repair-info-value">{repair.technician_name}</div>
                    </div>
                  )}
                  {repair.diagnosis && (
                    <div className="repair-info-item full-col">
                      <div className="repair-info-label"><i className="fa fa-stethoscope"></i> Diagnóstico</div>
                      <div className="repair-info-value">{repair.diagnosis}</div>
                    </div>
                  )}
                  {repair.work_done && (
                    <div className="repair-info-item full-col">
                      <div className="repair-info-label"><i className="fa fa-check-square"></i> Trabajo realizado</div>
                      <div className="repair-info-value">{repair.work_done}</div>
                    </div>
                  )}
                  {fmtCOP(repair.total_cost) && (
                    <div className="repair-info-item">
                      <div className="repair-info-label"><i className="fa fa-money"></i> Costo total</div>
                      <div className="repair-info-value cost-value">{fmtCOP(repair.total_cost)}</div>
                    </div>
                  )}
                  {fmtCOP(repair.advance_payment) && (
                    <div className="repair-info-item">
                      <div className="repair-info-label"><i className="fa fa-credit-card"></i> Anticipo</div>
                      <div className="repair-info-value">{fmtCOP(repair.advance_payment)}</div>
                    </div>
                  )}
                </div>

                {/* History */}
                {repair.history?.length > 0 && (
                  <div className="repair-history">
                    <div className="repair-info-label" style={{ marginBottom: '0.75rem' }}>
                      <i className="fa fa-history"></i> Historial de estados
                    </div>
                    {repair.history.map((h, i) => (
                      <div key={i} className="history-item">
                        <div className="history-dot" style={{ background: STATUS_INFO[h.status]?.color || '#94a3b8' }} />
                        <div className="history-content">
                          <div className="history-status">{STATUS_INFO[h.status]?.label || h.status}</div>
                          {h.comment && <div className="history-comment">{h.comment}</div>}
                          <div className="history-date"><i className="fa fa-clock-o"></i> {fmtDate(h.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <a
                  href={'https://wa.me/573000000000?text=Hola, consulto por mi equipo con ticket ' + repair.ticket_number}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  <i className="fa fa-whatsapp"></i> Consultar por WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <i className="fa fa-television"></i> Junior Technical Service
              </div>
              <div className="footer-desc">
                Servicio técnico especializado en televisores. Barranquilla, Colombia.
              </div>
            </div>
            <div>
              <div className="footer-title">Contacto</div>
              <div><i className="fa fa-phone"></i> +57 300 0000000</div>
              <div><i className="fa fa-map-marker"></i> Barranquilla, Colombia</div>
              <div><i className="fa fa-clock-o"></i> Lun-Sáb 8am-6pm</div>
            </div>
            <div>
              <div className="footer-title">Marcas que reparamos</div>
              <div>Samsung · LG · Sony · Hisense</div>
              <div>TCL · Panasonic · Sharp · Philips</div>
            </div>
          </div>
          <div className="footer-copy">
            {new Date().getFullYear()} Junior Technical Service — Todos los derechos reservados
          </div>
        </div>
      </footer>

      {/* ── FLOATING WA BUTTON ─────────────────────────────────── */}
      <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer" className="wa-float">
        <i className="fa fa-whatsapp"></i>
      </a>
    </div>
  );
}
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV = [
  { to: '/',          icon: '📊', label: 'Dashboard' },
  { to: '/pos',       icon: '🛒', label: 'Punto de Venta' },
  { to: '/repairs',   icon: '⚙️', label: 'Reparaciones' },
  { to: '/products',  icon: '📦', label: 'Productos' },
  { to: '/clients',   icon: '👥', label: 'Clientes' },
  { to: '/sales',     icon: '💲', label: 'Ventas' },
  { to: '/suppliers', icon: '🚚', label: 'Proveedores' },
  { to: '/reports',   icon: '📄', label: 'Reportes' },
];

const ADMIN_NAV = [
  { to: '/users', icon: '👤', label: 'Usuarios' },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile = () => setOpen(false);

  return (
    <>
      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setOpen(true)}>
          <span className="hamburger-icon">☰</span>
        </button>
        <div className="mobile-topbar-brand">
          <img src="/electronicabonilla.png" alt="Logo" className="mobile-topbar-logo" />
          <span>Electrónica Bonilla</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Overlay */}
      {open && <div className="sidebar-overlay" onClick={closeMobile} />}

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/electronicabonilla.png" alt="Electrónica Bonilla" className="sidebar-logo-img" />
          <div>
            <div className="logo-name">Electrónica</div>
            <div className="logo-sub">Bonilla</div>
          </div>
          <button className="sidebar-close-btn" onClick={closeMobile}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Principal</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeMobile}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}

          {hasRole('admin') && (
            <>
              <div className="nav-section-label mt-2">Administración</div>
              {ADMIN_NAV.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeMobile}>
                  <span className="nav-icon">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}

          <div className="nav-section-label mt-2">Portal</div>
          <NavLink to="/landing" className="nav-item nav-item-landing" onClick={closeMobile}>
            <span className="nav-icon">🌐</span>
            <span>Landing Page</span>
            <span className="nav-badge">Público</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn-icon logout-btn" onClick={handleLogout} title="Cerrar sesión">⏻</button>
        </div>
      </aside>
    </>
  );
}
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const LOGO = 'public/electronicabonilla.png';

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
  { to: '/users', icon: '👤', label: 'Usuario' },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={LOGO} alt="Electrónica Bonilla" className="sidebar-logo-img" />
        <div>
          <div className="logo-name">Electrónica</div>
          <div className="logo-sub">Bonilla</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Principal</div>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}

        {hasRole('admin') && (
          <>
            <div className="nav-section-label mt-2">Administración</div>
            {ADMIN_NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
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
  );
}
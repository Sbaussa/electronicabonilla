import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar   from './components/common/Sidebar';
import Landing   from './pages/Landing';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS       from './pages/POS';
import Products  from './pages/Products';
import Repairs   from './pages/Repairs';
import Clients   from './pages/Clients';
import Sales     from './pages/Sales';
import Suppliers from './pages/Suppliers';
import Users     from './pages/Users';
import Reports   from './pages/Reports';
import './pages/Repairs.css';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text2)' }}>
      Cargando…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

function AdminOnly({ children }) {
  const { hasRole } = useAuth();
  if (!hasRole('admin')) return <Navigate to="/" replace />;
  return children;
}

const router = createBrowserRouter([
  { path: '/landing', element: <Landing /> },

  { path: '/login', element: <Login /> },

  {
    element: <ProtectedLayout />,
    children: [
      { path: '/',          element: <Dashboard /> },
      { path: '/pos',       element: <POS /> },
      { path: '/repairs',   element: <Repairs /> },
      { path: '/products',  element: <Products /> },
      { path: '/clients',   element: <Clients /> },
      { path: '/sales',     element: <Sales /> },
      { path: '/suppliers', element: <Suppliers /> },
      { path: '/reports',   element: <Reports /> },
      { path: '/users',     element: <AdminOnly><Users /></AdminOnly> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
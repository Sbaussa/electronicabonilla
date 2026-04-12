import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router';
import './styles/globals.css';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2236',
            color: '#e2e8f0',
            border: '1px solid #1e2d45',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0a0e17' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0e17' } },
        }}
      />
    </AuthProvider>
  );
}

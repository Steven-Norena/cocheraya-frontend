import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface RouteMeta {
  label: string;
  parent?: { label: string; path: string };
}

const ROUTE_MAP: Record<string, RouteMeta> = {
  '/driver/map': { label: 'Búsqueda de Cocheras' },
  '/driver/reservations': { label: 'Mis Reservas' },
  '/driver/favorites': { label: 'Cocheras Favoritas' },
  '/driver/wallet': { label: 'Mi Billetera Virtual' },
  '/host/dashboard': { label: 'Dashboard' },
  '/host/scan': { label: 'Escáner QR (Check-In/Out)' },
  '/host/spaces': { label: 'Gestionar Cocheras' },
  '/host/add-space': { 
    label: 'Registrar Cochera',
    parent: { label: 'Gestionar Cocheras', path: '/host/spaces' }
  },
  '/host/wallet': { label: 'Ganancias y Auditoría' },
  '/admin/users': { label: 'Gestión de Usuarios' },
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Match route or dynamic route like /host/edit-space/:id
  let meta: RouteMeta | undefined = ROUTE_MAP[currentPath];
  if (!meta && currentPath.startsWith('/host/edit-space/')) {
    meta = {
      label: 'Editar Cochera',
      parent: { label: 'Gestionar Cocheras', path: '/host/spaces' }
    };
  }

  if (!meta) return null;

  return (
    <nav 
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '0.75rem',
      }}
    >
      <Link 
        to="/" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: 'var(--text-muted)', 
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <Home size={14} style={{ marginRight: '0.25rem' }} />
        <span>Inicio</span>
      </Link>

      {meta.parent && (
        <>
          <ChevronRight size={12} style={{ opacity: 0.6 }} />
          <Link
            to={meta.parent.path}
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {meta.parent.label}
          </Link>
        </>
      )}

      <ChevronRight size={12} style={{ opacity: 0.6 }} />
      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{meta.label}</span>
    </nav>
  );
};

export default Breadcrumbs;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Heart, 
  Wallet, 
  Calendar, 
  LogOut, 
  PlusCircle, 
  Layers, 
  Users, 
  User,
  Scan
} from 'lucide-react';

import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { user, balance, logout } = useAuth();

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={28} style={{ color: 'var(--primary)' }} />
          <span>ParkShare</span>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            <User size={20} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.name}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {user.role}
            </span>
          </div>
        </div>

        {user.role !== 'ADMIN' && balance !== null && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
              Mi Billetera
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
              S/. {balance.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* DRIVER NAVIGATION */}
        {user.role === 'DRIVER' && (
          <>
            <NavLink 
              to="/driver/map" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <MapPin size={18} />
              Buscar Cochera
            </NavLink>
            <NavLink 
              to="/driver/reservations" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Calendar size={18} />
              Mis Reservas
            </NavLink>
            <NavLink 
              to="/driver/favorites" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Heart size={18} />
              Favoritos
            </NavLink>
            <NavLink 
              to="/driver/wallet" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Wallet size={18} />
              Billetera
            </NavLink>
          </>
        )}

        {/* HOST NAVIGATION */}
        {user.role === 'HOST' && (
          <>
            <NavLink 
              to="/host/dashboard" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Layers size={18} />
              Dashboard
            </NavLink>
            <NavLink 
              to="/host/scan" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Scan size={18} />
              Simular Escáner
            </NavLink>
            <NavLink 
              to="/host/spaces" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <MapPin size={18} />
              Mis Cocheras
            </NavLink>
            <NavLink 
              to="/host/add-space" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={18} />
              Publicar Cochera
            </NavLink>
            <NavLink 
              to="/host/wallet" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Wallet size={18} />
              Mis Ganancias
            </NavLink>
          </>
        )}

        {/* ADMIN NAVIGATION */}
        {user.role === 'ADMIN' && (
          <>
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              Gestionar Usuarios
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

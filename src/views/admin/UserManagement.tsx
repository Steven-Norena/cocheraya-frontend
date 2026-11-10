import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, UserMinus, ShieldAlert, Shield, Search, Power } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  enabled: boolean;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<AdminUser[]>('/admin/users');
      setUsers(res.data);
      setError(null);
    } catch {
      setError('No se pudo cargar el directorio de usuarios. Debes tener rol ADMIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableUser = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas deshabilitar la cuenta del usuario ${name}?`)) return;
    
    try {
      await api.patch(`/admin/users/${id}/disable`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: false } : u));
    } catch {
      setError('No se pudo deshabilitar al usuario.');
    }
  };

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2>Gestión de Usuarios (Consola de Administración)</h2>
        <p>Monitorea y deshabilita cuentas en cumplimiento con las políticas del sistema</p>
      </div>

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0, width: '180px' }}>
          <select
            className="form-input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <option value="">Todos los Roles</option>
            <option value="DRIVER">Driver (Conductores)</option>
            <option value="HOST">Host (Anfitriones)</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </div>
      </div>

      {/* USERS DIRECTORY GRID/TABLE */}
      <div className="card" style={{ minHeight: '350px' }}>
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Directorio de Usuarios</h3>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando usuarios...</p>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 2rem' }}>
            <Users size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No se encontraron usuarios con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-occupied' : u.role === 'HOST' ? 'badge-reserved' : 'badge-available'}`} style={{ fontSize: '0.7rem' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.enabled ? 'badge-available' : 'badge-occupied'}`} style={{ fontSize: '0.7rem' }}>
                        {u.enabled ? 'Activo' : 'Deshabilitado'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'ADMIN' && u.enabled ? (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                          onClick={() => handleDisableUser(u.id, u.name)}
                        >
                          <Power size={14} />
                          Deshabilitar
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin acción</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import parkingService, { ParkingSpace } from '../../services/parkingService';
import reservationService, { ReservationResponse } from '../../services/reservationService';
import { MapPin, Settings, Calendar, RefreshCw, Trash2, Edit, Check, X, ShieldAlert } from 'lucide-react';

export const ManageSpaces: React.FC = () => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reservation history drawer for specific space
  const [selectedSpaceHistory, setSelectedSpaceHistory] = useState<ParkingSpace | null>(null);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const res = await parkingService.getMine();
      setSpaces(res);
      setError(null);
    } catch {
      setError('No se pudieron cargar tus cocheras.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED') => {
    try {
      await parkingService.changeAvailability(id, newStatus);
      setSpaces(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      // If we are currently viewing this space's history, reload it
      if (selectedSpaceHistory && selectedSpaceHistory.id === id) {
        fetchHistory(id);
      }
    } catch {
      setError('No se pudo actualizar la disponibilidad.');
    }
  };

  const handleDeleteSpace = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta cochera?')) return;
    try {
      await parkingService.delete(id);
      setSpaces(prev => prev.filter(s => s.id !== id));
      if (selectedSpaceHistory && selectedSpaceHistory.id === id) {
        setSelectedSpaceHistory(null);
      }
    } catch {
      setError('Error al eliminar la cochera.');
    }
  };

  const handleViewHistory = async (space: ParkingSpace) => {
    setSelectedSpaceHistory(space);
    fetchHistory(space.id);
  };

  const fetchHistory = async (spaceId: number) => {
    setLoadingHistory(true);
    try {
      const history = await reservationService.getByParkingSpace(spaceId);
      setReservations(history);
    } catch {
      setError('No se pudo cargar el historial de reservas de esta cochera.');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Gestionar Mis Cocheras</h2>
          <p>Edita detalles, administra la disponibilidad física y ve el historial de reservas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/host/add-space')}>
          Publicar Nueva Cochera
        </button>
      </div>

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando cocheras...</p>
      ) : spaces.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <MapPin size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No has publicado ninguna cochera</h3>
          <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            Empieza a generar ingresos alquilando tu espacio de estacionamiento disponible.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/host/add-space')}>
            Publicar Mi Primera Cochera
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedSpaceHistory ? '1fr 380px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* List of Cocheras */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {spaces.map((space) => (
              <div 
                key={space.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  flexWrap: 'wrap', 
                  alignItems: 'center', 
                  borderColor: selectedSpaceHistory?.id === space.id ? 'var(--primary)' : 'var(--panel-border)'
                }}
              >
                {space.photoUrl && (
                  <img 
                    src={space.photoUrl} 
                    alt={space.title} 
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                  />
                )}

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{space.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    <span>{space.address}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Precio: </span>
                      <strong style={{ color: 'var(--success)' }}>S/. {space.pricePerHour.toFixed(2)}/h</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Calificación: </span>
                      <strong>{space.averageRating ? `${space.averageRating.toFixed(1)} ★` : 'S/R'}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown Controller */}
                <div className="form-group" style={{ width: '160px', margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado Físico</label>
                  <select
                    className="form-input"
                    value={space.status}
                    onChange={(e) => handleStatusChange(space.id, e.target.value as any)}
                    style={{ padding: '0.5rem' }}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="RESERVED">Reservado</option>
                    <option value="OCCUPIED">Ocupado</option>
                  </select>
                </div>

                {/* Actions buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    title="Ver Historial"
                    onClick={() => handleViewHistory(space)}
                  >
                    <Calendar size={16} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    title="Editar Cochera"
                    onClick={() => navigate(`/host/edit-space/${space.id}`)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                    title="Eliminar Cochera"
                    onClick={() => handleDeleteSpace(space.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Reservation History Sidebar Drawer */}
          {selectedSpaceHistory && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Reservas: {selectedSpaceHistory.title}</h3>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ border: 'none', background: 'transparent' }} 
                  onClick={() => setSelectedSpaceHistory(null)}
                >
                  ✕
                </button>
              </div>

              {loadingHistory ? (
                <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando reservas...</p>
              ) : reservations.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  <ShieldAlert size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p>Aún no hay reservas registradas para esta cochera.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {reservations.map((res) => (
                    <div 
                      key={res.id}
                      style={{ 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-md)', 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid var(--panel-border)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong>{res.driver.name}</strong>
                        <span className={`badge badge-${res.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                          {res.status === 'PENDING' ? 'Pendiente' : 
                           res.status === 'ACTIVE' ? 'Ingresado' : 
                           res.status === 'FINISHED' ? 'Finalizado' : 'Cancelado'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        Fecha: {new Date(res.reservedAt).toLocaleDateString()}
                      </div>
                      {res.startTime && (
                        <div style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          Check-In: {new Date(res.startTime).toLocaleTimeString()}
                        </div>
                      )}
                      {res.endTime && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Check-Out: {new Date(res.endTime).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ManageSpaces;

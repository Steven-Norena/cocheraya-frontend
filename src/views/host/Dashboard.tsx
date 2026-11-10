import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import parkingService, { HostDashboardMetrics } from '../../services/parkingService';
import { Layers, Calendar, DollarSign, Star, TrendingUp, ArrowRight, MapPin, MessageSquare } from 'lucide-react';
import { ChatModal } from '../../components/ChatModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<HostDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatResId, setChatResId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const res = await parkingService.getHostDashboard();
      setMetrics(res);
      setError(null);
    } catch {
      setError('No se pudieron cargar las métricas del dashboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2>Dashboard del Anfitrión</h2>
        <p>Monitorea tus ingresos, reputación y rendimiento general de tus cocheras</p>
      </div>

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando métricas del dashboard...</p>
      ) : !metrics ? (
        <p style={{ textAlign: 'center' }}>No hay métricas disponibles.</p>
      ) : (
        <>
          {/* STATS ROW */}
          <div className="dashboard-grid">
            {/* Stat 1 */}
            <div className="card stat-card">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ganancias Totales</span>
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  S/. {metrics.totalEarnings.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--secondary)' }}>
                <Calendar size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reservas Finalizadas</span>
                <div className="stat-value">{metrics.completedReservations}</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning)' }}>
                <Star size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Calificación Promedio</span>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : 'S/R'}
                  {metrics.averageRating > 0 && <Star size={18} fill="var(--warning)" stroke="var(--warning)" />}
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--primary)' }}>
                <MapPin size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mis Cocheras</span>
                <div className="stat-value">{metrics.totalParkingSpaces}</div>
              </div>
            </div>
          </div>

          {/* MAIN COLUMN SPLIT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Recent History / Activity */}
            <div className="card" style={{ minHeight: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Actividad Reciente</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/host/spaces')}>
                  Gestionar Cocheras
                  <ArrowRight size={14} />
                </button>
              </div>

              {(() => {
                const activeOrRecent = (metrics.recentReservations || []).filter((item: any) => {
                  if (item.status === 'PENDING' || item.status === 'ACTIVE') return true;
                  if (item.status === 'FINISHED' && item.endTime) {
                    const diffMs = Date.now() - new Date(item.endTime).getTime();
                    return diffMs <= 10 * 60 * 1000; // 10 minutes limit
                  }
                  return false;
                });

                if (activeOrRecent.length === 0) {
                  return (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4.5rem 2rem' }}>
                      <TrendingUp size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                      <p>No hay cocheras en uso o reservadas en este momento.</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Las cocheras finalizadas se retiran de este panel después de 10 minutos.
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Cochera</th>
                          <th>Conductor</th>
                          <th>Fecha de Solicitud</th>
                          <th>Tarifa</th>
                          <th>Estado / Proceso</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeOrRecent.map((item: any, index: number) => {
                          const statusColors: Record<string, string> = {
                            PENDING: 'var(--warning)',
                            ACTIVE: 'var(--primary)',
                            FINISHED: 'var(--success)'
                          };
                          const statusLabels: Record<string, string> = {
                            PENDING: 'Reservado',
                            ACTIVE: 'En Uso (Ocupado)',
                            FINISHED: 'Finalizado Reciente'
                          };
                          
                          return (
                            <tr key={index}>
                              <td style={{ fontWeight: 600 }}>{item.parkingSpaceTitle || 'Cochera'}</td>
                              <td>{item.driverName || 'Conductor'}</td>
                              <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('es-PE', { hour12: true }) : 'N/A'}</td>
                              <td style={{ fontWeight: 700 }}>
                                S/. {item.pricePerHour !== undefined ? item.pricePerHour.toFixed(2) : '0.00'}/h
                              </td>
                              <td>
                                <span 
                                  className={`badge badge-${item.status.toLowerCase()}`}
                                  style={{ 
                                    border: `1px solid ${statusColors[item.status] || 'gray'}`,
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {statusLabels[item.status] || item.status}
                                </span>
                              </td>
                              <td>
                                {(item.status === 'PENDING' || item.status === 'ACTIVE') && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                                    onClick={() => {
                                      setChatResId(item.reservationId);
                                      setShowChatModal(true);
                                    }}
                                  >
                                    <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                                    Chat
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Quick Actions Panel */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3>Acciones Rápidas</h3>
              <p style={{ fontSize: '0.9rem' }}>Atajos para gestionar tus espacios publicitados</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => navigate('/host/add-space')}
                >
                  <MapPin size={18} />
                  Publicar una Nueva Cochera
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => navigate('/host/spaces')}
                >
                  <Layers size={18} />
                  Ver Estado de Mis Cocheras
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => navigate('/host/wallet')}
                >
                  <DollarSign size={18} />
                  Ver Historial de Cobros
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* CHAT MODAL */}
      <ChatModal 
        isOpen={showChatModal} 
        onClose={() => setShowChatModal(false)} 
        reservationId={chatResId} 
        title="Chat con Conductor" 
      />
    </div>
  );
};

export default Dashboard;

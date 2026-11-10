import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import reservationService, { ReservationResponse, QRResponse } from '../../services/reservationService';
import reviewService from '../../services/reviewService';
import { Calendar, QrCode, AlertCircle, Clock, CheckCircle, ShieldAlert, Sparkles, Star, MessageSquare } from 'lucide-react';
import { ChatModal } from '../../components/ChatModal';

export const Reservations: React.FC = () => {
  const { refreshBalance } = useAuth();
  
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Active QR state
  const [qrCodeData, setQrCodeData] = useState<QRResponse | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewResId, setReviewResId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simMsg, setSimMsg] = useState<string | null>(null);

  // Chat State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatResId, setChatResId] = useState<number | null>(null);

  const handleGenerateQr = async (id: number) => {
    setGeneratingQr(true);
    setError(null);
    try {
      const qr = await reservationService.generateQr(id);
      setQrCodeData(qr);
    } catch (err: any) {
      setError('Error al generar código QR para la reserva.');
    } finally {
      setGeneratingQr(false);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationService.getMyReservations();
      // Sort: active ones first, then most recent reservedAt
      const sorted = res.sort((a, b) => {
        const aActive = a.status === 'PENDING' || a.status === 'ACTIVE' ? 1 : 0;
        const bActive = b.status === 'PENDING' || b.status === 'ACTIVE' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime();
      });
      setReservations(sorted);
      setError(null);

      // Auto-load QR and simulation code if an active or pending reservation exists
      const active = sorted.find(r => r.status === 'PENDING' || r.status === 'ACTIVE');
      if (active) {
        handleGenerateQr(active.id);
      }
    } catch {
      setError('No se pudo cargar el historial de reservas.');
    } finally {
      setLoading(false);
    }
  };

  const pollReservations = async () => {
    try {
      const res = await reservationService.getMyReservations();
      const sorted = res.sort((a, b) => {
        const aActive = a.status === 'PENDING' || a.status === 'ACTIVE' ? 1 : 0;
        const bActive = b.status === 'PENDING' || b.status === 'ACTIVE' ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime();
      });

      setReservations(prev => {
        const prevActive = prev.find(r => r.status === 'PENDING' || r.status === 'ACTIVE');
        const newActive = sorted.find(r => r.status === 'PENDING' || r.status === 'ACTIVE');
        
        const statusChanged = 
          prevActive?.status !== newActive?.status || 
          prevActive?.id !== newActive?.id ||
          prev.length !== sorted.length;

        if (statusChanged) {
          if (newActive && prevActive?.status === 'PENDING' && newActive.status === 'ACTIVE') {
            handleGenerateQr(newActive.id);
          }
          refreshBalance();
          return sorted;
        }
        return prev;
      });
    } catch (err) {
      console.error('Silent status poll failed', err);
    }
  };

  // Poll intervals for automatic check-in/out updates from the host
  useEffect(() => {
    fetchReservations();

    const interval = setInterval(() => {
      pollReservations();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    try {
      await reservationService.cancel(id);
      setQrCodeData(null);
      fetchReservations();
      refreshBalance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cancelar la reserva.');
    }
  };

  // Check-In Simulator
  const simulateCheckIn = async (code: string) => {
    setSimulating(true);
    setSimMsg(null);
    try {
      const res = await reservationService.checkIn(code);
      setSimMsg(`✓ Check-In Exitoso: ${res.message}`);
      setQrCodeData(null); // Clear QR after check-in
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en la simulación de Check-In.');
    } finally {
      setSimulating(false);
    }
  };

  // Check-Out Simulator
  const simulateCheckOut = async (code: string) => {
    setSimulating(true);
    setSimMsg(null);
    try {
      const res = await reservationService.checkOut(code);
      setSimMsg(
        `✓ Check-Out Exitoso! Duración: ${res.durationMinutes} min. Costo: S/. ${res.totalCharged.toFixed(2)}. Saldo restante: S/. ${res.remainingBalance.toFixed(2)}`
      );
      setQrCodeData(null);
      fetchReservations();
      refreshBalance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en la simulación de Check-Out.');
    } finally {
      setSimulating(false);
    }
  };

  // Open Review modal
  const openReviewModal = (reservationId: number) => {
    setReviewResId(reservationId);
    setRating(5);
    setComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewResId) return;

    setSubmittingReview(true);
    setError(null);
    try {
      await reviewService.create({
        reservationId: reviewResId,
        rating,
        comment
      });
      setShowReviewModal(false);
      setReviewResId(null);
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo publicar la reseña.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Active reservation helper
  const activeReservation = reservations.find(r => r.status === 'PENDING' || r.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2>Mis Reservas</h2>
        <p>Controla tus reservas activas, genera códigos QR y gestiona tu historial</p>
      </div>

      {simMsg && (
        <div className="dev-banner" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)' }}>
          <span>{simMsg}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--success)' }} onClick={() => setSimMsg(null)}>✕</button>
        </div>
      )}

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ACTIVE RESERVATION VIEW */}
      {activeReservation ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 450px)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Details Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={22} style={{ color: 'var(--warning)' }} />
                Reserva en Progreso
              </h3>
              <span className={`badge badge-${activeReservation.status.toLowerCase()}`}>
                {activeReservation.status === 'PENDING' ? 'Pendiente de Ingreso' : 'Vehículo Ingresado'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Cochera</span>
                <span style={{ fontWeight: 700 }}>{activeReservation.parkingSpace.title}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Precio</span>
                <span style={{ fontWeight: 700 }}>S/. {activeReservation.parkingSpace.pricePerHour.toFixed(2)}/h</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Dirección</span>
                <p style={{ fontSize: '0.85rem' }}>{activeReservation.parkingSpace.address}</p>
              </div>
            </div>

            {activeReservation.status === 'PENDING' && activeReservation.expiresAt && (
              <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Tiempo límite para ingresar:
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {new Date(activeReservation.expiresAt).toLocaleTimeString()}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Si no ingresas antes de esta hora, la reserva expirará automáticamente y el espacio se liberará.
                </p>
              </div>
            )}

            {activeReservation.startTime && (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Hora de Ingreso (Check-In):
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  {new Date(activeReservation.startTime).toLocaleTimeString()}
                </span>
              </div>
            )}

            {activeReservation.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleCancelReservation(activeReservation.id)}
                  style={{ flex: 1 }}
                >
                  Cancelar Reserva
                </button>
                
                {!qrCodeData && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleGenerateQr(activeReservation.id)}
                    disabled={generatingQr}
                    style={{ flex: 1.5 }}
                  >
                    <QrCode size={18} />
                    {generatingQr ? 'Generando...' : 'Generar Código QR'}
                  </button>
                )}
              </div>
            )}

            {activeReservation.status === 'ACTIVE' && !qrCodeData && (
              <button 
                className="btn btn-primary" 
                onClick={() => handleGenerateQr(activeReservation.id)}
                disabled={generatingQr}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                <QrCode size={18} />
                {generatingQr ? 'Generando...' : 'Generar QR para Salida'}
              </button>
            )}

            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setChatResId(activeReservation.id);
                setShowChatModal(true);
              }}
              style={{ marginTop: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              Chat con Anfitrión
            </button>
          </div>

          {/* QR Display & Simulation Box */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '350px', justifyContent: 'center', textAlign: 'center' }}>
            {qrCodeData ? (
              <>
                <h4>Código QR Generado</h4>
                <p style={{ fontSize: '0.85rem' }}>Muestra este código en la entrada o salida de la cochera</p>
                
                <div className="qr-box">
                  <img src={`data:image/png;base64,${qrCodeData.qrImageBase64}`} alt="Check-in/out QR Code" />
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Código de Simulación:</span>
                    <code style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      userSelect: 'all',
                      wordBreak: 'break-all',
                      color: 'var(--primary)'
                    }}>
                      {qrCodeData.code}
                    </code>
                    <button 
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(qrCodeData.code);
                        alert('¡Código copiado al portapapeles!');
                      }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                    >
                      Copiar Código
                    </button>
                  </div>
                </div>

                {/* Developer Simulation buttons */}
                <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px dashed var(--warning)', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    💻 Simulador para Calificar / Evaluar
                  </span>
                  
                  {activeReservation.status === 'PENDING' ? (
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => simulateCheckIn(qrCodeData.code)}
                      disabled={simulating}
                    >
                      {simulating ? 'Procesando...' : 'Simular Escaneo: Hacer Check-In'}
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', background: 'var(--secondary)' }}
                      onClick={() => simulateCheckOut(qrCodeData.code)}
                      disabled={simulating}
                    >
                      {simulating ? 'Procesando...' : 'Simular Escaneo: Hacer Check-Out'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>
                <QrCode size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h4>Sin código QR generado</h4>
                <p style={{ fontSize: '0.85rem' }}>
                  {activeReservation.status === 'PENDING' 
                    ? 'Presiona "Generar Código QR" para obtener tu ticket de ingreso.' 
                    : 'Genera el código QR para presentarlo y registrar tu salida.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No tienes reservas activas</h3>
          <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            Explora el mapa para buscar cocheras disponibles cerca de ti y aparta tu estacionamiento en segundos.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/driver/map'}>
            Buscar Cochera en el Mapa
          </button>
        </div>
      )}

      {/* RESERVATIONS HISTORY LIST */}
      <div className="card">
        <h3 className="card-title">Historial de Reservas</h3>
        
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando reservas...</p>
        ) : reservations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No tienes reservas previas registradas.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cochera</th>
                  <th>Fecha</th>
                  <th>Costo Estimado</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600 }}>{res.parkingSpace.title}</td>
                    <td>{new Date(res.reservedAt).toLocaleDateString()} {new Date(res.reservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>S/. {res.parkingSpace.pricePerHour.toFixed(2)}/h</td>
                    <td>
                      <span className={`badge badge-${res.status.toLowerCase()}`}>
                        {res.status === 'PENDING' ? 'Pendiente' : 
                         res.status === 'ACTIVE' ? 'Ingresado' : 
                         res.status === 'FINISHED' ? 'Finalizado' : 
                         res.status === 'EXPIRED' ? 'Expirado' : 'Cancelado'}
                      </span>
                    </td>
                    <td>
                      {res.status === 'FINISHED' && (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                          onClick={() => openReviewModal(res.id)}
                        >
                          <Sparkles size={14} style={{ color: 'var(--warning)' }} />
                          Calificar
                        </button>
                      )}
                      {(res.status === 'PENDING' || res.status === 'ACTIVE') && (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                          onClick={() => {
                            setChatResId(res.id);
                            setShowChatModal(true);
                          }}
                        >
                          <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                          Chat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Calificar Cochera</h3>
              <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent' }} onClick={() => setShowReviewModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ alignItems: 'center' }}>
                <span className="form-label" style={{ marginBottom: '0.25rem' }}>¿Qué puntuación le das?</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                      onClick={() => setRating(starVal)}
                    >
                      <Star 
                        size={32} 
                        fill={starVal <= rating ? 'var(--warning)' : 'transparent'} 
                        stroke="var(--warning)" 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="comment">Comentario / Opinión</label>
                <textarea
                  id="comment"
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Excelente cochera, muy segura y bien techada. Recomendado."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem' }}
                disabled={submittingReview}
              >
                {submittingReview ? 'Publicando...' : 'Publicar Calificación'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      <ChatModal 
        isOpen={showChatModal} 
        onClose={() => setShowChatModal(false)} 
        reservationId={chatResId} 
        title="Chat con Anfitrión" 
      />
    </div>
  );
};

export default Reservations;

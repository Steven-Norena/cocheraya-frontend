import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, MessageSquare, Plus, Wallet } from 'lucide-react';
import parkingService, { type HostDashboardMetrics } from '../../services/parkingService';
import { formatSoles } from '../../services/presentation';
import { ChatModal } from '../../components/ChatModal';

const limaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
const statusNames = { PENDING: 'Pendiente', ACTIVE: 'En curso', FINISHED: 'Finalizada', EXPIRED: 'Expirada', CANCELLED: 'Cancelada' };

export default function Dashboard() {
  const [state, setState] = useState<HostDashboardMetrics | 'error'>();
  const [reload, setReload] = useState(0);
  const [chatId, setChatId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void parkingService.getHostDashboard(controller.signal)
      .then(metrics => {
        if (!controller.signal.aborted) setState(metrics);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('error');
      });
    return () => controller.abort();
  }, [reload]);

  const today = limaDate.format(new Date());
  const agenda = typeof state === 'object'
    ? (state.recentReservations ?? []).filter(item => item.status === 'PENDING' || item.status === 'ACTIVE' || item.createdAt?.slice(0, 10) === today)
    : [];

  return (
    <section className="host-dashboard" aria-labelledby="host-dashboard-title">
      <header className="host-dashboard-heading">
        <div><h1 id="host-dashboard-title">Panel del anfitrión</h1><p>Gestiona tus cocheras y las próximas llegadas.</p></div>
        <Link to="/host/add-space" className="btn btn-primary"><Plus size={19} aria-hidden="true" /> Publicar cochera</Link>
      </header>

      {state === 'error' ? (
        <div className="card" role="alert">
          <p>No se pudo cargar el panel.</p>
          <button className="btn btn-secondary" type="button" onClick={() => { setState(undefined); setReload(value => value + 1); }}>Reintentar</button>
        </div>
      ) : !state ? (
        <p role="status">Cargando panel…</p>
      ) : (
        <>
          <div className="dashboard-grid">
            <Link to="/host/spaces" className="card stat-card">
              <MapPin size={24} aria-hidden="true" /><div><p>Cocheras publicadas</p><strong className="stat-value">{state.totalSpaces}</strong></div>
            </Link>
            <Link to="/host/wallet" className="card stat-card">
              <Wallet size={24} aria-hidden="true" /><div><p>Ganancias totales</p><strong className="stat-value">{formatSoles(state.totalEarnings)}</strong></div>
            </Link>
            <div className="card stat-card">
              <Calendar size={24} aria-hidden="true" /><div><p>Reservas finalizadas</p><strong className="stat-value">{state.totalReservationsCompleted}</strong></div>
            </div>
          </div>
          <section className="card host-agenda" aria-label="Agenda de reservas">
            <div className="host-dashboard-heading">
              <h2>Reservas activas y de hoy</h2>
              <Link to="/host/scan" className="btn btn-secondary btn-sm">Escanear QR</Link>
            </div>
            {agenda.length === 0 ? <p>No tienes reservas activas ni actividad reciente de hoy.</p> : (
              <ul>
                {agenda.map(item => (
                  <li key={item.reservationId}>
                    <div>
                      <strong>{item.parkingSpaceTitle}</strong>
                      <p>{item.driverName} · {formatSoles(item.pricePerHour)} / h</p>
                    </div>
                    <span className={'badge badge-' + item.status.toLowerCase()}>{statusNames[item.status]}</span>
                    {(item.status === 'PENDING' || item.status === 'ACTIVE') && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChatId(item.reservationId)}>
                        <MessageSquare size={15} aria-hidden="true" /> Chat
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <ChatModal isOpen={chatId !== null} onClose={() => setChatId(null)} reservationId={chatId} title="Chat con conductor" />
    </section>
  );
}

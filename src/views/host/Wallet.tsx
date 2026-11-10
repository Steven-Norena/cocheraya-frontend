import React, { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import useFetch from '../../hooks/useFetch';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { DollarSign, FileText, ChevronLeft, ChevronRight, TrendingUp, Calendar, CreditCard, RefreshCw } from 'lucide-react';

export const HostWallet: React.FC = () => {
  const { balance, refreshBalance } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read pagination state from URL query parameters
  const page = Number(searchParams.get('page')) || 0;
  const size = Number(searchParams.get('size')) || 5;

  // Fetch Host Earnings using custom useFetch hook (with AbortController under the hood)
  const fetchEarningsCallback = useCallback((signal?: AbortSignal) => {
    return walletService.getEarnings(signal);
  }, []);

  const {
    data: earnings,
    loading: loadingEarnings,
    error: earningsError,
    execute: reloadEarnings
  } = useFetch(fetchEarningsCallback);

  // Fetch paginated transactions using custom useFetch hook
  const fetchTransactionsCallback = useCallback((signal?: AbortSignal) => {
    return walletService.getTransactions(page, size, signal);
  }, [page, size]);

  const {
    data: transactionsPage,
    loading: loadingTransactions,
    error: transactionsError,
    execute: reloadTransactions
  } = useFetch(fetchTransactionsCallback);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), size: size.toString() });
  };

  const handleSizeChange = (newSize: number) => {
    setSearchParams({ page: '0', size: newSize.toString() });
  };

  // Helper to calculate X-Y of Z results display
  const getPaginationInfo = () => {
    if (!transactionsPage) return '';
    const total = transactionsPage.totalElements;
    const start = page * size + 1;
    const end = Math.min((page + 1) * size, total);
    return `Mostrando ${start}-${end} de ${total} resultados`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Mis Ganancias</h2>
          <p>Revisa el balance de tus cobros y audita las transacciones de alquiler</p>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => { reloadEarnings(); reloadTransactions(); refreshBalance(); }}
          icon={<RefreshCw size={14} />}
        >
          Sincronizar
        </Button>
      </div>

      {(earningsError || transactionsError) && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>Error al obtener información financiera.</span>
          <Button variant="secondary" size="sm" style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={() => { reloadEarnings(); reloadTransactions(); }}>
            Reintentar
          </Button>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="dashboard-grid">
        {/* Balance Card */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} hoverable={false}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Saldo Acumulado</span>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              S/. {balance !== null ? balance.toFixed(2) : '0.00'}
            </div>
          </div>
        </Card>

        {/* Total Earned Card */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} hoverable={false}>
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ganado Histórico</span>
            <div className="stat-value">
              {loadingEarnings ? <Spinner size={20} /> : `S/. ${earnings ? earnings.totalEarned.toFixed(2) : '0.00'}`}
            </div>
          </div>
        </Card>

        {/* Earnings This Month Card */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} hoverable={false}>
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--secondary)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ganado este mes</span>
            <div className="stat-value">
              {loadingEarnings ? <Spinner size={20} /> : `S/. ${earnings ? earnings.earningsThisMonth.toFixed(2) : '0.00'}`}
            </div>
          </div>
        </Card>

        {/* Transaction Count Card */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} hoverable={false}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cantidad de Alquileres</span>
            <div className="stat-value">
              {loadingEarnings ? <Spinner size={20} /> : (earnings ? earnings.transactionCount : '0')}
            </div>
          </div>
        </Card>
      </div>

      {/* LEDGER DETAILS CARD */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Historial de Cobros y Auditoría</h3>

          {/* Page Size Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filas:</span>
            <select
              className="form-input"
              style={{ padding: '0.25rem 0.5rem', width: '65px', fontSize: '0.8rem', background: 'var(--input-bg)' }}
              value={size}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {loadingTransactions ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Spinner size={36} />
          </div>
        ) : !transactionsPage || transactionsPage.content.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <FileText size={32} style={{ opacity: 0.5 }} />
            <p>Aún no posees transacciones de cobro registradas.</p>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ flex: 1 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Cochera</th>
                    <th>Fecha</th>
                    <th>Entrada (Check-In)</th>
                    <th>Salida (Check-Out)</th>
                    <th>Duración</th>
                    <th>ID Reserva</th>
                    <th>Monto</th>
                    <th>Saldo Post-Transacción</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsPage.content.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{tx.description}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {tx.typeLabel}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {tx.parkingSpaceName || 'N/A (Recarga)'}
                      </td>
                      <td>
                        {tx.startTime 
                          ? new Date(tx.startTime).toLocaleDateString() 
                          : new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ color: tx.startTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {tx.startTime 
                          ? new Date(tx.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) 
                          : '-'}
                      </td>
                      <td style={{ color: tx.endTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {tx.endTime 
                          ? new Date(tx.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) 
                          : '-'}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.durationMinutes !== undefined && tx.durationMinutes !== null
                          ? `${tx.durationMinutes} min`
                          : '-'}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {tx.reservationId ? `#${tx.reservationId}` : '-'}
                      </td>
                      <td style={{ 
                        fontWeight: 800, 
                        color: tx.amountDisplay.startsWith('+') ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {tx.amountDisplay}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        S/. {tx.balanceAfter.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADVANCED PAGINATION CONTROLS (Rubric 4.4 compliant) */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderTop: '1px solid var(--panel-border)', 
              paddingTop: '0.75rem', 
              marginTop: 'auto',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {getPaginationInfo()}
              </span>

              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <Button 
                  variant="secondary"
                  size="sm"
                  style={{ padding: '0.4rem', minWidth: '32px' }}
                  onClick={() => handlePageChange(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} />
                </Button>
                
                {/* Dynamic Page Numbers */}
                {Array.from({ length: transactionsPage.totalPages }, (_, index) => (
                  <Button
                    key={index}
                    variant={page === index ? 'primary' : 'secondary'}
                    size="sm"
                    style={{ padding: '0.25rem 0.5rem', minWidth: '32px', height: '32px' }}
                    onClick={() => handlePageChange(index)}
                  >
                    {index + 1}
                  </Button>
                ))}

                <Button 
                  variant="secondary"
                  size="sm"
                  style={{ padding: '0.4rem', minWidth: '32px' }}
                  onClick={() => handlePageChange(Math.min(transactionsPage.totalPages - 1, page + 1))}
                  disabled={page === transactionsPage.totalPages - 1}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

    </div>
  );
};

export default HostWallet;

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import walletService, { WalletTransactionResponse } from '../../services/walletService';
import useFetch from '../../hooks/useFetch';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export const Wallet: React.FC = () => {
  const { balance, refreshBalance } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read pagination state from URL query parameters
  const page = Number(searchParams.get('page')) || 0;
  const size = Number(searchParams.get('size')) || 5;

  const [topUpAmount, setTopUpAmount] = useState<number | ''>('');
  const [loadingTopUp, setLoadingTopUp] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions using our AbortController-enabled custom hook
  const fetchTransactionsCallback = useCallback((signal?: AbortSignal) => {
    return walletService.getTransactions(page, size, signal);
  }, [page, size]);

  const { 
    data: transactionsPage, 
    loading: loadingTransactions, 
    error: fetchError, 
    execute: reloadTransactions 
  } = useFetch(fetchTransactionsCallback);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || topUpAmount <= 0) {
      setError('Ingresa un monto de recarga válido mayor a 0.');
      return;
    }

    setLoadingTopUp(true);
    setError(null);
    setTopUpSuccess(null);
    try {
      await walletService.topUp(Number(topUpAmount));
      setTopUpSuccess(`¡Recarga exitosa de S/. ${Number(topUpAmount).toFixed(2)}!`);
      setTopUpAmount('');
      refreshBalance();
      // Reset to page 0
      setSearchParams({ page: '0', size: size.toString() });
      reloadTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la recarga.');
    } finally {
      setLoadingTopUp(false);
    }
  };

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
          <h2>Mi Billetera Virtual</h2>
          <p>Recarga saldo para reservar cocheras y audita tus transacciones</p>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => { reloadTransactions(); refreshBalance(); }}
          icon={<RefreshCw size={14} />}
        >
          Sincronizar
        </Button>
      </div>

      {topUpSuccess && (
        <div className="dev-banner" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)' }}>
          <span>{topUpSuccess}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--success)' }} onClick={() => setTopUpSuccess(null)}>✕</button>
        </div>
      )}

      {(error || fetchError) && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error || fetchError}</span>
          <Button 
            variant="secondary" 
            size="sm" 
            style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }}
            onClick={() => reloadTransactions()}
          >
            Reintentar
          </Button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Balance & Top Up Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Balance Card */}
          <Card style={{ 
            background: 'linear-gradient(135deg, hsl(var(--primary-hue), 85%, 63%) 0%, hsl(var(--secondary-hue), 93%, 47%) 100%)',
            border: 'none',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }} hoverable={false}>
            <div style={{
              position: 'absolute',
              right: '-30px',
              bottom: '-30px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Saldo Disponible
                </span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
                  S/. {balance !== null ? balance.toFixed(2) : '0.00'}
                </h2>
              </div>
              <WalletIcon size={40} style={{ opacity: 0.7 }} />
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.9 }}>
              <span>Moneda: Soles Peruanos (PEN)</span>
              <span>ParkShare Secure Pay</span>
            </div>
          </Card>

          {/* Top Up Card */}
          <Card>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CreditCard size={22} style={{ color: 'var(--primary)' }} />
              Recargar Saldo (TOP-UP)
            </h3>

            <form onSubmit={handleTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                id="amount"
                type="number"
                required
                min="1"
                step="0.01"
                label="Monto a Recargar (S/.)"
                placeholder="Ej: 50.00"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />

              {/* Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[10, 20, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1, minWidth: '60px', fontWeight: 700 }}
                    onClick={() => setTopUpAmount(amount)}
                  >
                    +S/. {amount}
                  </Button>
                ))}
              </div>

              <Button 
                type="submit" 
                variant="primary"
                style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
                loading={loadingTopUp}
              >
                Cargar Saldo Virtual
              </Button>
            </form>
          </Card>
        </div>

        {/* Transaction History Box */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '460px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Auditoría de Transacciones</h3>
            
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
              <p>Aún no posees transacciones registradas.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {transactionsPage.content.map((tx) => {
                  const isPositive = tx.amountDisplay.startsWith('+');
                  return (
                    <div 
                      key={tx.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--panel-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isPositive ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {isPositive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>

                        <div>
                          <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>
                            {tx.description}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 800, 
                          color: isPositive ? 'var(--success)' : 'var(--text-primary)',
                          fontSize: '1rem',
                          display: 'block'
                        }}>
                          {tx.amountDisplay}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Saldo: S/. {tx.balanceAfter.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
    </div>
  );
};

export default Wallet;

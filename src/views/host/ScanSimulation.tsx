import React, { useState } from 'react';
import reservationService, { CheckInResponse, CheckOutResponse } from '../../services/reservationService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { Scan, CheckCircle, Clock, DollarSign, RefreshCw, Key } from 'lucide-react';

export const ScanSimulation: React.FC = () => {
  const [scanMode, setScanMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success results
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null);
  const [checkOutResult, setCheckOutResult] = useState<CheckOutResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setCheckInResult(null);
    setCheckOutResult(null);

    try {
      if (scanMode === 'CHECK_IN') {
        const res = await reservationService.checkIn(code.trim());
        setCheckInResult(res);
      } else {
        const res = await reservationService.checkOut(code.trim());
        setCheckOutResult(res);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar el código. Verifica que el código no haya expirado o ya haya sido utilizado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setError(null);
    setCheckInResult(null);
    setCheckOutResult(null);
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h y ${remainingMins}m`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '650px', margin: '0 auto', width: '100%', padding: '1rem' }}>
      <div>
        <h2>Escáner Check-In / Out</h2>
        <p>Introduce el código de la reserva del conductor para simular el ingreso y salida física de tu cochera.</p>
      </div>

      {/* Mode Selector */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--panel-border)',
        borderRadius: '12px',
        padding: '0.25rem',
        gap: '0.25rem'
      }}>
        <button
          type="button"
          onClick={() => { setScanMode('CHECK_IN'); resetForm(); }}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: scanMode === 'CHECK_IN' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: scanMode === 'CHECK_IN' ? 'var(--success)' : 'var(--text-secondary)',
          }}
        >
          Ingreso (Check-In)
        </button>
        <button
          type="button"
          onClick={() => { setScanMode('CHECK_OUT'); resetForm(); }}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: scanMode === 'CHECK_OUT' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: scanMode === 'CHECK_OUT' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          Salida (Check-Out)
        </button>
      </div>

      <Card style={{ padding: '2rem', borderWidth: '1px', borderColor: 'var(--panel-border)' }} hoverable={false}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
            <Spinner size={36} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Validando firma y registrando evento criptográfico...
            </span>
          </div>
        ) : checkInResult ? (
          /* Check-In Success UI */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem'
            }}>
              <CheckCircle size={36} />
            </div>
            <h3 style={{ color: 'var(--success)' }}>¡Check-In Exitoso!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {checkInResult.message}
            </p>
            <Button
              variant="primary"
              style={{ marginTop: '1.5rem', width: '100%', maxWidth: '240px', backgroundColor: 'var(--success)' }}
              onClick={resetForm}
              icon={<RefreshCw size={16} />}
            >
              Nuevo Escaneo
            </Button>
          </div>
        ) : checkOutResult ? (
          /* Check-Out Success & Detailed Invoice UI */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem'
            }}>
              <CheckCircle size={36} />
            </div>
            <h3 style={{ color: 'var(--success)', textAlign: 'center' }}>¡Check-Out Exitoso!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-0.5rem', textAlign: 'center' }}>
              Detalle de Auditoría y Cobro de Estadía
            </p>

            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--panel-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{checkOutResult.parkingSpaceName}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reserva #{checkOutResult.reservationId}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--panel-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '0.9rem' }}>Tiempo Transcurrido</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatDuration(checkOutResult.durationMinutes)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                    <DollarSign size={16} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total Cobrado</span>
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>
                    S/. {checkOutResult.totalCharged.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Key size={16} />
                    <span style={{ fontSize: '0.9rem' }}>Saldo Conductor</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)' }}>S/. {checkOutResult.remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              style={{ marginTop: '1.5rem', width: '100%', maxWidth: '240px', backgroundColor: 'var(--success)' }}
              onClick={resetForm}
              icon={<RefreshCw size={16} />}
            >
              Finalizar y Salir
            </Button>
          </div>
        ) : (
          /* Form Input UI */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Scan size={36} style={{ color: scanMode === 'CHECK_IN' ? 'var(--success)' : 'var(--primary)' }} />
              <h4 style={{ fontSize: '1.1rem' }}>Ingresar Token de Reserva</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Copia el UUID del ticket QR del driver y pégalo aquí para procesar su {scanMode === 'CHECK_IN' ? 'ingreso' : 'salida'}.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="code-input" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Código UUID de la Reserva
              </label>
              <input
                id="code-input"
                type="text"
                className="form-control"
                placeholder="Ej: f3b9f848-12d8-4fbb-b5a1-7788aa33ddff"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  padding: '0.85rem',
                  marginTop: '0.25rem',
                  textAlign: 'center'
                }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)', margin: 0, padding: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={!code.trim()}
              style={{ width: '100%', padding: '0.85rem', fontWeight: 800, backgroundColor: scanMode === 'CHECK_IN' ? 'var(--success)' : 'var(--primary)' }}
            >
              {scanMode === 'CHECK_IN' ? 'Simular Entrada (Check-In)' : 'Simular Salida (Check-Out)'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ScanSimulation;

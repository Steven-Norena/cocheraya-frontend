import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { Compass } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100%',
    }}>
      <Card style={{ maxWidth: '420px', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '50%',
          background: 'var(--primary-glow)',
          color: 'var(--primary)',
          marginBottom: '1.5rem',
        }}>
          <Compass size={40} style={{ animation: 'spin-pulse 4s linear infinite' }} />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Página no encontrada</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          La ruta especificada no existe o no tienes autorización para acceder a ella.
        </p>
        <Button onClick={() => navigate('/login')} style={{ width: '100%' }}>
          Volver al Inicio
        </Button>
        <style>{`
          @keyframes spin-pulse {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Card>
    </div>
  );
};

export default NotFound;

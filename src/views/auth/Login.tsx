import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    let errorMsg = '';
    if (field === 'email') {
      if (!value.trim()) {
        errorMsg = 'El correo electrónico es requerido.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errorMsg = 'El correo electrónico no es válido.';
        }
      }
    } else if (field === 'password') {
      if (!value) {
        errorMsg = 'La contraseña es requerida.';
      }
    }
    setErrors(prev => ({
      ...prev,
      [field]: errorMsg
    }));
    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', password);

    if (emailErr || passwordErr) {
      return;
    }

    setLoading(true);

    try {
      const response = await login({ email, password });
      // Redirect based on role
      if (response.role === 'DRIVER') {
        navigate('/driver/map');
      } else if (response.role === 'HOST') {
        navigate('/host/dashboard');
      } else if (response.role === 'ADMIN') {
        navigate('/admin/users');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Credenciales inválidas. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            borderRadius: '50%', 
            background: 'var(--primary-glow)', 
            color: 'var(--primary)',
            marginBottom: '1rem'
          }}>
            <MapPin size={36} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>ParkShare</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Encuentra o alquila cocheras seguras</p>
        </div>

        {error && (
          <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                id="email"
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem', borderColor: errors.email ? 'var(--danger)' : undefined }}
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField('email', e.target.value);
                }}
              />
            </div>
            {errors.email && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                id="password"
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem', borderColor: errors.password ? 'var(--danger)' : undefined }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField('password', e.target.value);
                }}
              />
            </div>
            {errors.password && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>


          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" style={{ fontWeight: '600', color: 'var(--primary)' }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

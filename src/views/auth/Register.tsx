import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Lock, Mail, User as UserIcon, Phone, Car, Shield } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'HOST'>('DRIVER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    let errorMsg = '';
    if (field === 'name') {
      if (!value.trim()) {
        errorMsg = 'El nombre completo es requerido.';
      } else if (value.trim().length < 3) {
        errorMsg = 'El nombre debe tener al menos 3 caracteres.';
      }
    } else if (field === 'email') {
      if (!value.trim()) {
        errorMsg = 'El correo electrónico es requerido.';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errorMsg = 'El correo electrónico no es válido.';
        }
      }
    } else if (field === 'phone') {
      if (!value.trim()) {
        errorMsg = 'El número de celular es requerido.';
      } else {
        const phoneRegex = /^\+?[\d\s-]{9,15}$/;
        if (!phoneRegex.test(value)) {
          errorMsg = 'El número de celular no es válido (mínimo 9 dígitos).';
        }
      }
    } else if (field === 'password') {
      if (!value) {
        errorMsg = 'La contraseña es requerida.';
      } else if (value.length < 6) {
        errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
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

    const nameErr = validateField('name', name);
    const emailErr = validateField('email', email);
    const phoneErr = validateField('phone', phone);
    const passwordErr = validateField('password', password);

    if (nameErr || emailErr || phoneErr || passwordErr) {
      return;
    }

    setLoading(true);

    try {
      const response = await register({ name, email, password, phone, role });
      if (response.role === 'DRIVER') {
        navigate('/driver/map');
      } else if (response.role === 'HOST') {
        navigate('/host/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Error de registro. Por favor verifica tus datos.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
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
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Crear Cuenta</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Únete a la comunidad ParkShare</p>
        </div>

        {error && (
          <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Role selector buttons */}
          <div className="form-group">
            <span className="form-label" style={{ marginBottom: '0.5rem' }}>¿Cómo usarás ParkShare?</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className={`btn ${role === 'DRIVER' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.25rem', height: 'auto' }}
                onClick={() => setRole('DRIVER')}
              >
                <Car size={24} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Conductor</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>Quiero estacionar</span>
              </button>
              <button
                type="button"
                className={`btn ${role === 'HOST' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.25rem', height: 'auto' }}
                onClick={() => setRole('HOST')}
              >
                <Shield size={24} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Anfitrión</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>Tengo cochera</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                id="name"
                type="text"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem', borderColor: errors.name ? 'var(--danger)' : undefined }}
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateField('name', e.target.value);
                }}
              />
            </div>
            {errors.name && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

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
                placeholder="juan@correo.com"
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
            <label className="form-label" htmlFor="phone">Número de Celular</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                id="phone"
                type="tel"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem', borderColor: errors.phone ? 'var(--danger)' : undefined }}
                placeholder="+51987654321"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  validateField('phone', e.target.value);
                }}
              />
            </div>
            {errors.phone && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.phone}
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
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" style={{ fontWeight: '600', color: 'var(--primary)' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

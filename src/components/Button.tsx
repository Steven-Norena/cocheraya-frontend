import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-primary)',
          border: '1px solid var(--panel-border)',
        };
      case 'danger':
        return {
          background: 'var(--danger)',
          color: '#fff',
          border: 'none',
        };
      case 'primary':
      default:
        return {
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 14px var(--primary-glow)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' };
      case 'lg':
        return { padding: '1rem 2rem', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' };
      case 'md':
      default:
        return { padding: '0.75rem 1.5rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' };
    }
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'var(--transition-normal)',
    opacity: disabled || loading ? 0.6 : 1,
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      className={`btn ${className}`}
      style={buttonStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size={16} color="#fff" />
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;

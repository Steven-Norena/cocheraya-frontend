import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  id,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className="form-group" style={{ width: '100%' }}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`form-input ${error ? 'input-error' : ''} ${className}`}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            paddingLeft: icon ? '2.5rem' : '1rem',
            background: 'var(--input-bg)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--input-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            transition: 'var(--transition-fast)',
            outline: 'none',
            ...style,
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--danger)', 
          marginTop: '0.25rem',
          display: 'block' 
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

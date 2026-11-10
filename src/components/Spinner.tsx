import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 32, 
  color = 'var(--primary)', 
  className = '' 
}) => {
  return (
    <div 
      className={`spinner ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: '3px solid var(--panel-border)',
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin-anim 0.8s linear infinite',
        display: 'inline-block',
      }}
    >
      <style>{`
        @keyframes spin-anim {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  hoverable = true,
  className = '',
  style,
  ...props
}) => {
  const cardStyle: React.CSSProperties = {
    background: glass ? 'var(--glass-bg)' : 'var(--panel-bg)',
    backdropFilter: glass ? 'var(--glass-blur)' : 'none',
    border: '1px solid var(--panel-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md)',
    transition: 'var(--transition-normal)',
    ...style,
  };

  return (
    <div 
      className={`card ${hoverable ? 'hoverable-card' : ''} ${className}`} 
      style={cardStyle} 
      {...props}
    >
      {children}
      {!glass && hoverable && (
        <style>{`
          .hoverable-card:hover {
            border-color: var(--panel-border-hover);
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }
        `}</style>
      )}
    </div>
  );
};

export default Card;

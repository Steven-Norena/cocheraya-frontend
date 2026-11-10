import React from 'react';

interface BadgeProps {
  status: 'available' | 'reserved' | 'occupied' | 'finished' | 'pending' | 'confirmed' | 'expired' | 'cancelled' | string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  children,
  className = '',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'available':
      case 'confirmed':
      case 'active':
        return {
          background: 'var(--success-bg)',
          color: 'var(--success)',
        };
      case 'reserved':
      case 'pending':
        return {
          background: 'var(--warning-bg)',
          color: 'var(--warning)',
        };
      case 'occupied':
      case 'danger':
      case 'cancelled':
      case 'expired':
        return {
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
        };
      case 'finished':
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)',
        };
    }
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...getBadgeStyle(),
    ...style,
  };

  return (
    <span className={`badge ${className}`} style={badgeStyle}>
      {children}
    </span>
  );
};

export default Badge;

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary btn-sm"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        border: '1px solid var(--panel-border)',
        background: 'rgba(255, 255, 255, 0.03)',
      }}
      title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
    >
      {theme === 'dark' ? (
        <Sun size={18} style={{ color: 'var(--warning)' }} />
      ) : (
        <Moon size={18} style={{ color: 'var(--primary)' }} />
      )}
    </button>
  );
};

export default ThemeToggle;

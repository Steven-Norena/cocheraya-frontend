import { Calendar, Heart, LogOut, MapPin, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const destinations = [
  { path: '/driver/map', label: 'Explorar', Icon: MapPin },
  { path: '/driver/reservations', label: 'Reservas', Icon: Calendar },
  { path: '/driver/favorites', label: 'Favoritos', Icon: Heart },
  { path: '/driver/wallet', label: 'Billetera', Icon: Wallet },
];

export default function DriverNavigation() {
  const { user, logout } = useAuth();

  return (
    <header className="driver-header">
      <div className="driver-header-inner">
        <NavLink to="/driver/map" className="app-brand" aria-label="CocheraYa, inicio">
          <span aria-hidden="true">P</span> CocheraYa
        </NavLink>
        <nav aria-label="Navegación del conductor">
          {destinations.map(({ path, label, Icon }) => (
            <NavLink key={path} to={path}><Icon size={17} aria-hidden="true" /> {label}</NavLink>
          ))}
        </nav>
        <div className="driver-header-account">
          <span className="driver-header-avatar" aria-label={user?.name}>{user?.name.trim().charAt(0).toUpperCase()}</span>
          <ThemeToggle />
          <button className="btn btn-secondary btn-sm" onClick={logout} type="button" aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

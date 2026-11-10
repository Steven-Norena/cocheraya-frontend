import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import parkingService, { ParkingSpace } from '../../services/parkingService';
import { Heart, Star, MapPin, AlertCircle, ShoppingBag } from 'lucide-react';

export const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await parkingService.getFavorites();
      setFavorites(res);
      setError(null);
    } catch {
      setError('No se pudo cargar la lista de favoritos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, spaceId: number) => {
    e.stopPropagation(); // Avoid triggering card click
    try {
      await parkingService.removeFromFavorites(spaceId);
      setFavorites(prev => prev.filter(item => item.id !== spaceId));
    } catch {
      setError('No se pudo quitar de favoritos.');
    }
  };

  const handleCardClick = (spaceId: number) => {
    // Navigate back to map search and set coordinates as search focus, or simple redirect
    navigate('/driver/map');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2>Mis Cocheras Favoritas</h2>
        <p>Accede rápidamente a tus lugares de estacionamiento preferidos</p>
      </div>

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando favoritos...</p>
      ) : favorites.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Heart size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Aún no tienes favoritos</h3>
          <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            Cuando busques cocheras en el mapa, presiona el botón de corazón para guardarlas aquí y acceder rápidamente.
          </p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {favorites.map((space) => (
            <div 
              key={space.id} 
              className="card" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              onClick={() => handleCardClick(space.id)}
            >
              {space.photoUrl && (
                <img 
                  src={space.photoUrl} 
                  alt={space.title} 
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{space.title}</h3>
                <button 
                  onClick={(e) => handleRemoveFavorite(e, space.id)} 
                  className="btn btn-secondary btn-sm" 
                  style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <Heart size={16} fill="var(--danger)" stroke="var(--danger)" />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{space.address}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Precio</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>S/. {space.pricePerHour.toFixed(2)}/h</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontWeight: 600 }}>
                  <Star size={16} fill="var(--warning)" />
                  <span>{space.averageRating ? space.averageRating.toFixed(1) : 'S/R'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

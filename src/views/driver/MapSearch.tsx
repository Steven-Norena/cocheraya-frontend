import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import parkingService, { ParkingSpace } from '../../services/parkingService';
import reservationService from '../../services/reservationService';
import { Search, MapPin, Navigation, Star, Heart, Compass, ShieldAlert } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

// SVG Custom Markers for absolute bundler reliability and sleek design
const carMarkerSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#a855f7" fill-opacity="0.2" stroke="#a855f7" stroke-width="2"/>
  <circle cx="16" cy="16" r="6" fill="#a855f7"/>
</svg>
`;

const parkingMarkerSvg = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 2C10.27 2 4 8.27 4 16C4 26.5 18 34 18 34C18 34 32 26.5 32 16C32 8.27 25.73 2 18 2ZM18 10C20.21 10 22 11.79 22 14C22 16.21 20.21 18 18 18C15.79 18 14 16.21 14 14C14 11.79 15.79 10 18 10Z" fill="#10b981"/>
</svg>
`;

const currentPosIcon = L.divIcon({
  html: carMarkerSvg,
  className: 'custom-car-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const parkingIcon = L.divIcon({
  html: parkingMarkerSvg,
  className: 'custom-parking-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

// Component to dynamically change map view center
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Component to listen for drag/click actions on Leaflet Map
const MapEventsHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const MapSearch: React.FC = () => {
  const { balance } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [center, setCenter] = useState<[number, number]>([-12.1221, -77.0298]); // Miraflores default
  const [zoom, setZoom] = useState(15);
  const [radius, setRadius] = useState(2000); // in meters
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time search query with debounce
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredSpaces = spaces.filter(space => 
    space.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    space.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  // Selected space details drawer
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [reserving, setReserving] = useState(false);

  // Geolocation trigger
  const handleLocate = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
          setError(null);
          setLoading(false);
        },
        () => {
          setError('No se pudo acceder a la geolocalización. Usando ubicación predeterminada.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocalización no soportada en este navegador.');
    }
  };

  // Check active reservations and load favorites on mount
  useEffect(() => {
    handleLocate();
    checkActiveReservations();
    loadFavorites();
  }, []);

  // Fetch nearby spaces whenever center/radius changes
  useEffect(() => {
    fetchNearbySpaces();
  }, [center, radius]);

  const checkActiveReservations = async () => {
    try {
      const res = await reservationService.getMyReservations();
      const active = res.some(r => r.status === 'PENDING' || r.status === 'ACTIVE');
      setHasActiveReservation(active);
    } catch {
      setHasActiveReservation(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favList = await parkingService.getFavorites();
      setFavorites(favList.map(f => f.id));
    } catch {
      setFavorites([]);
    }
  };

  const fetchNearbySpaces = async () => {
    setLoading(true);
    try {
      const res = await parkingService.searchNearby({
        lat: center[0],
        lng: center[1],
        radius,
      });
      setSpaces(res);
      setError(null);
    } catch (err: any) {
      setError('Error al buscar cocheras cercanas.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (spaceId: number) => {
    const isFav = favorites.includes(spaceId);
    try {
      if (isFav) {
        await parkingService.removeFromFavorites(spaceId);
        setFavorites(prev => prev.filter(id => id !== spaceId));
      } else {
        await parkingService.addToFavorites(spaceId);
        setFavorites(prev => [...prev, spaceId]);
      }
    } catch {
      setError('No se pudo actualizar favoritos.');
    }
  };

  const handleReserve = async () => {
    if (!selectedSpace) return;
    if (hasActiveReservation) {
      setError('Ya tienes una reserva activa. Cancélala o termínala antes de hacer otra.');
      return;
    }
    
    // Check balance
    if (balance !== null && balance < selectedSpace.pricePerHour) {
      setError('Saldo insuficiente en tu billetera. Carga saldo antes de reservar.');
      return;
    }

    setReserving(true);
    setError(null);
    try {
      const res = await reservationService.create(selectedSpace.id);
      setSelectedSpace(null);
      // Redirect to reservations screen
      navigate('/driver/reservations', { state: { newReservation: res } });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'No se pudo completar la reserva. Intenta de nuevo.'
      );
    } finally {
      setReserving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Buscar Estacionamiento</h2>
          <p>Cocheras disponibles a tu alrededor en tiempo real</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Real-time search with debounce */}
          <div className="form-group" style={{ margin: 0, width: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por nombre o calle..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', margin: 0 }}
            />
          </div>
          <div className="form-group" style={{ margin: 0, width: '160px' }}>
            <select 
              className="form-input" 
              value={radius} 
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ padding: '0.6rem 1rem' }}
            >
              <option value={500}>Radio: 500m</option>
              <option value={1000}>Radio: 1km</option>
              <option value={2000}>Radio: 2km</option>
              <option value={5000}>Radio: 5km</option>
            </select>
          </div>
          <button onClick={handleLocate} className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }}>
            <Compass size={18} />
            Mi Ubicación
          </button>
        </div>
      </div>

      {hasActiveReservation && (
        <div className="active-res-banner" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={24} style={{ color: 'var(--warning)' }} />
            <div>
              <h4 style={{ color: 'var(--text-primary)' }}>Reserva activa en progreso</h4>
              <p style={{ fontSize: '0.85rem' }}>Tienes una reserva pendiente de Check-in o Check-out.</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/driver/reservations')}>
            Ver Mi Reserva
          </button>
        </div>
      )}

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)', margin: 0 }}>
          <span>{error}</span>
        </div>
      )}

      {/* Main Map Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSpace ? '1fr 350px' : '1fr', gap: '1.5rem', flex: 1, minHeight: '500px' }}>
        
        {/* Map Container */}
        <div className="map-container" style={{ height: '600px' }}>
          <MapContainer 
            center={center} 
            zoom={zoom} 
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            <ChangeView center={center} zoom={zoom} />
            <MapEventsHandler onMapClick={(lat, lng) => setCenter([lat, lng])} />

            {/* Current Position Marker */}
            <Marker position={center} icon={currentPosIcon}>
              <Popup>Tu ubicación de búsqueda</Popup>
            </Marker>

            {/* Parking Space Markers */}
            {filteredSpaces.map((space) => (
              <Marker 
                key={space.id} 
                position={[space.latitude, space.longitude]} 
                icon={parkingIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedSpace(space);
                  },
                }}
              >
                <Popup>
                  <div style={{ fontWeight: 700 }}>{space.title}</div>
                  <div style={{ color: 'var(--success)', fontWeight: 600 }}>S/. {space.pricePerHour.toFixed(2)}/h</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{space.address}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Selected Cochera Drawer */}
        {selectedSpace && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '1.2rem' }}>{selectedSpace.title}</h3>
              <button 
                onClick={() => setSelectedSpace(null)} 
                className="btn btn-secondary" 
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✖
              </button>
            </div>

            {selectedSpace.photoUrl && (
              <img 
                src={selectedSpace.photoUrl} 
                alt={selectedSpace.title} 
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
              />
            )}

            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge badge-${selectedSpace.status.toLowerCase()}`}>
                {selectedSpace.status === 'AVAILABLE' ? 'Disponible' : selectedSpace.status === 'RESERVED' ? 'Reservado' : 'Ocupado'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontWeight: 700 }}>
                <Star size={16} fill="var(--warning)" />
                {selectedSpace.averageRating ? selectedSpace.averageRating.toFixed(1) : 'S/R'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Precio por hora
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                S/. {selectedSpace.pricePerHour.toFixed(2)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Dirección
              </span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedSpace.address}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Descripción
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedSpace.description}</p>
            </div>

            {selectedSpace.features && selectedSpace.features.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Características
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedSpace.features.map((feat, index) => (
                    <span 
                      key={index} 
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)' }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                className={`btn ${favorites.includes(selectedSpace.id) ? 'btn-secondary' : 'btn-secondary'}`} 
                style={{ padding: '0.75rem' }} 
                onClick={() => toggleFavorite(selectedSpace.id)}
              >
                <Heart size={20} fill={favorites.includes(selectedSpace.id) ? 'var(--danger)' : 'transparent'} stroke={favorites.includes(selectedSpace.id) ? 'var(--danger)' : 'var(--text-primary)'} />
              </button>

              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleReserve}
                disabled={reserving || selectedSpace.status !== 'AVAILABLE'}
              >
                {reserving ? 'Reservando...' : selectedSpace.status !== 'AVAILABLE' ? 'No disponible' : 'Reservar ahora'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MapSearch;

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Compass, Heart, MapPin, Search, Star, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import parkingService, { type ParkingSpace } from '../../services/parkingService';
import reservationService from '../../services/reservationService';
import { distanceMeters, formatDistance, formatSoles, parkingZones } from '../../services/presentation';
import './map-search.css';

type Coordinates = [number, number];
type SearchResult = { key: string; spaces: ParkingSpace[]; failed: boolean };
type Sort = 'distance' | 'price';
const CARTO_KEY = import.meta.env.VITE_CARTO_API_KEY?.trim();
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const locationIcon = L.divIcon({ className: 'search-location-marker', iconSize: [16, 16] });

function MapCenter({ center, radius, onCenter }: {
  center: Coordinates;
  radius: number;
  onCenter: (center: Coordinates) => void;
}) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLng(center).toBounds(radius * 2), { padding: [32, 32], maxZoom: 16, animate: false });
  }, [map, center, radius]);
  useMapEvents({ click: ({ latlng }) => onCenter([latlng.lat, latlng.lng]) });
  return null;
}

function pin(space: ParkingSpace, selected: boolean) {
  const label = document.createElement('span');
  label.textContent = formatSoles(space.pricePerHour);
  return L.divIcon({
    html: label,
    className: selected ? 'search-price-pin is-selected' : 'search-price-pin',
    iconSize: [76, 32],
    iconAnchor: [38, 30],
  });
}

const normalize = (text: string) => text.toLocaleLowerCase('es-PE').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export default function MapSearch() {
  const { balance } = useAuth();
  const navigate = useNavigate();
  const rows = useRef(new Map<number, HTMLButtonElement>());
  const reservationRequest = useRef(false);
  const [center, setCenter] = useState<Coordinates>(parkingZones.Miraflores);
  const [zone, setZone] = useState('Miraflores');
  const [radius, setRadius] = useState(2000);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('distance');
  const [covered, setCovered] = useState(false);
  const [result, setResult] = useState<SearchResult>();
  const [retry, setRetry] = useState(0);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const [useFallbackTiles, setUseFallbackTiles] = useState(false);
  const [tileRetry, setTileRetry] = useState(0);
  const [locationNotice, setLocationNotice] = useState('');
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedId, setSelectedId] = useState<number>();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [activeReservation, setActiveReservation] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [lat, lng] = center;
  const searchKey = [lat, lng, radius, retry].join(',');
  const loading = result?.key !== searchKey;
  const failed = !loading && result.failed;
  const search = normalize(query.trim());

  const matches = (loading ? [] : result.spaces)
    .filter(space => space.status === 'AVAILABLE'
      && normalize(space.title + ' ' + space.address).includes(search)
      && (!covered || space.features?.some(feature => normalize(feature) === 'techado')))
    .map(space => ({ space, distance: distanceMeters(lat, lng, space.latitude, space.longitude) }))
    .sort((a, b) => sort === 'price' ? a.space.pricePerHour - b.space.pricePerHour || a.distance - b.distance : a.distance - b.distance);
  const selected = matches.find(({ space }) => space.id === selectedId)?.space;
  const carto = CARTO_KEY && !useFallbackTiles;

  useEffect(() => {
    const controller = new AbortController();
    void reservationService.getMyReservations(controller.signal)
      .then(reservations => setActiveReservation(reservations.some(item => item.status === 'PENDING' || item.status === 'ACTIVE')))
      .catch(() => undefined);
    void parkingService.getFavorites(controller.signal)
      .then(spaces => setFavorites(spaces.map(space => space.id)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void parkingService.searchNearby({ lat, lng, radius }, controller.signal)
      .then(spaces => {
        if (!controller.signal.aborted) setResult({ key: searchKey, spaces, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key: searchKey, spaces: [], failed: true });
      });
    return () => controller.abort();
  }, [lat, lng, radius, searchKey]);

  function changeCenter(next: Coordinates, label: string) {
    setCenter(next);
    setZone(label);
    setSelectedId(undefined);
    setNotice('');
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationNotice('Este navegador no ofrece ubicación. Puedes seguir buscando por zona.');
      return;
    }
    setLocating(true);
    setLocationNotice('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        changeCenter([coords.latitude, coords.longitude], 'Mi ubicación');
        setLocating(false);
      },
      () => {
        setLocationNotice('No se pudo obtener tu ubicación. Puedes seguir buscando por zona.');
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  function select(id: number, fromMap = false) {
    setSelectedId(id);
    setNotice('');
    if (fromMap) rows.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  async function toggleFavorite(space: ParkingSpace) {
    setFavoriteBusy(true);
    setNotice('');
    const isFavorite = favorites.includes(space.id);
    try {
      if (isFavorite) await parkingService.removeFromFavorites(space.id);
      else await parkingService.addToFavorites(space.id);
      setFavorites(previous => isFavorite ? previous.filter(id => id !== space.id) : [...previous, space.id]);
    } catch {
      setNotice('No se pudo actualizar la cochera favorita. Intenta de nuevo.');
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function reserve(space: ParkingSpace) {
    if (reservationRequest.current || activeReservation) return;
    if (balance !== null && balance < space.pricePerHour) {
      setNotice('Tu saldo es insuficiente. Recarga tu billetera para reservar.');
      return;
    }
    reservationRequest.current = true;
    setReserving(true);
    setNotice('');
    try {
      const reservation = await reservationService.create(space.id);
      navigate('/driver/reservations', { state: { newReservation: reservation } });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      setNotice(message || 'No se pudo completar la reserva. Intenta de nuevo.');
    } finally {
      reservationRequest.current = false;
      setReserving(false);
    }
  }

  return (
    <section className="parking-search" aria-labelledby="parking-search-title">
      <header className="parking-search-header">
        <h1 id="parking-search-title">Encuentra una cochera</h1>
        <div className="parking-search-controls">
          <label className="parking-search-query">
            <Search size={18} aria-hidden="true" />
            <input className="form-input" type="search" aria-label="Buscar por nombre o calle" placeholder="Busca por nombre o calle" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <select className="form-input" aria-label="Zona de búsqueda" value={zone} onChange={event => {
            const next = event.target.value as keyof typeof parkingZones;
            setLocationNotice('');
            changeCenter(parkingZones[next], next);
          }}>
            {!(zone in parkingZones) && <option value={zone}>{zone}</option>}
            {Object.keys(parkingZones).map(name => <option value={name} key={name}>{name}</option>)}
          </select>
          <select className="form-input" aria-label="Radio de búsqueda" value={radius} onChange={event => setRadius(Number(event.target.value))}>
            <option value={500}>Radio 500 m</option>
            <option value={1000}>Radio 1 km</option>
            <option value={2000}>Radio 2 km</option>
            <option value={5000}>Radio 5 km</option>
          </select>
          <button className="btn btn-secondary" type="button" onClick={locate} disabled={locating}>
            <Compass size={17} aria-hidden="true" /> {locating ? 'Ubicando…' : 'Mi ubicación'}
          </button>
        </div>
      </header>

      {locationNotice && <p className="parking-search-notice" role="status">{locationNotice}</p>}
      {activeReservation && (
        <div className="parking-search-notice parking-search-active">
          Tienes una reserva en curso. <Link to="/driver/reservations">Ver mi reserva</Link>
        </div>
      )}

      <div className="parking-search-layout">
        <section className="parking-results" aria-label="Cocheras disponibles">
          <div className="parking-results-header">
            <strong aria-live="polite">{loading ? 'Buscando cocheras…' : failed ? 'Cocheras' : matches.length + (matches.length === 1 ? ' cochera' : ' cocheras')}</strong>
            <select className="form-input" aria-label="Ordenar cocheras" value={sort} onChange={event => setSort(event.target.value as Sort)}>
              <option value="distance">Por cercanía</option>
              <option value="price">Menor precio</option>
            </select>
            <label className="parking-cover-filter">
              <input type="checkbox" checked={covered} onChange={event => setCovered(event.target.checked)} /> Techado
            </label>
          </div>

          {failed ? (
            <div className="parking-results-state" role="alert">
              <p>No pudimos cargar las cocheras de esta zona.</p>
              <button className="btn btn-secondary" type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button>
            </div>
          ) : !loading && matches.length === 0 ? (
            <div className="parking-results-state"><p>No hay cocheras con esos filtros. Prueba otra zona o amplía el radio.</p></div>
          ) : (
            <ul className="parking-result-list">
              {matches.map(({ space, distance }) => (
                <li key={space.id}>
                  <button
                    ref={element => {
                      if (element) rows.current.set(space.id, element);
                      else rows.current.delete(space.id);
                    }}
                    type="button"
                    className="parking-result"
                    aria-pressed={space.id === selectedId}
                    onClick={() => select(space.id)}
                  >
                    <span className="parking-result-title">{space.title}</span>
                    <strong className="parking-price">{formatSoles(space.pricePerHour)} <small>/ h</small></strong>
                    <span className="parking-result-address">{space.address}</span>
                    <span className="parking-result-meta">
                      <MapPin size={14} aria-hidden="true" />
                      {formatDistance(distance)}
                      {space.features?.[0] && ' · ' + space.features[0]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="parking-map-panel" aria-label="Mapa y detalle">
          <div className="parking-map">
            <MapContainer center={center} zoom={15} scrollWheelZoom={false}>
              <TileLayer
                key={String(carto) + tileRetry}
                url={carto ? 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=' + encodeURIComponent(CARTO_KEY) : OSM_TILES}
                attribution={OSM_ATTRIBUTION + (carto ? ' &copy; <a href="https://carto.com/attributions">CARTO</a>' : '')}
                eventHandlers={{
                  tileerror: () => carto ? setUseFallbackTiles(true) : setTilesUnavailable(true),
                }}
              />
              <MapCenter center={center} radius={radius} onCenter={next => changeCenter(next, 'Centro del mapa')} />
              <Marker position={center} icon={locationIcon} interactive={false} />
              {matches.map(({ space }) => (
                <Marker key={space.id} position={[space.latitude, space.longitude]} icon={pin(space, space.id === selectedId)}
                  title={space.title + ', ' + formatSoles(space.pricePerHour) + ' por hora'}
                  zIndexOffset={space.id === selectedId ? 1000 : 0}
                  eventHandlers={{ click: () => select(space.id, true) }}
                />
              ))}
            </MapContainer>
            {tilesUnavailable && (
              <div className="parking-map-status" role="status">
                El mapa no pudo cargar. La lista sigue disponible.
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                  setTilesUnavailable(false);
                  setTileRetry(value => value + 1);
                }}>Recargar mapa</button>
              </div>
            )}
          </div>

          {selected && (
            <article className="parking-selection" aria-label="Detalle de la cochera">
              {selected.photoUrl && <img src={selected.photoUrl} alt={selected.title} loading="lazy" />}
              <div className="parking-selection-copy">
                <h2>{selected.title}</h2>
                <p>{selected.address}</p>
                {selected.description && <p>{selected.description}</p>}
                <div className="parking-selection-meta">
                  <strong className="parking-price">{formatSoles(selected.pricePerHour)} / h</strong>
                  {selected.averageRating ? <span><Star size={15} aria-hidden="true" /> {selected.averageRating.toFixed(1)}</span> : null}
                  {selected.features?.map(feature => <span key={feature}>{feature}</span>)}
                </div>
                {notice && <p role="alert">{notice}</p>}
                <div className="parking-selection-actions">
                  <button className="btn btn-primary" type="button" disabled={reserving || activeReservation} onClick={() => void reserve(selected)}>
                    {reserving ? 'Reservando…' : 'Reservar cochera'}
                  </button>
                  <button className="btn btn-secondary" type="button" aria-label="Guardar en favoritos" aria-pressed={favorites.includes(selected.id)}
                    disabled={favoriteBusy} onClick={() => void toggleFavorite(selected)}>
                    <Heart size={19} fill={favorites.includes(selected.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              <button className="btn btn-secondary parking-selection-close" type="button" aria-label="Cerrar detalle" onClick={() => setSelectedId(undefined)}><X size={18} /></button>
            </article>
          )}
        </section>
      </div>
    </section>
  );
}

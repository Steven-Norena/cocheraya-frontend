import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import parkingService, { CreateParkingSpaceMetadata } from '../../services/parkingService';
import { MapPin, Navigation, Upload, CheckCircle, ArrowLeft } from 'lucide-react';

const pinMarkerSvg = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 2C10.27 2 4 8.27 4 16C4 26.5 18 34 18 34C18 34 32 26.5 32 16C32 8.27 25.73 2 18 2ZM18 10C20.21 10 22 11.79 22 14C22 16.21 20.21 18 18 18C15.79 18 14 16.21 14 14C14 11.79 15.79 10 18 10Z" fill="#a855f7"/>
</svg>
`;

const pinIcon = L.divIcon({
  html: pinMarkerSvg,
  className: 'custom-pin-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

// Update map camera when coordinates change
const ChangeMapCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Map click event listener to drop a pin
const MapEventsReceiver: React.FC<{ onDropPin: (lat: number, lng: number) => void }> = ({ onDropPin }) => {
  useMapEvents({
    click(e) {
      onDropPin(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const FEATURE_OPTIONS = [
  'Vigilancia',
  'Techado',
  'Cámara de Seguridad',
  'Cargador Eléctrico',
  'Control de Acceso',
  'Vigilancia 24/7'
];

export const AddSpaceForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerHour, setPricePerHour] = useState<number | ''>('');
  
  // Coordinate defaults (Miraflores, Lima)
  const [latitude, setLatitude] = useState(-12.1221);
  const [longitude, setLongitude] = useState(-77.0298);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch space if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchSpaceDetails(Number(id));
    }
  }, [id]);

  const fetchSpaceDetails = async (spaceId: number) => {
    setFetchingData(true);
    setError(null);
    try {
      const details = await parkingService.getDetails(spaceId);
      setTitle(details.title);
      setDescription(details.description);
      setAddress(details.address);
      setPricePerHour(details.pricePerHour);
      setLatitude(details.latitude);
      setLongitude(details.longitude);
      setSelectedFeatures(details.features || []);
      if (details.photoUrl) {
        setPhotoPreview(details.photoUrl);
      }
    } catch {
      setError('No se pudieron obtener los datos de la cochera para editar.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleFeatureToggle = (featName: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featName) 
        ? prev.filter(f => f !== featName) 
        : [...prev, featName]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      // Create local preview URL
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDropPin = (lat: number, lng: number) => {
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address || pricePerHour === '') {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: CreateParkingSpaceMetadata = {
      title,
      description,
      address,
      pricePerHour: Number(pricePerHour),
      latitude,
      longitude,
      features: selectedFeatures
    };

    try {
      if (isEditMode) {
        await parkingService.update(Number(id), payload, photoFile);
      } else {
        await parkingService.create(payload, photoFile);
      }
      navigate('/host/spaces');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Ocurrió un error al guardar la cochera. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos de la cochera...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/host/spaces')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2>{isEditMode ? 'Editar Cochera' : 'Publicar Nueva Cochera'}</h2>
          <p>{isEditMode ? 'Actualiza los datos o cambia las fotos de tu estacionamiento' : 'Registra los datos de tu cochera para empezar a recibir conductores'}</p>
        </div>
      </div>

      {error && (
        <div className="dev-banner" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form Fields Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>Información General</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="title">Título del Anuncio *</label>
            <input
              id="title"
              type="text"
              required
              className="form-input"
              placeholder="Cochera Techada con Vigilancia 24/7"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Descripción Detallada *</label>
            <textarea
              id="description"
              required
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder="Estacionamiento amplio en zona residencial, vigilado, techado, control de acceso."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="address">Dirección Física *</label>
              <input
                id="address"
                type="text"
                required
                className="form-input"
                placeholder="Calle Alcanfores 456, Miraflores"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="price">Precio por Hora (S/.) *</label>
              <input
                id="price"
                type="number"
                required
                min="0.1"
                step="0.01"
                className="form-input"
                placeholder="6.50"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          {/* Feature Selector */}
          <div className="form-group">
            <label className="form-label">Servicios / Características</label>
            <div className="features-grid">
              {FEATURE_OPTIONS.map((feat) => (
                <label key={feat} className="feature-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feat)}
                    onChange={() => handleFeatureToggle(feat)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{feat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Guardando Cochera...' : isEditMode ? 'Actualizar Publicación' : 'Publicar Cochera'}
          </button>
        </div>

        {/* Media & Location Maps Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Photo upload card */}
          <div className="card">
            <h3>Imagen de la Cochera</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Sube una foto atractiva para obtener más reservas (Guardada en Cloudinary)</p>

            <div style={{ 
              border: '2px dashed var(--panel-border)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.5rem', 
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--input-bg)',
              position: 'relative'
            }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0, 
                  cursor: 'pointer' 
                }} 
              />
              
              {photoPreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Haga clic o arrastre para reemplazar</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Upload size={36} />
                  <span>Subir archivo de imagen</span>
                  <span style={{ fontSize: '0.75rem' }}>Formatos: PNG, JPG, WEBP (Máx. 5MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Coordinates Pin Dropper Map */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3>Ubicación en el Mapa</h3>
              <p style={{ fontSize: '0.85rem' }}>Haz clic en el mapa para posicionar el marcador exacto de la cochera</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Latitud</label>
                <input type="number" readOnly className="form-input" value={latitude} style={{ padding: '0.5rem', opacity: 0.8 }} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Longitud</label>
                <input type="number" readOnly className="form-input" value={longitude} style={{ padding: '0.5rem', opacity: 0.8 }} />
              </div>
            </div>

            <div className="map-container" style={{ height: '250px' }}>
              <MapContainer 
                center={[latitude, longitude]} 
                zoom={15} 
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                <ChangeMapCenter center={[latitude, longitude]} />
                <MapEventsReceiver onDropPin={handleDropPin} />

                <Marker position={[latitude, longitude]} icon={pinIcon} />
              </MapContainer>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddSpaceForm;

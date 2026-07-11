import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const hasCoordinates = value => Number.isFinite(value.latitude) && Number.isFinite(value.longitude);

function ClickPicker({ value, onChange }) {
  useMapEvents({ click: event => onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
  return hasCoordinates(value)
    ? <CircleMarker center={[value.latitude, value.longitude]} radius={10} pathOptions={{ color: '#216b55', fillOpacity: 0.8 }}><Popup>Selected issue location</Popup></CircleMarker>
    : null;
}

function MapCenter({ value }) {
  const map = useMap();
  useEffect(() => {
    if (hasCoordinates(value)) {
      map.flyTo([value.latitude, value.longitude], 15, { duration: 0.7 });
    }
  }, [map, value.latitude, value.longitude]);
  return null;
}

export default function MapPicker({ value, onChange, markers = [] }) {
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  const locate = () => {
    setMessage('');
    if (!window.isSecureContext) {
      setMessage('Current location works only on localhost or HTTPS.');
      return;
    }
    if (!navigator.geolocation) {
      setMessage('Current location is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'current'
        });
        setMessage('Current location selected.');
        setLocating(false);
      },
      error => {
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser settings.',
          2: 'Your location is unavailable right now. Try again or enter it manually.',
          3: 'Location request timed out. Try again.'
        };
        setMessage(messages[error.code] || 'Unable to get current location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };
  const center = hasCoordinates(value) ? [value.latitude, value.longitude] : [10.8505, 76.2711];
  return <div className="map-box">
    <MapContainer center={center} zoom={hasCoordinates(value) ? 15 : 7} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapCenter value={value} />
      <ClickPicker value={value} onChange={onChange} />
      {markers.filter(item => item.location?.latitude && item.location?.longitude).map(item =>
        <CircleMarker key={item._id} center={[item.location.latitude, item.location.longitude]} radius={7}><Popup>{item.title}<br />{item.status}</Popup></CircleMarker>
      )}
    </MapContainer>
    <button type="button" className="map-locate" onClick={locate} disabled={locating}>{locating ? 'Locating...' : 'Use current location'}</button>
    {message && <p className="map-message">{message}</p>}
  </div>;
}

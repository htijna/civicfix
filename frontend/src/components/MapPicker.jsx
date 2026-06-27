import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function ClickPicker({ value, onChange }) {
  useMapEvents({ click: event => onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
  return value.latitude && value.longitude
    ? <CircleMarker center={[value.latitude, value.longitude]} radius={10} pathOptions={{ color: '#216b55', fillOpacity: 0.8 }}><Popup>Selected issue location</Popup></CircleMarker>
    : null;
}

export default function MapPicker({ value, onChange, markers = [] }) {
  const locate = () => navigator.geolocation?.getCurrentPosition(position => onChange({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  }));
  const center = value.latitude && value.longitude ? [value.latitude, value.longitude] : [10.8505, 76.2711];
  return <div className="map-box">
    <MapContainer center={center} zoom={value.latitude ? 15 : 7} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickPicker value={value} onChange={onChange} />
      {markers.filter(item => item.location?.latitude && item.location?.longitude).map(item =>
        <CircleMarker key={item._id} center={[item.location.latitude, item.location.longitude]} radius={7}><Popup>{item.title}<br />{item.status}</Popup></CircleMarker>
      )}
    </MapContainer>
    <button type="button" className="map-locate" onClick={locate}>Use current location</button>
  </div>;
}

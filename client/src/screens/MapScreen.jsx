import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEV_COLORS = { low: '#1A6B5A', medium: '#C28A2C', high: '#B5462E' };

const HAZARD_TYPES = [
  { id: 'debris', label: 'Debris' },
  { id: 'underwater_obstruction', label: 'Obstruction' },
  { id: 'shallow_water', label: 'Shallow' },
  { id: 'weather_warning', label: 'Weather' },
  { id: 'lock_closure', label: 'Lock closed' },
  { id: 'other', label: 'Other' },
];

export default function MapScreen() {
  const { user } = useAuth();
  const [hazards, setHazards] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [form, setForm] = useState({ hazardType: 'debris', description: '', severity: 'medium' });
  const [mapCenter] = useState([52.5, -1.8]);

  useEffect(() => {
    api.listHazards({ minLat: 50, maxLat: 55, minLng: -4, maxLng: 2 })
      .then(setHazards)
      .catch(() => {});
  }, []);

  const submitHazard = async () => {
    try {
      const h = await api.reportHazard({ ...form, lat: mapCenter[0], lng: mapCenter[1] });
      setHazards(prev => [h, ...prev]);
      setShowReport(false);
      setForm({ hazardType: 'debris', description: '', severity: 'medium' });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={9}
        style={{ flex: 1, width: '100%', minHeight: 0, height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {hazards.map(h => (
          <Circle
            key={h._id}
            center={[h.lat, h.lng]}
            radius={200}
            pathOptions={{ color: SEV_COLORS[h.severity] || '#C28A2C', fillOpacity: 0.3 }}
          >
            <Popup>
              <strong>{HAZARD_TYPES.find(t => t.id === h.hazardType)?.label || h.hazardType}</strong>
              <br />{h.description}
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Map controls overlay */}
      <div style={{ position: 'absolute', top: 16, left: 0, right: 0, zIndex: 1000, padding: '0 16px', pointerEvents: 'none' }}>
        <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '10px 16px', boxShadow: 'var(--sh-2)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="map" size={18} color="var(--moss)" />
          <span style={{ fontWeight: 600, fontSize: 15 }}>UK Inland Waterways</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {hazards.length > 0 && (
              <span className="chip amber" style={{ cursor: 'default' }}>
                {hazards.length} hazard{hazards.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {user && (
        <button
          onClick={() => setShowReport(true)}
          className="btn primary"
          style={{ position: 'absolute', bottom: 24, right: 16, zIndex: 1000, borderRadius: 999, width: 52, height: 52, padding: 0 }}
        >
          <Icon name="warning" size={22} color="white" />
        </button>
      )}

      {showReport && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div className="sheet" style={{ width: '100%', padding: '0 0 32px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>Report a hazard</h3>
              <div className="stack">
                <div>
                  <label className="label">Type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {HAZARD_TYPES.map(t => (
                      <button key={t.id} onClick={() => setForm(f => ({ ...f, hazardType: t.id }))}
                        className={`chip${form.hazardType === t.id ? ' active' : ''}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Severity</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['low', 'medium', 'high'].map(s => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, severity: s }))}
                        className={`chip${form.severity === s ? (s === 'high' ? ' rust' : s === 'medium' ? ' amber' : ' moss') : ''}`}
                        style={{ flex: 1, justifyContent: 'center' }}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="field"
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Briefly describe what you've found…"
                    style={{ resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowReport(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitHazard} disabled={!form.description} className="btn primary" style={{ flex: 1 }}>Report</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

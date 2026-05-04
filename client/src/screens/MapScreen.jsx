import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Plate from '../components/Plate';
import BottomSheet from '../components/BottomSheet';
import Avatar from '../components/Avatar';

// Fix Leaflet marker icons
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
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ hazards: true, friends: true, services: true, logbook: false });
  const [showReport, setShowReport] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [reportForm, setReportForm] = useState({ hazardType: 'debris', description: '', severity: 'medium' });
  const [reportError, setReportError] = useState('');
  const mapCenter = [52.5, -1.8];

  useEffect(() => {
    api.listHazards({ minLat: 50, maxLat: 55, minLng: -4, maxLng: 2 })
      .then(setHazards)
      .catch(() => {});
  }, []);

  const submitReport = async () => {
    setReportError('');
    try {
      const h = await api.reportHazard({ ...reportForm, lat: mapCenter[0], lng: mapCenter[1] });
      setHazards(prev => [h, ...prev]);
      setShowReport(false);
      setReportForm({ hazardType: 'debris', description: '', severity: 'medium' });
    } catch (e) {
      setReportError(e.message);
    }
  };

  const toggleFilter = (key) => setFilters(f => ({ ...f, [key]: !f[key] }));
  const visibleHazards = filters.hazards ? hazards : [];

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
          attribution='&copy; OpenStreetMap'
        />
        {visibleHazards.map(h => (
          <Circle
            key={h._id}
            center={[h.lat, h.lng]}
            radius={300}
            pathOptions={{ color: SEV_COLORS[h.severity] || '#C28A2C', fillOpacity: 0.35, weight: 2 }}
            eventHandlers={{ click: () => setSelectedPin({ kind: 'hazard', ...h }) }}
          />
        ))}
      </MapContainer>

      {/* Search bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--paper)', borderRadius: 12,
          padding: '12px 14px', boxShadow: 'var(--sh-2)',
          border: '1px solid var(--reed)',
        }}>
          <Icon name="search" size={18} color="var(--silt)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search places, friends, services"
            style={{
              border: 0, outline: 0, fontSize: 15, flex: 1,
              background: 'transparent', fontFamily: 'var(--font-sans)', minWidth: 0,
            }}
          />
          {user?.boatId && <Plate>BOAT</Plate>}
        </div>
      </div>

      {/* Filter chip rail */}
      <div style={{
        position: 'absolute', top: 70, left: 12, right: 12, zIndex: 1000,
        display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'none',
      }}>
        <FilterChip active={filters.hazards} onClick={() => toggleFilter('hazards')}>
          <span className="sev high" /> Hazards
        </FilterChip>
        <FilterChip active={filters.friends} onClick={() => toggleFilter('friends')}>
          <Icon name="friend" size={13} stroke={2} /> Friends
        </FilterChip>
        <FilterChip active={filters.services} onClick={() => toggleFilter('services')}>
          <Icon name="fuel" size={13} stroke={2} /> Services
        </FilterChip>
        <FilterChip active={filters.logbook} onClick={() => toggleFilter('logbook')}>
          Logbook
        </FilterChip>
      </div>

      {/* Right side controls */}
      <div style={{
        position: 'absolute', right: 12, top: 120, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <CtrlBtn onClick={() => {}}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--silt)', letterSpacing: '0.06em' }}>UK</span>
        </CtrlBtn>
        <CtrlBtn onClick={() => {}}>
          <Icon name="compass" size={20} color="var(--moss)" stroke={1.8} />
        </CtrlBtn>
      </div>

      {/* FAB pair: Check in + Report (only for logged-in users) */}
      {user && (
        <div style={{
          position: 'absolute', right: 12, bottom: 16, zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <button
            onClick={() => setShowCheckin(true)}
            style={{
              height: 50, padding: '0 18px', borderRadius: 25,
              border: '1px solid var(--reed)', background: 'var(--paper)',
              cursor: 'pointer', boxShadow: 'var(--sh-2)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 600, fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-sans)',
            }}
          >
            <Icon name="pin" size={18} /> Check in
          </button>
          <button
            onClick={() => setShowReport(true)}
            style={{
              height: 50, padding: '0 18px', borderRadius: 25,
              background: 'var(--ink)', color: 'var(--paper)', border: 0,
              cursor: 'pointer', boxShadow: 'var(--sh-2)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-sans)',
            }}
          >
            <Icon name="warning" size={18} color="var(--paper)" /> Report
          </button>
        </div>
      )}

      {/* Pin sheet */}
      <BottomSheet open={!!selectedPin} onClose={() => setSelectedPin(null)}>
        {selectedPin?.kind === 'hazard' && <HazardSheet pin={selectedPin} onClose={() => setSelectedPin(null)} />}
      </BottomSheet>

      {/* Report hazard sheet */}
      <BottomSheet open={showReport} onClose={() => setShowReport(false)}>
        <div style={{ padding: '8px 22px 22px' }}>
          <h3 style={{ margin: '8px 0 16px', fontSize: 19, fontWeight: 600 }}>Report a hazard</h3>
          <div className="stack">
            <div>
              <label className="label">Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HAZARD_TYPES.map(t => (
                  <FilterChip key={t.id} active={reportForm.hazardType === t.id} onClick={() => setReportForm(f => ({ ...f, hazardType: t.id }))}>
                    {t.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Severity</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['low', 'medium', 'high'].map(s => {
                  const isOn = reportForm.severity === s;
                  const tone = s === 'high' ? 'rust' : s === 'medium' ? 'amber' : 'moss';
                  return (
                    <button
                      key={s}
                      onClick={() => setReportForm(f => ({ ...f, severity: s }))}
                      className={`chip${isOn ? ` ${tone}` : ''}`}
                      style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <span className={`sev ${s === 'medium' ? 'med' : s}`} />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="field"
                rows={3}
                value={reportForm.description}
                onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Briefly describe what you've found…"
                style={{ resize: 'none' }}
              />
            </div>
            {reportError && <div className="error-msg">{reportError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowReport(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={submitReport} disabled={!reportForm.description} className="btn primary" style={{ flex: 1 }}>Report</button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Check in sheet */}
      <BottomSheet open={showCheckin} onClose={() => setShowCheckin(false)}>
        <div style={{ padding: '8px 22px 22px' }}>
          <h3 style={{ margin: '8px 0 6px', fontSize: 19, fontWeight: 600 }}>Check in here</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>
            Log your stay. By default we use the CRT 14-day rule for the end date.
          </p>
          <div className="stack">
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="field" rows={3} placeholder="Quiet stretch, good signal…" style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCheckin(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => setShowCheckin(false)} className="btn primary" style={{ flex: 1 }}>Check in</button>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`chip${active ? ' active' : ''}`}
      style={{
        cursor: 'pointer',
        background: active ? 'var(--ink)' : 'var(--paper)',
        boxShadow: active ? 'none' : 'var(--sh-1)',
        border: active ? 'none' : '1px solid var(--reed)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function CtrlBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: 10,
        border: '1px solid var(--reed)', background: 'var(--paper)',
        boxShadow: 'var(--sh-1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function HazardSheet({ pin, onClose }) {
  const sev = pin.severity === 'high' ? 'rust' : pin.severity === 'medium' ? 'amber' : 'moss';
  const sevLabel = pin.severity?.charAt(0).toUpperCase() + pin.severity?.slice(1);
  return (
    <div style={{ padding: '8px 22px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <span className={`chip ${sev}`} style={{ cursor: 'default' }}>
            <span className={`sev ${pin.severity === 'medium' ? 'med' : pin.severity}`} />
            {sevLabel} severity
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: '10px 0 4px' }}>
            {HAZARD_TYPES.find(t => t.id === pin.hazardType)?.label || 'Hazard'}
          </h3>
          <div style={{ fontSize: 14, color: 'var(--silt)' }}>{pin.description}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn primary" style={{ flex: 1 }}>View details</button>
        <button className="btn ghost"><Icon name="check" size={18} /> Confirm</button>
      </div>
    </div>
  );
}

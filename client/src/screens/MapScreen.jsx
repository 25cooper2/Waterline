import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Plate from '../components/Plate';
import BottomSheet from '../components/BottomSheet';

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

// Feature type detection from OSM tags — returns a stable key
function getFeatureType(tags) {
  const am = tags.amenity;
  if (am === 'toilets') return 'toilets';
  if (am === 'water_point') return 'water';
  if (am === 'waste_disposal') return 'waste';
  if (am === 'recycling') return 'recycling';
  if (am === 'fuel') return 'fuel';
  if (tags.leisure === 'marina') return 'marina';
  if (tags.mooring && tags.mooring !== 'no') return 'mooring';
  if (tags.lock === 'yes') return 'lock'; // canal way with lock=yes + lock_name/lock_ref
  const ww = tags.waterway;
  if (ww === 'weir') return 'weir';
  if (ww === 'dam') return 'dam';
  if (ww === 'sluice_gate') return 'sluice';
  if (ww === 'turning_point') return 'turning';
  if (tags.bridge && tags.bridge !== 'no' && tags.man_made !== 'aqueduct') return 'bridge';
  return null;
}

const FEATURE_META = {
  toilets:   { label: 'Toilets',       emoji: '🚻', color: '#4A90D9' },
  water:     { label: 'Water point',   emoji: '💧', color: '#2E7D9E' },
  waste:     { label: 'Waste',         emoji: '🗑️', color: '#888'    },
  recycling: { label: 'Recycling',     emoji: '♻️', color: '#7CB342' },
  fuel:      { label: 'Fuel',          emoji: '⛽', color: '#E53935' },
  marina:    { label: 'Marina',        emoji: '⚓', color: '#FF9800' },
  mooring:   { label: 'Mooring',       emoji: '🪢', color: '#9C27B0' },
  lock:      { label: 'Lock',          emoji: '🔒', color: '#FF5722' },
  weir:      { label: 'Weir',          emoji: '〰️', color: '#00BCD4' },
  dam:       { label: 'Dam',           emoji: '🏗️', color: '#00897B' },
  sluice:    { label: 'Sluice gate',   emoji: '🔧', color: '#607D8B' },
  turning:   { label: 'Turning point', emoji: '↩️', color: '#FFC107' },
  bridge:    { label: 'Bridge',        emoji: '🌉', color: '#757575' },
};

function makeEmojiIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">${emoji}</div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function makeLockIcon(label) {
  const safe = label.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto">
      <div style="width:12px;height:12px;border-radius:50%;background:#111;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.6)"></div>
      <div style="background:rgba(255,255,255,0.95);border:1px solid #555;border-radius:3px;padding:1px 5px;font-size:10px;font-weight:700;color:#111;white-space:nowrap;margin-top:2px;box-shadow:0 1px 2px rgba(0,0,0,0.2)">${safe}</div>
    </div>`,
    className: '',
    iconSize: null,
    iconAnchor: [6, 6],
  });
}

function MapViewTracker({ onViewChange, onCenterChange }) {
  const map = useMap();
  const toBboxKey = (b) => {
    const r = (v) => Math.round(v * 1000) / 1000;
    return `${r(b.getSouth())},${r(b.getWest())},${r(b.getNorth())},${r(b.getEast())}`;
  };
  useEffect(() => {
    onViewChange(toBboxKey(map.getBounds()));
    const c = map.getCenter();
    onCenterChange([c.lat, c.lng]);
  }, []);
  useMapEvents({
    moveend: (e) => {
      onViewChange(toBboxKey(e.target.getBounds()));
      const c = e.target.getCenter();
      onCenterChange([c.lat, c.lng]);
    },
    zoomend: (e) => {
      onViewChange(toBboxKey(e.target.getBounds()));
    },
  });
  return null;
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom || 14, { duration: 1.2 }); }, [center]);
  return null;
}

export default function MapScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const routeLocation = useLocation();
  const [hazards, setHazards] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [flyTarget, setFlyTarget] = useState(null);
  const [filters, setFilters] = useState({ hazards: true, friends: true, services: true, logbook: false });
  const [mapCenter, setMapCenter] = useState([52.5, -1.8]);
  const [bboxKey, setBboxKey] = useState(null);
  const [locationPickMode, setLocationPickMode] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [canalFeatures, setCanalFeatures] = useState([]);  // point features
  const [waterwayLines, setWaterwayLines] = useState([]);  // polyline arrays
  const [canalFilters, setCanalFilters] = useState(
    Object.fromEntries(Object.keys(FEATURE_META).map(k => [k, true]))
  );
  const [canalPanelOpen, setCanalPanelOpen] = useState(false);
  const searchTimeout = useRef(null);
  const overpassTimeout = useRef(null);

  // Auto-enter location pick if navigated from logbook
  useEffect(() => {
    if (routeLocation.state?.pickLocationFor) {
      setLocationPickMode('pick-for-' + routeLocation.state.pickLocationFor);
      window.history.replaceState({}, '');
    }
  }, []);

  useEffect(() => {
    api.listHazards({ minLat: 50, maxLat: 55, minLng: -4, maxLng: 2 })
      .then(setHazards).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.boatId) return;
    api.getLogbook(user.boatId)
      .then(data => setLogbookEntries((data.entries || []).filter(e => e.lat && e.lng)))
      .catch(() => {});
  }, [user]);

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setFlyTarget(loc);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fetch canal features whenever visible bounds change (bboxKey is "s,w,n,e" string)
  useEffect(() => {
    if (!bboxKey) return;
    clearTimeout(overpassTimeout.current);
    overpassTimeout.current = setTimeout(async () => {
      try {
        const bbox = bboxKey; // already "s,w,n,e"

        // Canal/river ways + lock=yes canal ways (for lock dots) + nodes for point features
        const oq = `[out:json][timeout:15];
(
  way["waterway"~"^(canal|river)$"](${bbox});
  way["waterway"="canal"]["lock"="yes"](${bbox});
  node["amenity"~"^(toilets|water_point|waste_disposal|recycling|fuel)$"](${bbox});
  node["leisure"="marina"](${bbox});
  node["waterway"~"^(weir|dam|sluice_gate|turning_point)$"](${bbox});
  node["mooring"]["mooring"!="no"](${bbox});
);
out center geom;`;

        // Try primary, fall back to mirror
        const OVERPASS_ENDPOINTS = [
          'https://overpass-api.de/api/interpreter',
          'https://overpass.kumi.systems/api/interpreter',
          'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
        ];
        let data = null;
        for (const url of OVERPASS_ENDPOINTS) {
          try {
            const r = await fetch(url, { method: 'POST', body: oq });
            if (r.ok) { data = await r.json(); break; }
          } catch { /* try next */ }
        }
        if (!data) { console.warn('All Overpass endpoints failed'); return; }
        const lines = [], pts = [];

        for (const el of data.elements || []) {
          const tags = el.tags || {};
          const ww = tags.waterway;
          // Canal/river lines — but NOT if lock=yes (those become point features)
          if (el.type === 'way' && (ww === 'canal' || ww === 'river') && !tags.lock && el.geometry?.length) {
            lines.push({ id: el.id, coords: el.geometry.map(p => [p.lat, p.lon]), name: tags.name || ww });
            continue;
          }
          const ftype = getFeatureType(tags);
          if (!ftype) continue;
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (!lat || !lon) continue;
          // Build display label — for locks include ref and name
          let label = tags.name || FEATURE_META[ftype]?.label || ftype;
          if (ftype === 'lock') {
            // UK canals use lock_name and lock_ref (underscores)
            const ref = tags.lock_ref || tags['lock:ref'] || tags.ref;
            const name = tags.lock_name || tags['lock:name'] || tags.name;
            if (ref && name) label = `Lock ${ref}: ${name}`;
            else if (name) label = name;
            else if (ref) label = `Lock ${ref}`;
            else label = 'Lock';
          }
          pts.push({ id: el.id, lat, lng: lon, ftype, name: label });
        }

        setWaterwayLines(lines);
        setCanalFeatures(pts);
      } catch (err) {
        console.warn('Overpass fetch failed:', err);
      }
    }, 600);
  }, [bboxKey]);

  // Geocode search via Nominatim (debounced)
  const onSearchChange = (val) => {
    setQuery(val);
    clearTimeout(searchTimeout.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=5&q=${encodeURIComponent(val)}`
        );
        const data = await res.json();
        setSearchResults(data.map(r => ({
          name: r.display_name.split(',').slice(0, 2).join(','),
          full: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        })));
      } catch { setSearchResults([]); }
    }, 400);
  };

  const pickSearchResult = (r) => {
    setFlyTarget([r.lat, r.lng]);
    setQuery(r.name);
    setSearchResults([]);
  };

  const startReport = () => setLocationPickMode('report');
  const startCheckin = () => setLocationPickMode('checkin');

  const confirmLocation = () => {
    if (locationPickMode === 'report') {
      nav('/report-hazard', { state: { lat: mapCenter[0], lng: mapCenter[1] } });
    } else if (locationPickMode === 'pick-for-logbook') {
      nav('/logbook', { state: { locationPick: true, lat: mapCenter[0], lng: mapCenter[1] } });
    } else {
      nav('/logbook', { state: { checkin: true, lat: mapCenter[0], lng: mapCenter[1] } });
    }
    setLocationPickMode(null);
  };

  const toggleFilter = (key) => setFilters(f => ({ ...f, [key]: !f[key] }));
  const visibleHazards = filters.hazards ? hazards : [];

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <MapContainer center={mapCenter} zoom={9} style={{ flex: 1, width: '100%', minHeight: 0, height: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <MapViewTracker onViewChange={setBboxKey} onCenterChange={setMapCenter} />
        <FlyTo center={flyTarget} />

        {/* Waterway lines — rendered first so they sit behind all markers */}
        {waterwayLines.map(wl => (
          <Polyline key={wl.id} positions={wl.coords}
            pathOptions={{ color: '#20B2AA', weight: 9, opacity: 0.7 }}>
            <Popup><span style={{ fontSize: 12 }}>{wl.name}</span></Popup>
          </Polyline>
        ))}

        {/* Canal feature icons */}
        {canalFeatures.map(f => {
          if (!canalFilters[f.ftype]) return null;
          const meta = FEATURE_META[f.ftype];
          if (!meta) return null;
          const icon = f.ftype === 'lock' ? makeLockIcon(f.name) : makeEmojiIcon(meta.emoji);
          return (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={icon}>
              <Popup><div style={{ fontSize: 12 }}><strong>{f.name}</strong></div></Popup>
            </Marker>
          );
        })}

        {/* Hazard circles */}
        {visibleHazards.map(h => (
          <Circle key={h._id} center={[h.lat, h.lng]} radius={300}
            pathOptions={{ color: SEV_COLORS[h.severity] || '#C28A2C', fillOpacity: 0.35, weight: 2 }}
            eventHandlers={{ click: () => setSelectedPin({ kind: 'hazard', ...h }) }} />
        ))}

        {/* Logbook pins */}
        {filters.logbook && logbookEntries.map(e => (
          <CircleMarker key={e._id} center={[e.lat, e.lng]} radius={7}
            pathOptions={{ color: '#1A6B5A', fillColor: '#1A6B5A', fillOpacity: 0.7, weight: 2 }}
            eventHandlers={{ click: () => setSelectedPin({ kind: 'logbook', ...e }) }} />
        ))}

        {/* Current location */}
        {userLocation && (
          <CircleMarker center={userLocation} radius={8}
            pathOptions={{ color: '#fff', fillColor: '#4A90D9', fillOpacity: 1, weight: 3 }} />
        )}
      </MapContainer>

      {/* Search bar */}
      {!locationPickMode && (
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--paper)', borderRadius: 12,
            padding: '12px 14px', boxShadow: 'var(--sh-2)', border: '1px solid var(--reed)',
          }}>
            <Icon name="search" size={18} color="var(--silt)" />
            <input value={query} onChange={e => onSearchChange(e.target.value)}
              placeholder="Search places, canals, towns…"
              style={{ border: 0, outline: 0, fontSize: 15, flex: 1, background: 'transparent', fontFamily: 'var(--font-sans)', minWidth: 0 }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchResults([]); }}
                style={{ background: 'none', border: 0, padding: 2, cursor: 'pointer', color: 'var(--silt)' }}>
                <Icon name="close" size={16} />
              </button>
            )}
            {!query && user?.boatIndexNumber && <Plate>{user.boatIndexNumber}</Plate>}
          </div>

          {searchResults.length > 0 && (
            <div style={{
              marginTop: 6, background: 'var(--paper)', borderRadius: 12,
              boxShadow: 'var(--sh-3)', border: '1px solid var(--reed)', overflow: 'hidden',
            }}>
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => pickSearchResult(r)} style={{
                  padding: '12px 14px', cursor: 'pointer',
                  borderBottom: i < searchResults.length - 1 ? '1px solid var(--reed)' : 0,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icon name="pin" size={16} color="var(--silt)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }} className="truncate">{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 1 }} className="truncate">{r.full}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter chips */}
      {!locationPickMode && (
        <div style={{ position: 'absolute', top: 70, left: 12, right: 12, zIndex: 999, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <FilterChip active={filters.hazards} onClick={() => toggleFilter('hazards')}><span className="sev high" /> Hazards</FilterChip>
          <FilterChip active={filters.friends} onClick={() => toggleFilter('friends')}><Icon name="friend" size={13} stroke={2} /> Friends</FilterChip>
          <FilterChip active={filters.services} onClick={() => toggleFilter('services')}><Icon name="fuel" size={13} stroke={2} /> Services</FilterChip>
          <FilterChip active={filters.logbook} onClick={() => toggleFilter('logbook')}>Logbook</FilterChip>
        </div>
      )}

      {/* Controls (right side) */}
      {!locationPickMode && (
        <div style={{ position: 'absolute', right: 12, top: 120, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <CtrlBtn onClick={goToMyLocation}><Icon name="compass" size={20} color="var(--moss)" stroke={1.8} /></CtrlBtn>
        </div>
      )}

      {/* Canal features filter — collapsible, left side */}
      {!locationPickMode && (
        <div style={{
          position: 'absolute', left: 12, top: 120, zIndex: 1000,
          background: 'var(--paper)', borderRadius: 12, boxShadow: 'var(--sh-2)',
          border: '1px solid var(--reed)', width: 174,
        }}>
          {/* Header — click to open/close */}
          <button
            onClick={() => setCanalPanelOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '10px 14px', background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span>🛶 Canal features</span>
            <span style={{ fontSize: 10, color: 'var(--silt)', marginLeft: 4 }}>
              {canalPanelOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Rows */}
          {canalPanelOpen && (
            <div style={{ borderTop: '1px solid var(--reed)', padding: '6px 4px 8px', maxHeight: 340, overflowY: 'auto' }}>
              {Object.entries(FEATURE_META).map(([key, meta]) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', cursor: 'pointer', fontSize: 13,
                }}>
                  <input type="checkbox" checked={canalFilters[key]}
                    onChange={() => setCanalFilters(x => ({ ...x, [key]: !x[key] }))}
                    style={{ cursor: 'pointer', accentColor: 'var(--moss)' }} />
                  <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                  {meta.label}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FABs */}
      {user && !locationPickMode && (
        <div style={{ position: 'absolute', right: 12, bottom: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={startCheckin} style={{
            height: 50, padding: '0 18px', borderRadius: 25, border: '1px solid var(--reed)',
            background: 'var(--paper)', cursor: 'pointer', boxShadow: 'var(--sh-2)',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15,
            color: 'var(--ink)', fontFamily: 'var(--font-sans)',
          }}>
            <Icon name="pin" size={18} /> Check in
          </button>
          <button onClick={startReport} style={{
            height: 50, padding: '0 18px', borderRadius: 25, background: 'var(--ink)',
            color: 'var(--paper)', border: 0, cursor: 'pointer', boxShadow: 'var(--sh-2)',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15,
            fontFamily: 'var(--font-sans)',
          }}>
            <Icon name="warning" size={18} color="var(--paper)" /> Report
          </button>
        </div>
      )}

      {/* Location pick overlay */}
      {locationPickMode && (
        <>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', zIndex: 1001, pointerEvents: 'none' }}>
            <svg width="36" height="48" viewBox="0 0 36 48" fill="none">
              <circle cx="18" cy="18" r="14" fill="var(--ink)" />
              <circle cx="18" cy="18" r="9" fill="var(--paper)" />
              <circle cx="18" cy="18" r="5" fill={locationPickMode === 'report' ? 'var(--rust)' : 'var(--moss)'} />
              <line x1="18" y1="32" x2="18" y2="48" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: 16, left: 12, right: 12, zIndex: 1001 }}>
            <div style={{ background: 'var(--paper)', borderRadius: 12, padding: '10px 16px', boxShadow: 'var(--sh-2)', marginBottom: 8, textAlign: 'center', fontSize: 14, color: 'var(--silt)' }}>
              Move the map to where you want to {locationPickMode === 'report' ? 'report the hazard' : locationPickMode.startsWith('pick-for') ? 'set the location' : 'check in'}, then tap <strong>Set location</strong>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setLocationPickMode(null)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmLocation} className="btn primary" style={{ flex: 1 }}>Set location</button>
            </div>
          </div>
        </>
      )}

      <BottomSheet open={!!selectedPin} onClose={() => setSelectedPin(null)}>
        {selectedPin?.kind === 'hazard' && <HazardSheet pin={selectedPin} onClose={() => setSelectedPin(null)} />}
        {selectedPin?.kind === 'logbook' && <LogbookSheet pin={selectedPin} onClose={() => setSelectedPin(null)} />}
      </BottomSheet>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`chip${active ? ' active' : ''}`} style={{
      cursor: 'pointer', background: active ? 'var(--ink)' : 'var(--paper)',
      boxShadow: active ? 'none' : 'var(--sh-1)', border: active ? 'none' : '1px solid var(--reed)', flexShrink: 0,
    }}>{children}</button>
  );
}

function CtrlBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 44, borderRadius: 10, border: '1px solid var(--reed)',
      background: 'var(--paper)', boxShadow: 'var(--sh-1)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

function LogbookSheet({ pin, onClose }) {
  const loc = pin.startLocation || pin.endLocation || 'Unknown';
  const date = pin.entryDate ? new Date(pin.entryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return (
    <div style={{ padding: '8px 22px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <span className="chip moss" style={{ cursor: 'default' }}>Logbook entry</span>
          <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: '10px 0 4px' }}>{loc}</h3>
          {date && <div style={{ fontSize: 14, color: 'var(--silt)' }}>{date}</div>}
          {pin.notes && <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 8, lineHeight: 1.5 }}>{pin.notes}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}>
          <Icon name="close" size={20} />
        </button>
      </div>
    </div>
  );
}

function HazardSheet({ pin, onClose }) {
  const navigate = useNavigate();
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
        <button onClick={() => navigate(`/hazard/${pin._id}`, { state: { hazard: pin } })} className="btn primary" style={{ flex: 1 }}>View details</button>
        <button className="btn ghost"><Icon name="check" size={18} /> Confirm</button>
      </div>
    </div>
  );
}

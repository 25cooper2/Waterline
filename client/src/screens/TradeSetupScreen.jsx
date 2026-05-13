import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icon';
import { api } from '../api';
import { compressImage } from '../utils/imageCompress';

/* ── fix leaflet default marker icon ────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ALL_TAGS = [
  'Electrical', 'Engineering', 'Paint & sign', 'Heating',
  'Survey', 'Cleaning', 'Tuition', 'Carpentry', 'Welding',
];

/* ── Radius slider — 0 = < 1 mile, 1-99 = exact miles, 100 = Anywhere ── */
const radiusLabel = (v) => {
  if (v === 0) return '< 1 mile';
  if (v >= 100) return 'Anywhere';
  return `${v} miles`;
};

/* ── Map pin-dropper ─────────────────────────────────────────────── */
function PinDropper({ onPin }) {
  useMapEvents({
    click(e) {
      onPin(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ── Geocode search using Nominatim ─────────────────────────────── */
async function geocodeSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&limit=5&addressdetails=0`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  return res.json();
}

/* ── File → data URL ─────────────────────────────────────────────── */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Progress bar ────────────────────────────────────────────────── */
function ProgressBar({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 22px', marginTop: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? 'var(--moss)' : 'var(--reed)' }} />
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function TradeSetupScreen() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1 — categories
  const [picked, setPicked] = useState([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');

  // Step 2 — location
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [chosenLocation, setChosenLocation] = useState(null); // { name, lat, lng }
  const [showMap, setShowMap] = useState(false);
  const [mapPin, setMapPin] = useState(null); // { lat, lng }
  const [radiusVal, setRadiusVal] = useState(25); // default 25 miles
  const locationTimer = useRef(null);

  // Step 3 — documents
  const [insuranceFile, setInsuranceFile] = useState(null); // { name, dataUrl }
  const [certFiles, setCertFiles] = useState([]); // [{ name, dataUrl }, ...]
  const insuranceInputRef = useRef(null);
  const certInputRef = useRef(null);

  // Step 4 — business profile
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [bizPhotos, setBizPhotos] = useState([]); // data URLs
  const photoInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const toggleTag = (t) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  /* ── location search ── */
  const searchLocation = useCallback((q) => {
    clearTimeout(locationTimer.current);
    if (!q.trim()) { setLocationResults([]); return; }
    locationTimer.current = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const results = await geocodeSearch(q);
        setLocationResults(results || []);
      } catch { setLocationResults([]); }
      setLocationSearching(false);
    }, 400);
  }, []);

  useEffect(() => { searchLocation(locationQuery); }, [locationQuery, searchLocation]);

  const pickResult = (r) => {
    setChosenLocation({ name: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setMapPin({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setLocationQuery(r.display_name);
    setLocationResults([]);
    setShowMap(true);
  };

  const handleMapPin = (lat, lng) => {
    setMapPin({ lat, lng });
    setChosenLocation(prev => ({ name: prev?.name || 'Pin location', lat, lng }));
  };

  /* ── file upload handlers ── */
  const handleInsuranceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10 MB.'); return; }
    const dataUrl = await fileToDataUrl(file);
    setInsuranceFile({ name: file.name, dataUrl });
  };

  const handleCertFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (certFiles.length >= 3) { alert('Maximum 3 trade certificates.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10 MB.'); return; }
    const dataUrl = await fileToDataUrl(file);
    setCertFiles(prev => [...prev, { name: file.name, dataUrl }]);
  };

  const removeCert = (i) => setCertFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleBizPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (bizPhotos.length >= 6) break;
      const compressed = await compressImage(file, { maxDim: 1200, quality: 0.82 });
      const dataUrl = await fileToDataUrl(compressed);
      setBizPhotos(prev => [...prev, dataUrl]);
    }
    e.target.value = '';
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const travelRadius = radiusVal >= 100 ? null : radiusVal;
      const location = chosenLocation || (mapPin ? { name: 'Custom pin', ...mapPin } : null);

      await api.submitTradeProfile({
        categories: picked,
        otherCategory: otherChecked && otherText.trim() ? otherText.trim() : null,
        businessName: businessName.trim() || null,
        businessDescription: businessDesc.trim() || null,
        businessPhotos: bizPhotos,
        operatesAt: location?.name || null,
        operatesLat: location?.lat ?? null,
        operatesLng: location?.lng ?? null,
        travelRadius,
        liabilityInsuranceUrl: insuranceFile?.dataUrl || null,
        tradeCertUrls: certFiles.map(f => f.dataUrl),
      });
      nav('/me', { replace: true });
      alert('Trade profile submitted for review! We\'ll get back to you within 48 hours.');
    } catch (e) {
      setSaveError(e.message);
    }
    setSaving(false);
  };

  /* ──────────────────────────────────────────────────────────────── */
  /* STEP 0 — Intro                                                  */
  /* ──────────────────────────────────────────────────────────────── */
  if (step === 0) {
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => nav('/me')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
              <Icon name="back" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Set up trade</span>
          </div>
        </div>
        <div className="scroll" style={{ padding: '20px 22px' }}>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '0 0 12px', lineHeight: 1.15 }}>
            Get hired by boaters.
          </h1>
          <p style={{ color: 'var(--silt)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            Trade profiles appear in the Services tab of the Marketplace, with reviews, contact and direct quotes. We take 5% of completed jobs to keep the lights on.
          </p>

          <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
            {[
              { icon: 'check', t: 'Verified status', s: 'A trade-verified badge after we check your insurance and trading history' },
              { icon: 'star', t: 'Real reviews', s: 'Boaters can only review you after a completed job' },
              { icon: 'send', t: 'Quotes & bookings', s: 'Send formal quotes and accept payment inside the app' },
            ].map(b => (
              <div key={b.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 14, background: 'var(--linen)', borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={b.icon} size={18} color="var(--paper)" stroke={2} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>{b.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setStep(1)} className="btn primary block">Get started</button>
          <button onClick={() => nav('/me')} className="btn text" style={{ fontSize: 14.5 }}>Maybe later</button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────── */
  /* STEP 1 — Trade categories                                       */
  /* ──────────────────────────────────────────────────────────────── */
  if (step === 1) {
    const canContinue = picked.length > 0 || (otherChecked && otherText.trim());
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setStep(0)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
              <Icon name="back" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Trade categories</span>
          </div>
        </div>
        <ProgressBar step={1} total={4} />
        <div className="scroll" style={{ padding: '20px 22px' }}>
          <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
            Step 01 / 04
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '12px 0 6px' }}>
            What do you offer?
          </h2>
          <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
            Pick all that apply. You can add specific service listings later.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_TAGS.map(t => {
              const on = picked.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)} style={{
                  padding: '10px 16px', borderRadius: 100, border: '1.5px solid',
                  borderColor: on ? 'var(--moss)' : 'var(--reed)',
                  background: on ? 'var(--moss-soft)' : 'var(--paper)',
                  color: 'var(--ink)', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {on && <Icon name="check" size={14} color="var(--moss)" stroke={2.5} />}
                  {t}
                </button>
              );
            })}

            {/* Other chip */}
            <button onClick={() => setOtherChecked(o => !o)} style={{
              padding: '10px 16px', borderRadius: 100, border: '1.5px solid',
              borderColor: otherChecked ? 'var(--moss)' : 'var(--reed)',
              background: otherChecked ? 'var(--moss-soft)' : 'var(--paper)',
              color: 'var(--ink)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {otherChecked && <Icon name="check" size={14} color="var(--moss)" stroke={2.5} />}
              Other
            </button>
          </div>

          {otherChecked && (
            <div style={{ marginTop: 14 }}>
              <label className="label">Describe your trade</label>
              <input
                className="field"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder="e.g. Stove installation, fibreglass repair…"
                autoFocus
              />
            </div>
          )}
        </div>
        <div style={{ padding: 22 }}>
          <button onClick={() => setStep(2)} className="btn primary block" disabled={!canContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────── */
  /* STEP 2 — Location & coverage                                    */
  /* ──────────────────────────────────────────────────────────────── */
  if (step === 2) {
    const mapCenter = mapPin || { lat: 52.5, lng: -1.5 };
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
              <Icon name="back" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Location & coverage</span>
          </div>
        </div>
        <ProgressBar step={2} total={4} />
        <div className="scroll" style={{ padding: '20px 22px' }}>
          <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
            Step 02 / 04
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '12px 0 6px' }}>
            Where are you based?
          </h2>
          <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
            Search for your base location or drop a pin on the map.
          </p>

          {/* Location search */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <label className="label">Base location</label>
            <div style={{ position: 'relative' }}>
              <input
                className="field"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                placeholder="Search town, canal, postcode…"
                style={{ paddingRight: 40 }}
              />
              {locationSearching && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--silt)' }}>…</span>
              )}
            </div>
            {locationResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-md)', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: 220, overflowY: 'auto' }}>
                {locationResults.map((r, i) => (
                  <button key={i} onClick={() => pickResult(r)} style={{
                    display: 'block', width: '100%', padding: '11px 14px', border: 'none',
                    borderBottom: i < locationResults.length - 1 ? '1px solid var(--linen)' : 'none',
                    background: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    fontSize: 13.5, color: 'var(--ink)', textAlign: 'left', lineHeight: 1.4,
                  }}>
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map toggle */}
          <button
            onClick={() => setShowMap(m => !m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
              background: 'var(--linen)', border: '1px solid var(--reed)', borderRadius: 'var(--r-md)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5,
              fontWeight: 600, color: 'var(--ink)', marginBottom: 14, width: '100%',
            }}
          >
            <Icon name="pin" size={16} color="var(--moss)" />
            {showMap ? 'Hide map' : 'Choose on map — tap to drop a pin'}
            {mapPin && !showMap && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--moss)' }}>Pin set ✓</span>}
          </button>

          {showMap && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--reed)', marginBottom: 14, height: 260 }}>
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={mapPin ? 12 : 7}
                style={{ width: '100%', height: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <PinDropper onPin={handleMapPin} />
                {mapPin && <Marker position={[mapPin.lat, mapPin.lng]} />}
              </MapContainer>
            </div>
          )}

          {chosenLocation && (
            <div style={{ padding: '10px 14px', background: 'var(--moss-soft)', borderRadius: 'var(--r-md)', border: '1px solid var(--moss)', fontSize: 13, color: 'var(--ink)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="pin" size={16} color="var(--moss)" />
              <span style={{ flex: 1, lineHeight: 1.4 }}>{mapPin && chosenLocation.name === 'Custom pin' ? `Pin at ${mapPin.lat.toFixed(4)}, ${mapPin.lng.toFixed(4)}` : (chosenLocation.name?.split(',').slice(0, 3).join(', ') || chosenLocation.name)}</span>
            </div>
          )}

          {/* Travel radius slider */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">How far will you travel?</label>
            <div style={{ padding: '16px 0 4px' }}>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={radiusVal}
                onChange={e => setRadiusVal(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--moss)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--silt)', marginTop: 4 }}>
                <span>&lt; 1 mi</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: radiusVal >= 100 ? 'var(--moss)' : 'var(--ink)' }}>{radiusLabel(radiusVal)}</span>
                <span>Anywhere</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <button onClick={() => setStep(3)} className="btn primary block">
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────── */
  /* STEP 3 — Verify your trade (documents)                          */
  /* ──────────────────────────────────────────────────────────────── */
  if (step === 3) {
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
              <Icon name="back" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Verify your trade</span>
          </div>
        </div>
        <ProgressBar step={3} total={4} />
        <div className="scroll" style={{ padding: '20px 22px' }}>
          <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
            Step 03 / 04
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '12px 0 6px' }}>
            Upload your documents.
          </h2>
          <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
            Upload public liability insurance and any trade certificates. We review within 48 hours.
          </p>

          <div className="stack">
            {/* Public liability insurance */}
            <div>
              <label className="label">Public liability insurance</label>
              <input
                ref={insuranceInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleInsuranceFile}
              />
              {insuranceFile ? (
                <div style={{ border: '1.5px solid var(--moss)', borderRadius: 12, padding: '14px 16px', background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>
                    {insuranceFile.dataUrl.startsWith('data:image') ? '🖼️' : '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{insuranceFile.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--moss)', marginTop: 2 }}>Uploaded ✓</div>
                  </div>
                  <button onClick={() => { setInsuranceFile(null); insuranceInputRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--silt)', fontSize: 18, flexShrink: 0 }}>×</button>
                </div>
              ) : (
                <button
                  onClick={() => insuranceInputRef.current?.click()}
                  style={{ width: '100%', border: '1.5px dashed var(--reed)', borderRadius: 12, padding: '24px 18px', textAlign: 'center', background: 'var(--linen)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  <Icon name="image" size={22} color="var(--silt)" />
                  <div style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>Upload certificate</div>
                  <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>PDF or image · up to 10 MB</div>
                </button>
              )}
            </div>

            {/* Trade certificates (optional) */}
            <div>
              <label className="label">Trade certificates <span style={{ fontWeight: 400, color: 'var(--silt)' }}>(optional, up to 3)</span></label>
              <input
                ref={certInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleCertFile}
              />
              {certFiles.map((f, i) => (
                <div key={i} style={{ border: '1px solid var(--reed)', borderRadius: 10, padding: '12px 14px', background: 'var(--linen)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>
                    {f.dataUrl.startsWith('data:image') ? '🖼️' : '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <button onClick={() => removeCert(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--silt)', fontSize: 18, flexShrink: 0 }}>×</button>
                </div>
              ))}
              {certFiles.length < 3 && (
                <button
                  onClick={() => certInputRef.current?.click()}
                  className="btn ghost block"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Icon name="plus" size={16} /> Add certificate
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <button onClick={() => setStep(4)} className="btn primary block">
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────── */
  /* STEP 4 — Business profile                                       */
  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="screen">
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setStep(3)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="back" />
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Business profile</span>
        </div>
      </div>
      <ProgressBar step={4} total={4} />
      <div className="scroll" style={{ padding: '20px 22px' }}>
        <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
          Step 04 / 04
        </div>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '12px 0 6px' }}>
          Tell boaters about your business.
        </h2>
        <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
          Add photos, a trading name and a short description — this is what boaters see in the marketplace.
        </p>

        <div className="stack">
          {/* Business photos */}
          <div>
            <label className="label">Photos <span style={{ fontWeight: 400, color: 'var(--silt)' }}>(up to 6 — your work, van, workspace…)</span></label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleBizPhoto}
            />
            {bizPhotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {bizPhotos.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--reed)' }} />
                    <button
                      onClick={() => setBizPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            {bizPhotos.length < 6 && (
              <button onClick={() => photoInputRef.current?.click()} className="btn ghost block"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="image" size={16} /> Add photos
              </button>
            )}
          </div>

          {/* Business name */}
          <div>
            <label className="label">Trading name <span style={{ fontWeight: 400, color: 'var(--silt)' }}>(optional)</span></label>
            <input
              className="field"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Canal Sparks Electrical"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">About your business</label>
            <textarea
              className="field"
              value={businessDesc}
              onChange={e => setBusinessDesc(e.target.value)}
              placeholder="Describe your services, experience, qualifications, how you work…"
              rows={5}
              maxLength={2000}
              style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
            />
            <div style={{ fontSize: 12, color: 'var(--silt)', textAlign: 'right', marginTop: 4 }}>
              {businessDesc.length}/2000
            </div>
          </div>
        </div>

        {saveError && (
          <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.4)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rust)', marginTop: 12 }}>
            {saveError}
          </div>
        )}
      </div>

      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={handleSubmit} disabled={saving} className="btn primary block">
          {saving ? 'Submitting…' : 'Submit for review'}
        </button>
        <button onClick={() => nav('/me')} className="btn text" style={{ fontSize: 14.5 }}>
          Skip — set up listings first
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { compressMany } from '../utils/imageCompress';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Plate from '../components/Plate';

const THING_CATEGORIES = [
  { value: 'engines', label: 'Engines & parts' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'heating', label: 'Heating' },
  { value: 'fittings', label: 'Fittings' },
  { value: 'moorings', label: 'Moorings' },
  { value: 'other', label: 'Other' },
];

const BOAT_CATEGORIES = [
  { value: 'narrowboat', label: 'Narrowboat' },
  { value: 'widebeam', label: 'Widebeam' },
  { value: 'cruiser', label: 'Cruiser' },
  { value: 'other', label: 'Other' },
];

const SERVICE_CATEGORIES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'paint', label: 'Paint & sign' },
  { value: 'survey', label: 'Survey' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'tuition', label: 'Tuition' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export default function CreateListingScreen() {
  const nav = useNavigate();
  const { id: editId } = useParams(); // present when editing an existing listing
  const { user } = useAuth();
  const isTrader = user?.isTrader || false;

  // Non-traders can only list things or boats; traders can also list services
  const typeOptions = isTrader
    ? [{ id: 'thing', label: 'Thing' }, { id: 'boat', label: 'Boat' }, { id: 'service', label: 'Service' }]
    : [{ id: 'thing', label: 'Thing' }, { id: 'boat', label: 'Boat' }];

  const [listingType, setListingType] = useState('thing');
  const [form, setForm] = useState({
    title: '',
    price: '',
    condition: 'good',
    category: 'engines',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]); // base64 data URLs
  const fileInputRef = useRef(null);

  // Location state
  const [pickedLat, setPickedLat] = useState(null);
  const [pickedLng, setPickedLng] = useState(null);
  const [pickedLabel, setPickedLabel] = useState('');
  const [boatMooring, setBoatMooring] = useState(null); // { lat, lng } from latest open logbook entry

  // Nominatim search
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoTimer = useRef(null);

  // Load current mooring from logbook on mount
  useEffect(() => {
    if (!user?.boatId) return;
    api.getLogbook(user.boatId, { limit: 20 }).then(entries => {
      const open = Array.isArray(entries) ? entries.find(e => !e.endDate && !e.left) : null;
      if (open?.lat && open?.lng) setBoatMooring({ lat: open.lat, lng: open.lng, label: open.location });
    }).catch(() => {});
  }, [user?.boatId]);

  // Load existing listing when editing
  useEffect(() => {
    if (!editId) return;
    api.getProduct(editId).then(p => {
      setListingType(p.listingType || 'thing');
      setForm({
        title: p.title || '',
        price: p.price != null ? String(p.price) : '',
        condition: p.condition || 'good',
        category: p.category || 'engines',
        description: p.description || '',
      });
      setPhotos(p.images || []);
      if (p.lat && p.lng) {
        setPickedLat(p.lat);
        setPickedLng(p.lng);
        setPickedLabel(p.location || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
      }
    }).catch(() => {});
  }, [editId]);

  const searchGeo = useCallback((q) => {
    clearTimeout(geoTimer.current);
    if (!q.trim()) { setGeoResults([]); return; }
    geoTimer.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=5&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setGeoResults(data);
      } catch {}
      setGeoLoading(false);
    }, 400);
  }, []);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - photos.length;
    const toAdd = files.slice(0, remaining);
    const dataUrls = await compressMany(toAdd, { maxDim: 1400, quality: 0.8 });
    setPhotos(p => [...p, ...dataUrls.filter(Boolean)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const categories = listingType === 'thing' ? THING_CATEGORIES
    : listingType === 'boat' ? BOAT_CATEGORIES
    : SERVICE_CATEGORIES;

  const canSubmit = form.title.trim() && form.description.trim() && form.price !== '';

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        listingType,
        images: photos,
        lat: pickedLat,
        lng: pickedLng,
      };
      if (editId) {
        await api.updateProduct(editId, body);
      } else {
        await api.createProduct(body);
      }
      nav('/market');
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav('/market')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
          <Icon name="back" size={24} />
        </button>
        <h1>{editId ? 'Edit listing' : 'New listing'}</h1>
        <div style={{ width: 24 }} />
      </div>

      <div className="scroll" style={{ padding: '20px 20px 120px' }}>
        {/* What are you adding? */}
        <div style={{ marginBottom: 20 }}>
          <div className="label">What are you adding?</div>
          <div className="seg" style={{ width: '100%', display: 'flex' }}>
            {typeOptions.map(t => (
              <button key={t.id} className={listingType === t.id ? 'on' : ''}
                onClick={() => { setListingType(t.id); setForm(f => ({ ...f, category: (t.id === 'thing' ? 'engines' : t.id === 'boat' ? 'narrowboat' : 'electrical') })); }}
                style={{ flex: 1 }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Photo grid */}
        <div style={{ marginBottom: 24 }}>
          <div className="label">Photos ({photos.length}/4)</div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            onChange={handlePhotoUpload} style={{ display: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {photos.map((src, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 'var(--r-md)',
                background: `url(${src}) center/cover`, border: '1px solid var(--reed)',
                position: 'relative', cursor: 'pointer',
              }} onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}>
                <div style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>×</div>
              </div>
            ))}
            {photos.length < 4 && (
              <div onClick={() => fileInputRef.current?.click()} style={{
                aspectRatio: '1', borderRadius: 'var(--r-md)',
                border: '2px dashed var(--reed)', background: 'var(--linen)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: 'pointer',
              }}>
                <Icon name="camera" size={22} color="var(--pebble)" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pebble)' }}>Add</span>
              </div>
            )}
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                aspectRatio: '1', borderRadius: 'var(--r-md)',
                background: 'var(--linen)', border: '1px solid var(--reed)',
              }} />
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Title</label>
          <input className="field" value={form.title} onChange={e => set('title', e.target.value)}
            placeholder={listingType === 'boat' ? 'e.g. 57ft Trad Stern Narrowboat' : listingType === 'service' ? 'e.g. Engine servicing' : 'e.g. Stove fan, barely used'} />
        </div>

        {/* Price + Condition */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Price ({'£'})</label>
            <input className="field" type="number" min="0" value={form.price}
              onChange={e => set('price', e.target.value)} placeholder="0 for free" />
          </div>
          {listingType !== 'service' && (
            <div style={{ flex: 1 }}>
              <label className="label">Condition</label>
              <select className="field" value={form.condition} onChange={e => set('condition', e.target.value)}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Category</label>
          <select className="field" value={form.category} onChange={e => set('category', e.target.value)}>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Location */}
        {listingType !== 'service' && (
          <div style={{ marginBottom: 16 }}>
            <div className="label">Location</div>

            {/* Current mooring button */}
            <div
              className="card"
              onClick={() => {
                if (!boatMooring) return;
                setPickedLat(boatMooring.lat);
                setPickedLng(boatMooring.lng);
                setPickedLabel(boatMooring.label || 'Current mooring');
                setGeoQuery('');
                setGeoResults([]);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', cursor: boatMooring ? 'pointer' : 'default',
                marginBottom: 10,
                borderColor: pickedLat && pickedLabel === (boatMooring?.label || 'Current mooring') ? 'var(--moss)' : undefined,
                boxShadow: pickedLat && pickedLabel === (boatMooring?.label || 'Current mooring') ? '0 0 0 2px var(--moss-soft)' : undefined,
                opacity: boatMooring ? 1 : 0.5,
              }}
            >
              <Icon name="boat" size={20} color={boatMooring ? 'var(--moss)' : 'var(--pebble)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Use my boat's live location</div>
                {boatMooring
                  ? <div style={{ fontSize: 12, color: 'var(--pebble)', marginTop: 2 }}>{boatMooring.label || `${boatMooring.lat.toFixed(4)}, ${boatMooring.lng.toFixed(4)}`}</div>
                  : <div style={{ fontSize: 12, color: 'var(--pebble)', marginTop: 2 }}>No open mooring found in logbook</div>
                }
              </div>
              {pickedLat && pickedLabel === (boatMooring?.label || 'Current mooring') && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
                </div>
              )}
            </div>

            {/* Nominatim search */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                  <Icon name="search" size={16} color="var(--pebble)" />
                </div>
                <input
                  className="field"
                  value={geoQuery}
                  onChange={e => { setGeoQuery(e.target.value); searchGeo(e.target.value); }}
                  placeholder="Or search for a location…"
                  style={{ paddingLeft: 36 }}
                />
                {geoLoading && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--pebble)' }}>…</span>
                )}
              </div>
              {geoResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--paper)', border: '1px solid var(--reed)',
                  borderRadius: 'var(--r-md)', marginTop: 4,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
                }}>
                  {geoResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setPickedLat(parseFloat(r.lat));
                        setPickedLng(parseFloat(r.lon));
                        setPickedLabel(r.display_name);
                        setGeoQuery(r.display_name.split(',')[0]);
                        setGeoResults([]);
                      }}
                      style={{
                        padding: '11px 14px', cursor: 'pointer', fontSize: 13,
                        borderBottom: i < geoResults.length - 1 ? '1px solid var(--linen)' : 'none',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.display_name.split(',')[0]}</div>
                      <div style={{ fontSize: 11, color: 'var(--pebble)' }}>{r.display_name.split(',').slice(1, 3).join(',').trim()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected location pill */}
            {pickedLat && pickedLabel && !(pickedLabel === (boatMooring?.label || 'Current mooring')) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                padding: '8px 12px', background: 'var(--moss-soft)',
                borderRadius: 'var(--r-sm)', border: '1px solid var(--moss)',
              }}>
                <Icon name="pin" size={14} color="var(--moss)" />
                <span style={{ flex: 1, fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{pickedLabel.split(',')[0]}</span>
                <button onClick={() => { setPickedLat(null); setPickedLng(null); setPickedLabel(''); setGeoQuery(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--pebble)', padding: 0, lineHeight: 1 }}>×</button>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Description</label>
          <textarea className="field" rows={5} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={listingType === 'boat' ? 'Describe the boat, its history, engine, and any work done...' : 'Describe the item, its condition, and any relevant details...'}
            style={{ resize: 'none' }} />
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        background: 'var(--paper)', borderTop: '1px solid var(--reed)',
        display: 'flex', gap: 12,
      }}>
        {!editId && <button className="btn ghost" style={{ flex: 1 }} onClick={() => nav('/market')}>Cancel</button>}
        {editId && <button className="btn ghost" style={{ flex: 1 }} onClick={() => nav(-1)}>Cancel</button>}
        <button className="btn primary" style={{ flex: 1 }} disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? (editId ? 'Saving...' : 'Publishing...') : (editId ? 'Save changes' : 'Publish listing')}
        </button>
      </div>
    </div>
  );
}

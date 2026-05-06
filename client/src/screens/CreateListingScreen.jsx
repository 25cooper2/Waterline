import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [pickup, setPickup] = useState('boat');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]); // base64 data URLs
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - photos.length;
    const toAdd = files.slice(0, remaining);
    const dataUrls = await Promise.all(toAdd.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    })));
    setPhotos(p => [...p, ...dataUrls]);
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
      // Try to capture current location so distance works for buyers
      let lat = null, lng = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, enableHighAccuracy: false })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }
      await api.createProduct({
        ...form,
        price: parseFloat(form.price) || 0,
        listingType,
        images: photos,
        lat, lng,
      });
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
        <h1>New listing</h1>
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

        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Description</label>
          <textarea className="field" rows={4} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={listingType === 'boat' ? 'Describe the boat, its history, engine, and any work done...' : 'Describe the item, its condition, and any relevant details...'}
            style={{ resize: 'none' }} />
        </div>

        {/* Pickup options */}
        {listingType !== 'service' && (
          <div style={{ marginBottom: 16 }}>
            <div className="label">Pickup</div>
            <div className="stack-sm">
              <label className="card" style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer',
                borderColor: pickup === 'boat' ? 'var(--moss)' : undefined,
                boxShadow: pickup === 'boat' ? '0 0 0 2px var(--moss-soft)' : undefined,
              }}>
                <input type="radio" name="pickup" checked={pickup === 'boat'} onChange={() => setPickup('boat')} style={{ display: 'none' }} />
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${pickup === 'boat' ? 'var(--moss)' : 'var(--reed)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {pickup === 'boat' && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--moss)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>From my boat</div>
                  <Plate>{user?.boatName || 'NB UNKNOWN'}</Plate>
                </div>
                <Icon name="boat" size={20} color="var(--pebble)" />
              </label>

              <label className="card" style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer',
                borderColor: pickup === 'pin' ? 'var(--moss)' : undefined,
                boxShadow: pickup === 'pin' ? '0 0 0 2px var(--moss-soft)' : undefined,
              }}>
                <input type="radio" name="pickup" checked={pickup === 'pin'} onChange={() => setPickup('pin')} style={{ display: 'none' }} />
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${pickup === 'pin' ? 'var(--moss)' : 'var(--reed)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {pickup === 'pin' && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--moss)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Drop a pin</div>
                  <div style={{
                    width: '100%', height: 50, background: 'var(--linen)',
                    borderRadius: 'var(--r-sm)', border: '1px solid var(--reed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="pin" size={18} color="var(--pebble)" />
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        background: 'var(--paper)', borderTop: '1px solid var(--reed)',
        display: 'flex', gap: 12,
      }}>
        <button className="btn ghost" style={{ flex: 1 }}>Save draft</button>
        <button className="btn primary" style={{ flex: 1 }} disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? 'Publishing...' : 'Publish listing'}
        </button>
      </div>
    </div>
  );
}

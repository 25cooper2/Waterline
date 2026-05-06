import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/Icon';
import { compressMany } from '../utils/imageCompress';

const HAZARD_TYPES = [
  { id: 'obstruction',  label: 'Obstruction',        icon: 'warning' },
  { id: 'lock_closure', label: 'Lock closure',        icon: 'lock-open' },
  { id: 'water_level',  label: 'Water level',         icon: 'water' },
  { id: 'crt_works',    label: 'CRT works',           icon: 'wrench' },
  { id: 'theft',        label: 'Theft / antisocial',  icon: 'shield' },
  { id: 'towpath',      label: 'Towpath issue',       icon: 'pin' },
  { id: 'wildlife',     label: 'Wildlife',            icon: 'star' },
  { id: 'other',        label: 'Other',               icon: 'more' },
];

const SEVERITIES = [
  { id: 'low',    label: 'Yellow', tone: 'yellow', sevClass: 'low'  },
  { id: 'medium', label: 'Amber',  tone: 'amber',  sevClass: 'med'  },
  { id: 'high',   label: 'Red',    tone: 'rust',   sevClass: 'high' },
];

export default function ReportHazardScreen() {
  const nav = useNavigate();
  const location = useLocation();
  const [lat]          = useState(location.state?.lat ?? 52.48);
  const [lng]          = useState(location.state?.lng ?? -1.90);
  const [locationName] = useState(location.state?.locationName || 'Current location');

  const [hazardType,  setHazardType]  = useState('');
  const [severity,    setSeverity]    = useState('medium');
  const [description, setDescription] = useState('');
  const [startsAt,    setStartsAt]    = useState('');
  const [endsAt,      setEndsAt]      = useState('');
  const [photos,      setPhotos]      = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const photoInputRef = useRef(null);

  const canSubmit = hazardType && description.trim().length > 0 && !submitting;

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
    const compressed = await compressMany(files, { maxDim: 1200, quality: 0.75 });
    setPhotos(p => [...p, ...compressed.filter(Boolean)]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.reportHazard({
        hazardType, description: description.trim(), severity, lat, lng,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        photos,
      });
      nav('/map');
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav('/map')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
          <Icon name="back" />
        </button>
        <h1>Report a hazard</h1>
      </div>

      <div className="scroll">
        <div style={{ padding: '20px 20px 140px' }}>
          {/* Location card */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="pin" size={20} color="var(--moss)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{locationName}</div>
                <div className="muted" style={{ fontSize: 13 }}>Using pinned location</div>
              </div>
              <button onClick={() => nav('/map')} className="btn text" style={{ fontSize: 14, color: 'var(--moss)', fontWeight: 600, padding: '4px 0' }}>Adjust</button>
            </div>
          </div>

          {/* Hazard type */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>Hazard type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {HAZARD_TYPES.map(t => {
                const selected = hazardType === t.id;
                return (
                  <button key={t.id} onClick={() => setHazardType(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: 10,
                    border: selected ? '2px solid var(--moss)' : '1px solid var(--reed)',
                    background: selected ? 'var(--moss-soft)' : 'var(--paper)',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14,
                    fontWeight: 500, color: 'var(--ink)', textAlign: 'left',
                  }}>
                    <Icon name={t.icon} size={18} color={selected ? 'var(--moss)' : 'var(--silt)'} />
                    <span style={{ flex: 1 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>Severity</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SEVERITIES.map(s => {
                const selected = severity === s.id;
                return (
                  <button key={s.id} onClick={() => setSeverity(s.id)}
                    className={`chip${selected ? ` ${s.tone}` : ''}`}
                    style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: selected ? `2px solid var(--${s.tone})` : '1px solid var(--reed)' }}>
                    <span className={`sev ${s.sevClass}`} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>What did you see?</div>
            <textarea className="field" rows={4} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the hazard so other boaters know what to expect…"
              style={{ resize: 'none' }} />
          </div>

          {/* Dates */}
          <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Starts (optional)</label>
              <input className="field" type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            </div>
            <div>
              <label className="label">Ends (optional)</label>
              <input className="field" type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
            </div>
          </div>

          {/* Photos */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Photos ({photos.length}/3, optional)</div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoUpload} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {photos.map((src, i) => (
                <div key={i} style={{ width: 72, height: 72, borderRadius: 8, background: `url(${src}) center/cover`, border: '1px solid var(--reed)', position: 'relative', cursor: 'pointer' }}
                  onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}>
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>×</div>
                </div>
              ))}
              {photos.length < 3 && (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  style={{ width: 72, height: 72, borderRadius: 8, border: '2px dashed var(--reed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', background: 'transparent', color: 'var(--pebble)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                  <Icon name="camera" size={20} color="var(--pebble)" />
                  Add
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: 'var(--paper)', borderTop: '1px solid var(--reed)', display: 'flex', gap: 10, zIndex: 10 }}>
        <button onClick={() => nav('/map')} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={!canSubmit} className="btn primary" style={{ flex: 1 }}>
          {submitting ? 'Posting…' : 'Post alert'}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/Icon';

const HAZARD_TYPES = [
  { id: 'obstruction',  label: 'Obstruction',       icon: 'warning' },
  { id: 'lock_closure', label: 'Lock closure',      icon: 'lock-open' },
  { id: 'water_level',  label: 'Water level',       icon: 'water' },
  { id: 'crt_works',    label: 'CRT works',         icon: 'wrench' },
  { id: 'theft',        label: 'Theft / antisocial', icon: 'shield' },
  { id: 'towpath',      label: 'Towpath issue',     icon: 'pin' },
  { id: 'wildlife',     label: 'Wildlife',          icon: 'star' },
  { id: 'other',        label: 'Other',             icon: 'more' },
];

const SEVERITIES = [
  { id: 'low',    label: 'Low',    tone: 'moss',  sevClass: 'low' },
  { id: 'medium', label: 'Medium', tone: 'amber', sevClass: 'med' },
  { id: 'high',   label: 'High',   tone: 'rust',  sevClass: 'high' },
];

export default function ReportHazardScreen() {
  const nav = useNavigate();
  const location = useLocation();

  const passedLat = location.state?.lat;
  const passedLng = location.state?.lng;
  const passedLocationName = location.state?.locationName;

  const [lat] = useState(passedLat ?? 52.48);
  const [lng] = useState(passedLng ?? -1.90);
  const [locationName] = useState(passedLocationName || 'Current location');

  const [hazardType, setHazardType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = hazardType && description.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.reportHazard({
        hazardType,
        description: description.trim(),
        severity,
        lat,
        lng,
      });
      nav('/map');
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="screen">
      {/* App bar */}
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav('/map')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
            <Icon name="back" />
          </button>
          <h1>Report a hazard</h1>
        </div>
      </div>

      <div className="scroll">
        <div style={{ padding: '20px 20px 140px' }}>
          {/* Location card */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--moss-soft, rgba(26,107,90,0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="pin" size={20} color="var(--moss)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{locationName}</div>
                <div className="muted" style={{ fontSize: 13 }}>Using your current location</div>
              </div>
              <button
                onClick={() => nav('/map')}
                className="btn text"
                style={{ fontSize: 14, color: 'var(--moss)', fontWeight: 600, padding: '4px 0' }}
              >
                Adjust
              </button>
            </div>
          </div>

          {/* Hazard type */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>Hazard type</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {HAZARD_TYPES.map(t => {
                const selected = hazardType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setHazardType(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: selected ? '2px solid var(--moss)' : '1px solid var(--reed)',
                      background: selected ? 'var(--moss-soft, rgba(26,107,90,0.08))' : 'var(--paper)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      textAlign: 'left',
                    }}
                  >
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
                  <button
                    key={s.id}
                    onClick={() => setSeverity(s.id)}
                    className={`chip${selected ? ` ${s.tone}` : ''}`}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: selected ? `2px solid var(--${s.tone})` : '1px solid var(--reed)',
                    }}
                  >
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
            <textarea
              className="field"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the hazard so other boaters know what to expect..."
              style={{ resize: 'none' }}
            />
          </div>

          {/* Add photo */}
          <button
            className="btn ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}
            onClick={() => {/* Photo upload not yet wired */}}
          >
            <Icon name="camera" size={18} />
            Add photo (optional)
          </button>

          {/* Error */}
          {error && <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 20px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'var(--paper)',
        borderTop: '1px solid var(--reed)',
        display: 'flex',
        gap: 10,
        zIndex: 10,
      }}>
        <button
          onClick={() => nav('/map')}
          className="btn ghost"
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn primary"
          style={{ flex: 1 }}
        >
          {submitting ? 'Posting...' : 'Post alert'}
        </button>
      </div>
    </div>
  );
}

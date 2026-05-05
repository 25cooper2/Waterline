import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

const SEV_CHIP = { high: 'rust', medium: 'amber', low: 'moss' };
const SEV_CLASS = { high: 'high', medium: 'med', low: 'low' };

const TYPE_LABELS = {
  debris: 'Debris',
  underwater_obstruction: 'Obstruction',
  shallow_water: 'Water level',
  weather_warning: 'Weather',
  lock_closure: 'Lock closure',
  obstruction: 'Obstruction',
  water_level: 'Water level',
  crt_works: 'CRT works',
  theft: 'Theft / antisocial',
  towpath: 'Towpath issue',
  wildlife: 'Wildlife',
  other: 'Other',
};

function timeAgo(date) {
  if (!date) return '--';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HazardDetailScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const hazard = location.state?.hazard;
  const [confirming, setConfirming] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [done, setDone] = useState(null); // 'confirmed' | 'resolved'

  if (!hazard) {
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => nav('/map')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
              <Icon name="back" />
            </button>
            <h1>Hazard</h1>
          </div>
        </div>
        <div className="scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="warning" size={40} color="var(--pebble)" />
            <p style={{ color: 'var(--silt)', marginTop: 12, fontSize: 15 }}>Hazard not found. Returning to map.</p>
            <button onClick={() => nav('/map')} className="btn primary" style={{ marginTop: 16 }}>Back to map</button>
          </div>
        </div>
      </div>
    );
  }

  const sevChip = SEV_CHIP[hazard.severity] || 'amber';
  const sevClass = SEV_CLASS[hazard.severity] || 'med';
  const sevLabel = hazard.severity ? hazard.severity.charAt(0).toUpperCase() + hazard.severity.slice(1) : 'Medium';
  const typeLabel = TYPE_LABELS[hazard.hazardType] || hazard.hazardType || 'Hazard';
  const reporterName = hazard.reportedBy?.displayName || 'Anonymous boater';
  const reporterPlate = hazard.reportedBy?.boatIndexNumber;
  const reporterVerified = hazard.reportedBy?.isVerified;
  const confirmCount = hazard.confirmations?.length || hazard.confirmCount || 0;
  const expiresAt = hazard.expiresAt;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)) : null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.confirmHazard(id);
      setDone('confirmed');
    } catch { }
    setConfirming(false);
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.resolveHazard(id);
      setDone('resolved');
    } catch { }
    setResolving(false);
  };

  return (
    <div className="screen">
      {/* App bar */}
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav('/map')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
            <Icon name="back" />
          </button>
          <h1>Hazard</h1>
        </div>
        <button style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}>
          <Icon name="more" size={22} />
        </button>
      </div>

      <div className="scroll">
        {/* Image placeholder */}
        <div style={{
          height: 220,
          background: 'var(--linen, #F5F0EB)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: 'var(--pebble)',
        }}>
          <Icon name="camera" size={36} color="var(--pebble)" />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Hazard photo</span>
        </div>

        <div style={{ padding: '20px 20px 120px' }}>
          {/* Severity badge + type chip */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className={`chip ${sevChip}`} style={{ cursor: 'default' }}>
              <span className={`sev ${sevClass}`} />
              {sevLabel}
            </span>
            <span className="chip" style={{ cursor: 'default', background: 'transparent', border: '1px solid var(--reed)' }}>
              {typeLabel}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
            {hazard.title || typeLabel}
          </h1>

          {/* Location row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--silt)', fontSize: 14 }}>
            <Icon name="pin" size={16} color="var(--silt)" />
            <span>{hazard.locationName || `${hazard.lat?.toFixed(4)}, ${hazard.lng?.toFixed(4)}`}</span>
          </div>

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 24,
          }}>
            <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--silt)', marginBottom: 4, fontWeight: 500 }}>Reported</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{timeAgo(hazard.createdAt)}</div>
            </div>
            <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--silt)', marginBottom: 4, fontWeight: 500 }}>Confirmed</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{confirmCount} boater{confirmCount !== 1 ? 's' : ''}</div>
            </div>
            <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--silt)', marginBottom: 4, fontWeight: 500 }}>Expires</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{daysLeft != null ? `${daysLeft}d left` : '--'}</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Description</div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink)' }}>
              {hazard.description || 'No description provided.'}
            </p>
          </div>

          {/* Reported by */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Reported by</div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                <Avatar name={reporterName} src={hazard.reportedBy?.profilePhotoUrl} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{reporterName}</span>
                    {reporterPlate && <Plate>{reporterPlate}</Plate>}
                    {reporterVerified && <Icon name="verified" size={16} color="var(--moss)" />}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {hazard.reportedBy?.hazardsReported != null
                      ? `${hazard.reportedBy.hazardsReported} hazards reported`
                      : 'Community member'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div style={{
            background: 'var(--moss-soft, rgba(26,107,90,0.08))',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 24,
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--moss)', marginBottom: 6 }}>Is this still here?</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--silt)' }}>
              Help fellow boaters by confirming if this hazard is still present, or let the community know it has been cleared.
            </p>
          </div>

          {/* Done feedback */}
          {done && (
            <div className="card" style={{ textAlign: 'center', padding: 20, marginBottom: 16 }}>
              <Icon name="check" size={28} color="var(--moss)" />
              <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 500, color: 'var(--moss)' }}>
                {done === 'confirmed' ? 'Thanks! You confirmed this hazard.' : 'Thanks! Marked as cleared.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      {!done && (
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
            onClick={handleResolve}
            disabled={resolving}
            className="btn ghost"
            style={{ flex: 1 }}
          >
            {resolving ? 'Sending...' : 'Not here anymore'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="btn primary"
            style={{ flex: 1 }}
          >
            {confirming ? 'Sending...' : "It's still here"}
          </button>
        </div>
      )}
    </div>
  );
}

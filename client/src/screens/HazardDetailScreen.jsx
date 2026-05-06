import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

const SEV_CHIP    = { high: 'rust',   medium: 'amber', low: 'yellow' };
const SEV_LABELS  = { high: 'Red',    medium: 'Amber', low: 'Yellow' };
const SEV_CLASS   = { high: 'high',   medium: 'med',   low: 'low'    };

const TYPE_LABELS = {
  debris: 'Debris', underwater_obstruction: 'Obstruction',
  shallow_water: 'Water level', weather_warning: 'Weather',
  lock_closure: 'Lock closure', obstruction: 'Obstruction',
  water_level: 'Water level', crt_works: 'CRT works',
  theft: 'Theft / antisocial', towpath: 'Towpath issue',
  wildlife: 'Wildlife', other: 'Other',
};

function timeAgo(date) {
  if (!date) return '--';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HazardDetailScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hazard = location.state?.hazard;
  const [confirming, setConfirming] = useState(false);
  const [resolving, setResolving]   = useState(false);
  const [done, setDone]             = useState(null);

  if (!hazard) {
    return (
      <div className="screen">
        <div className="appbar">
          <button onClick={() => nav('/map')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
            <Icon name="back" />
          </button>
          <h1>Hazard</h1>
        </div>
        <div className="scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="warning" size={40} color="var(--pebble)" />
            <p style={{ color: 'var(--silt)', marginTop: 12, fontSize: 15 }}>Hazard not found.</p>
            <button onClick={() => nav('/map')} className="btn primary" style={{ marginTop: 16 }}>Back to map</button>
          </div>
        </div>
      </div>
    );
  }

  const sevChip     = SEV_CHIP[hazard.severity]   || 'amber';
  const sevClass    = SEV_CLASS[hazard.severity]   || 'med';
  const sevLabel    = SEV_LABELS[hazard.severity]  || 'Amber';
  const typeLabel   = TYPE_LABELS[hazard.hazardType] || hazard.hazardType || 'Hazard';
  const reporterName = hazard.reportedBy?.displayName || 'Anonymous boater';
  const confirmCount = hazard.confirmedBy?.length || hazard.confirmCount || 0;
  const daysLeft    = hazard.expiresAt
    ? Math.max(0, Math.ceil((new Date(hazard.expiresAt) - Date.now()) / 86400000))
    : null;

  const isAdmin         = user?.role === 'admin';
  const isAdminReport   = hazard.source === 'admin';
  const canResolve      = !isAdminReport || isAdmin;
  const firstPhoto      = hazard.photos?.[0];

  const handleConfirm = async () => {
    setConfirming(true);
    try { await api.confirmHazard(id); setDone('confirmed'); } catch {}
    setConfirming(false);
  };
  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.resolveHazard(id);
      setDone('resolved');
      setTimeout(() => nav('/map'), 900);
    } catch {}
    setResolving(false);
  };

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav('/map')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
          <Icon name="back" />
        </button>
        <h1>Hazard</h1>
        {isAdminReport && (
          <span className="chip moss" style={{ fontSize: 11, cursor: 'default' }}>Admin</span>
        )}
      </div>

      {/* Scrollable content — paddingBottom reserves space for fixed bottom bar */}
      <div className="scroll">
        {/* Photo / placeholder */}
        <div style={{
          height: 200, flexShrink: 0,
          background: firstPhoto ? `url(${firstPhoto}) center/cover` : 'var(--linen)',
          display: firstPhoto ? 'block' : 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          gap: 8, color: 'var(--pebble)',
        }}>
          {!firstPhoto && <>
            <Icon name="camera" size={36} color="var(--pebble)" />
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>No photo</span>
          </>}
        </div>

        <div style={{ padding: '20px 20px 120px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className={`chip ${sevChip}`} style={{ cursor: 'default' }}>
              <span className={`sev ${sevClass}`} />
              {sevLabel}
            </span>
            <span className="chip" style={{ cursor: 'default', background: 'transparent', border: '1px solid var(--reed)' }}>
              {typeLabel}
            </span>
            {isAdminReport && (
              <span className="chip amber" style={{ cursor: 'default', fontSize: 11 }}>Official report</span>
            )}
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
            {hazard.title || typeLabel}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, color: 'var(--silt)', fontSize: 14 }}>
            <Icon name="pin" size={16} color="var(--silt)" />
            <span>{hazard.locationName || `${hazard.lat?.toFixed(4)}, ${hazard.lng?.toFixed(4)}`}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
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
              <div style={{ fontSize: 15, fontWeight: 600 }}>{daysLeft != null ? `${daysLeft}d` : '--'}</div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Description</div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink)' }}>
              {hazard.description || 'No description provided.'}
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Reported by</div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                <Avatar name={reporterName} src={hazard.reportedBy?.profilePhotoUrl} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{reporterName}</span>
                    {hazard.reportedBy?.boatIndexNumber && <Plate>{hazard.reportedBy.boatIndexNumber}</Plate>}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {isAdminReport ? 'Official admin report' : 'Community member'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--moss-soft)', borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--moss)', marginBottom: 6 }}>Is this still here?</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--silt)' }}>
              Help fellow boaters by confirming if this hazard is still present, or let the community know it has been cleared.
              {isAdminReport && !isAdmin && ' Only admins can clear official reports.'}
            </p>
          </div>

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

      {/* Fixed bottom bar */}
      {!done && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'var(--paper)', borderTop: '1px solid var(--reed)',
          display: 'flex', gap: 10, zIndex: 10,
        }}>
          {canResolve && (
            <button onClick={handleResolve} disabled={resolving} className="btn ghost" style={{ flex: 1 }}>
              {resolving ? 'Sending…' : 'Not here anymore'}
            </button>
          )}
          <button onClick={handleConfirm} disabled={confirming} className="btn primary" style={{ flex: 1 }}>
            {confirming ? 'Sending…' : "It's still here"}
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import LoginWall from '../components/LoginWall';

/* ── inline styles ─────────────────────────────────────────────── */

const styles = {
  /* large header */
  header: {
    padding: '24px 20px 20px',
    background: 'var(--paper)',
    borderBottom: '1px solid var(--reed)',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
    color: 'var(--ink)',
  },
  headerSub: {
    fontSize: 14,
    color: 'var(--silt)',
    marginTop: 4,
    fontWeight: 500,
  },

  /* year stat cards */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    padding: '16px 20px 4px',
  },
  statCard: {
    background: 'var(--linen)',
    borderRadius: 'var(--r-lg)',
    padding: '16px 18px',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--silt)',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--ink)',
    lineHeight: 1.1,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--silt)',
    marginLeft: 4,
  },

  /* timeline */
  timeline: {
    position: 'relative',
    padding: '8px 20px 100px 20px',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 39,
    width: 2,
    background: 'var(--reed)',
  },
  timelineEntry: {
    position: 'relative',
    display: 'flex',
    gap: 16,
    paddingBottom: 28,
  },
  /* dots */
  dotCol: {
    width: 18,
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 2,
    position: 'relative',
    zIndex: 1,
  },
  dotCurrent: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--moss)',
    border: '3px solid var(--moss-soft)',
    boxShadow: '0 0 0 2px var(--moss)',
  },
  dotPast: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--paper)',
    border: '2px solid var(--pebble)',
    marginTop: 2,
  },
  /* entry content */
  entryBody: {
    flex: 1,
    minWidth: 0,
  },
  entryDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--silt)',
    marginBottom: 3,
  },
  entryStatus: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--moss)',
    marginBottom: 4,
  },
  entryLocation: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--ink)',
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    marginBottom: 6,
  },
  entryMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    fontSize: 13,
    color: 'var(--silt)',
    fontWeight: 500,
  },
  entryMetaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  entryNotes: {
    fontSize: 14,
    color: 'var(--ink)',
    lineHeight: 1.5,
    marginTop: 8,
  },

  /* FAB */
  fab: {
    position: 'fixed',
    bottom: 90,
    right: 20,
    height: 48,
    borderRadius: 'var(--r-pill)',
    background: 'var(--ink)',
    color: 'var(--paper)',
    border: 'none',
    padding: '0 20px 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    boxShadow: 'var(--sh-3)',
    zIndex: 100,
    letterSpacing: '-0.005em',
    transition: 'transform 80ms',
    maxWidth: 480,
  },

  /* full-screen overlay form */
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'var(--paper)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slide-up 260ms ease-out',
  },
  overlayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--reed)',
    flexShrink: 0,
  },
  overlayTitle: {
    fontSize: 19,
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.015em',
  },
  overlayClose: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--linen)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  overlayScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px 40px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  locationField: {
    position: 'relative',
  },
  locationIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: 'var(--pebble)',
  },
  photosRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: 'var(--r-md)',
    border: '2px dashed var(--reed)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--pebble)',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 120ms',
  },
};

/* ── helpers ───────────────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

function daysBetween(a, b) {
  if (!a) return 0;
  const d1 = new Date(a);
  const d2 = b ? new Date(b) : new Date();
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

/* ── main component ────────────────────────────────────────────── */

export default function LogbookScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const checkinHandled = useRef(false);

  const blankForm = {
    startLocation: '',
    arrived: new Date().toISOString().split('T')[0],
    left: '',
    notes: '',
    distance: '',
    locks: '',
  };
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');

  /* ── handle check-in from map ─────────────────────────────── */
  useEffect(() => {
    const s = location.state;
    if (!s?.checkin || checkinHandled.current) return;
    checkinHandled.current = true;
    // Open the new entry form immediately
    setShowNew(true);
    setForm(f => ({ ...f, arrived: new Date().toISOString().split('T')[0] }));

    // Reverse-geocode the pin coordinates to a place name
    if (s.lat != null && s.lng != null) {
      setForm(f => ({ ...f, startLocation: `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` }));
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${s.lat}&lon=${s.lng}&zoom=14`)
        .then(r => r.json())
        .then(data => {
          if (data?.display_name) {
            const name = data.display_name.split(',').slice(0, 2).join(',').trim();
            setForm(f => ({ ...f, startLocation: name }));
          }
        })
        .catch(() => {});
    }

    // Clear the location state so refreshing doesn't re-trigger
    window.history.replaceState({}, '');
  }, [location.state]);

  useEffect(() => {
    if (!user) return setLoading(false);
    if (!user.boatId) return setLoading(false);
    api.getLogbook(user.boatId)
      .then(data => setEntries(data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  /* computed stats */
  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    let totalNights = 0;
    let totalMiles = 0;
    let yearMiles = 0;
    let yearLocks = 0;

    entries.forEach(e => {
      const nights = daysBetween(e.entryDate || e.arrived, e.endDate || e.left);
      totalNights += nights;
      const mi = parseFloat(e.distance) || 0;
      totalMiles += mi;
      const entryYear = new Date(e.entryDate || e.arrived || '').getFullYear();
      if (entryYear === year) {
        yearMiles += mi;
        yearLocks += parseInt(e.locks, 10) || 0;
      }
    });

    return { totalNights, totalMiles: Math.round(totalMiles * 10) / 10, yearMiles: Math.round(yearMiles * 10) / 10, yearLocks };
  }, [entries]);

  /* is this entry the current mooring? (first entry without an endDate) */
  const currentIndex = useMemo(() => {
    return entries.findIndex(e => !e.endDate && !e.left);
  }, [entries]);

  /* submit new entry */
  const submitEntry = async () => {
    setFormError('');
    try {
      const body = {
        boatId: user.boatId,
        entryDate: form.arrived,
        startLocation: form.startLocation,
        endLocation: form.startLocation,
        distance: form.distance ? parseFloat(form.distance) : undefined,
        notes: form.notes,
        locks: form.locks ? parseInt(form.locks, 10) : undefined,
      };
      if (form.left) body.endDate = form.left;
      const entry = await api.createLogEntry(body);
      setEntries(prev => [entry, ...prev]);
      setShowNew(false);
      setForm(blankForm);
    } catch (e) {
      setFormError(e.message);
    }
  };

  /* ── guards ────────────────────────────────────────────────── */
  if (!user) return <LoginWall tab="logbook" />;

  if (!user.boatId) {
    return (
      <div className="screen">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="boat" size={36} color="var(--moss)" />
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.015em', margin: '0 0 12px', lineHeight: 1.15 }}>
            No boat registered yet.
          </h2>
          <p style={{ color: 'var(--silt)', fontSize: 15, lineHeight: 1.55, maxWidth: 320, margin: 0 }}>
            Add your boat to start logging your journeys, miles and locks.
          </p>
          <button onClick={() => nav('/me')} className="btn primary" style={{ marginTop: 28, minWidth: 200 }}>
            Go to profile
          </button>
        </div>
      </div>
    );
  }

  /* ── main render ───────────────────────────────────────────── */
  return (
    <div className="screen">
      {/* ── app bar ──────────────────────────────────────────── */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Logbook</h1>
        {!loading && entries.length > 0 && (
          <div style={styles.headerSub}>
            {stats.totalNights} night{stats.totalNights !== 1 ? 's' : ''} aboard{' '}
            &middot; {stats.totalMiles} mile{stats.totalMiles !== 1 ? 's' : ''} cruised
          </div>
        )}
      </div>

      {/* ── scrollable body ─────────────────────────────────── */}
      <div className="scroll">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>Loading&hellip;</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="logbook" size={40} color="var(--pebble)" />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No entries yet</p>
            <p style={{ fontSize: 14 }}>Tap the button below to log your first journey.</p>
          </div>
        ) : (
          <>
            {/* year stat cards */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>This year miles</div>
                <div>
                  <span style={styles.statValue}>{stats.yearMiles}</span>
                  <span style={styles.statUnit}>mi</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Locks</div>
                <div>
                  <span style={styles.statValue}>{stats.yearLocks}</span>
                  <span style={styles.statUnit}>worked</span>
                </div>
              </div>
            </div>

            {/* timeline */}
            <div style={styles.timeline}>
              <div style={styles.timelineLine} />

              {entries.map((entry, i) => {
                const isCurrent = i === currentIndex;
                const loc = entry.startLocation && entry.endLocation && entry.startLocation !== entry.endLocation
                  ? `${entry.startLocation} → ${entry.endLocation}`
                  : entry.startLocation || entry.endLocation || 'Unknown';
                const nights = daysBetween(entry.entryDate || entry.arrived, entry.endDate || entry.left);
                const mi = parseFloat(entry.distance) || 0;
                const locks = parseInt(entry.locks, 10) || 0;

                return (
                  <div key={entry._id || i} style={styles.timelineEntry}>
                    {/* dot */}
                    <div style={styles.dotCol}>
                      <div style={isCurrent ? styles.dotCurrent : styles.dotPast} />
                    </div>

                    {/* content */}
                    <div style={styles.entryBody}>
                      <div style={styles.entryDate}>{fmtDate(entry.entryDate || entry.arrived)}</div>
                      {isCurrent && <div style={styles.entryStatus}>Moored here</div>}
                      <div style={styles.entryLocation}>{loc}</div>

                      <div style={styles.entryMeta}>
                        {nights > 0 && (
                          <span style={styles.entryMetaItem}>
                            {nights} night{nights !== 1 ? 's' : ''}
                          </span>
                        )}
                        {mi > 0 && (
                          <span style={styles.entryMetaItem}>
                            {mi} mi
                          </span>
                        )}
                        {locks > 0 && (
                          <span style={styles.entryMetaItem}>
                            {locks} lock{locks !== 1 ? 's' : ''}
                          </span>
                        )}
                        {entry.photos && entry.photos.length > 0 && (
                          <span style={styles.entryMetaItem}>
                            <Icon name="camera" size={13} color="var(--silt)" />
                            {entry.photos.length}
                          </span>
                        )}
                      </div>

                      {entry.notes && <div style={styles.entryNotes}>{entry.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── FAB ──────────────────────────────────────────────── */}
      <button style={styles.fab} onClick={() => setShowNew(true)}>
        <Icon name="plus" size={18} color="var(--paper)" />
        New entry
      </button>

      {/* ── new entry overlay ────────────────────────────────── */}
      {showNew && (
        <div style={styles.overlay}>
          {/* overlay header */}
          <div style={styles.overlayHeader}>
            <h2 style={styles.overlayTitle}>New entry</h2>
            <button style={styles.overlayClose} onClick={() => { setShowNew(false); setFormError(''); }}>
              <Icon name="close" size={18} color="var(--ink)" />
            </button>
          </div>

          {/* overlay form */}
          <div style={styles.overlayScroll}>
            <div className="stack">
              {/* Where */}
              <div>
                <label className="label">Where</label>
                <div style={styles.locationField}>
                  <span style={styles.locationIcon}>
                    <Icon name="pin" size={18} color="var(--pebble)" />
                  </span>
                  <input
                    className="field"
                    style={{ paddingLeft: 40 }}
                    value={form.startLocation}
                    onChange={e => setForm(f => ({ ...f, startLocation: e.target.value }))}
                    placeholder="e.g. Braunston Marina"
                  />
                </div>
              </div>

              {/* Arrived / Left */}
              <div style={styles.fieldRow}>
                <div>
                  <label className="label">Arrived</label>
                  <input
                    className="field"
                    type="date"
                    value={form.arrived}
                    onChange={e => setForm(f => ({ ...f, arrived: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Left</label>
                  <input
                    className="field"
                    type="date"
                    value={form.left}
                    onChange={e => setForm(f => ({ ...f, left: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="field"
                  rows={4}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Anything worth remembering..."
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Photos */}
              <div>
                <label className="label">Photos</label>
                <div style={styles.photosRow}>
                  <button type="button" style={styles.photoAdd}>
                    <Icon name="camera" size={20} color="var(--pebble)" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Locks / Miles */}
              <div style={styles.fieldRow}>
                <div>
                  <label className="label">Locks</label>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    value={form.locks}
                    onChange={e => setForm(f => ({ ...f, locks: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Miles</label>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.distance}
                    onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {formError && <div className="error-msg">{formError}</div>}

              <button onClick={submitEntry} className="btn primary block">
                Save entry
              </button>

              <button onClick={() => { setShowNew(false); setFormError(''); }} className="btn text block" style={{ textAlign: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

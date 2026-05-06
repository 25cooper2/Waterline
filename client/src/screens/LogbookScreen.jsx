import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import LoginWall from '../components/LoginWall';
import { compressMany } from '../utils/imageCompress';

/* ── inline styles ─────────────────────────────────────────────── */

const styles = {
  header: { padding: '24px 20px 20px', background: 'var(--paper)', borderBottom: '1px solid var(--reed)', flexShrink: 0 },
  headerTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' },
  headerSub: { fontSize: 14, color: 'var(--silt)', marginTop: 4, fontWeight: 500 },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 20px 4px' },
  statCard: { background: 'var(--linen)', borderRadius: 'var(--r-lg)', padding: '16px 18px' },
  statLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1 },
  statUnit: { fontSize: 14, fontWeight: 500, color: 'var(--silt)', marginLeft: 4 },
  timeline: { position: 'relative', padding: '8px 20px 100px 20px' },
  timelineLine: { position: 'absolute', top: 0, bottom: 0, left: 39, width: 2, background: 'var(--reed)' },
  timelineEntry: { position: 'relative', display: 'flex', gap: 16, paddingBottom: 28, cursor: 'pointer' },
  dotCol: { width: 18, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 2, position: 'relative', zIndex: 1 },
  dotCurrent: { width: 14, height: 14, borderRadius: '50%', background: 'var(--moss)', border: '3px solid var(--moss-soft)', boxShadow: '0 0 0 2px var(--moss)' },
  dotPast: { width: 10, height: 10, borderRadius: '50%', background: 'var(--paper)', border: '2px solid var(--pebble)', marginTop: 2 },
  dotGap: { width: 10, height: 10, borderRadius: '50%', background: 'var(--reed)', border: '2px dashed var(--pebble)', marginTop: 2 },
  entryBody: { flex: 1, minWidth: 0 },
  entryDate: { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)', marginBottom: 3 },
  entryStatus: { fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--moss)', marginBottom: 4 },
  entryLocation: { fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 6 },
  entryMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13, color: 'var(--silt)', fontWeight: 500 },
  entryMetaItem: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  entryNotes: { fontSize: 14, color: 'var(--ink)', lineHeight: 1.5, marginTop: 8 },
  fab: { position: 'fixed', bottom: 90, right: 20, height: 48, borderRadius: 'var(--r-pill)', background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '0 20px 0 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer', boxShadow: 'var(--sh-3)', zIndex: 100 },
  overlay: { position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'slide-up 260ms ease-out' },
  overlayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--reed)', flexShrink: 0 },
  overlayTitle: { fontSize: 19, fontWeight: 600, margin: 0, letterSpacing: '-0.015em' },
  overlayClose: { width: 40, height: 40, borderRadius: '50%', background: 'var(--linen)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  overlayScroll: { flex: 1, overflowY: 'auto', padding: '20px 20px 40px' },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  locationField: { position: 'relative', display: 'flex', gap: 8 },
  locationIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--pebble)' },
  photosRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  photoAdd: { width: 72, height: 72, borderRadius: 'var(--r-md)', border: '2px dashed var(--reed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', background: 'transparent', color: 'var(--pebble)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)' },
  /* map picker overlay */
  mapPickerOverlay: { position: 'fixed', inset: 0, zIndex: 3000, background: 'var(--paper)', display: 'flex', flexDirection: 'column' },
  mapPickerSearch: { padding: '12px 16px', borderBottom: '1px solid var(--reed)', display: 'flex', gap: 10, alignItems: 'center', background: 'var(--paper)' },
  mapPickerResults: { flex: 1, overflowY: 'auto' },
  mapPickerResult: { padding: '14px 16px', borderBottom: '1px solid var(--reed)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' },
  /* gap row */
  gapRow: { position: 'relative', display: 'flex', gap: 16, paddingBottom: 20, cursor: 'pointer' },
  gapBody: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 },
  gapText: { fontSize: 13, fontWeight: 500, color: 'var(--pebble)', fontStyle: 'italic' },
  gapDays: { fontSize: 11, color: 'var(--pebble)' },
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

/* ── Location picker overlay (search places) ────────────────── */

function LocationPicker({ onSelect, onClose, onPickOnMap }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  const search = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=8&q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data.map(r => ({
          name: r.display_name.split(',').slice(0, 2).join(',').trim(),
          full: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        })));
      } catch { setResults([]); }
    }, 400);
  };

  return (
    <div style={styles.mapPickerOverlay}>
      <div style={styles.overlayHeader}>
        <h2 style={styles.overlayTitle}>Search location</h2>
        <button style={styles.overlayClose} onClick={onClose}>
          <Icon name="close" size={18} color="var(--ink)" />
        </button>
      </div>
      <div style={styles.mapPickerSearch}>
        <Icon name="search" size={18} color="var(--silt)" />
        <input
          autoFocus
          value={q}
          onChange={e => search(e.target.value)}
          placeholder="Search canals, towns, marinas…"
          style={{ border: 0, outline: 0, fontSize: 15, flex: 1, background: 'transparent', fontFamily: 'var(--font-sans)' }}
        />
      </div>
      {/* Pick on map button */}
      <button onClick={onPickOnMap} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
        borderBottom: '1px solid var(--reed)', background: 'var(--linen)',
        border: 'none', width: '100%',
        cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
        color: 'var(--moss)',
      }}>
        <Icon name="pin" size={18} color="var(--moss)" />
        Pick on map
      </button>

      <div style={styles.mapPickerResults}>
        {results.length === 0 && q.length >= 2 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--silt)', fontSize: 14 }}>Searching…</div>
        )}
        {results.map((r, i) => (
          <div key={i} style={styles.mapPickerResult} onClick={() => onSelect(r)}>
            <Icon name="pin" size={16} color="var(--silt)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }} className="truncate">{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 1 }} className="truncate">{r.full}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── main component ────────────────────────────────────────────── */

export default function LogbookScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // entry being edited
  const [expandedId, setExpandedId] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const checkinHandled = useRef(false);

  const blankForm = {
    startLocation: '',
    lat: null,
    lng: null,
    arrived: new Date().toISOString().split('T')[0],
    left: '',
    notes: '',
    distance: '',
    locks: '',
    photos: [],
  };
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const photoInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - (form.photos?.length || 0);
    const toAdd = files.slice(0, remaining);
    const dataUrls = await compressMany(toAdd, { maxDim: 1400, quality: 0.8 });
    setForm(f => ({ ...f, photos: [...(f.photos || []), ...dataUrls.filter(Boolean)] }));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Delete this logbook entry? This cannot be undone.')) return;
    try {
      await api.deleteLogEntry(entryId);
      setEntries(prev => prev.filter(e => e._id !== entryId));
      setExpandedId(null);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  /* ── handle check-in or location pick from map ─────────────── */
  useEffect(() => {
    const s = location.state;
    if (!s || checkinHandled.current) return;
    if (!s.checkin && !s.locationPick) return;
    checkinHandled.current = true;

    if (s.checkin) {
      setShowNew(true);
      setEditingEntry(null);
      setForm(f => ({ ...f, arrived: new Date().toISOString().split('T')[0] }));
    }
    // For locationPick, the form overlay should already be open

    if (s.lat != null && s.lng != null) {
      setForm(f => ({ ...f, lat: s.lat, lng: s.lng, startLocation: `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` }));
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

    if (s.locationPick) {
      setShowNew(true);
      setShowLocationPicker(false);
      // Restore editing context if we were editing before the round-trip
      try {
        const stash = JSON.parse(sessionStorage.getItem('wl_logbook_edit_stash') || 'null');
        if (stash?.entry) {
          setEditingEntry(stash.entry);
          setForm(f => ({ ...stash.form, lat: s.lat ?? f.lat, lng: s.lng ?? f.lng, startLocation: f.startLocation }));
        }
        sessionStorage.removeItem('wl_logbook_edit_stash');
      } catch {}
    }

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

  /* computed stats — prefer route-derived miles/locks (canal-accurate) and
     fall back to the manually-entered values on the entry */
  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    let totalNights = 0, totalMiles = 0, yearMiles = 0, yearLocks = 0;
    entries.forEach(e => {
      totalNights += daysBetween(e.entryDate || e.arrived, e.endDate || e.left);
      const mi = (e.routeDistance != null) ? e.routeDistance : (parseFloat(e.distance) || 0);
      const lk = (e.routeLocks != null) ? e.routeLocks : (parseInt(e.locks, 10) || 0);
      totalMiles += mi;
      const ey = new Date(e.entryDate || e.arrived || '').getFullYear();
      if (ey === year) { yearMiles += mi; yearLocks += lk; }
    });
    return { totalNights, totalMiles: Math.round(totalMiles * 10) / 10, yearMiles: Math.round(yearMiles * 10) / 10, yearLocks };
  }, [entries]);

  const currentIndex = useMemo(() => entries.findIndex(e => !e.endDate && !e.left), [entries]);

  /* Build timeline items.
     Entries are newest-first; the "segment" between two adjacent rows in the
     timeline represents the journey FROM the older entry (entries[i+1]) TO
     the newer one (entries[i]). The cached canal route lives on the newer
     entry as `routeFromEntry` + `routeDistance` + `routeLocks`. */
  const timelineItems = useMemo(() => {
    const items = [];
    entries.forEach((entry, i) => {
      items.push({ type: 'entry', entry, i });
      if (i < entries.length - 1) {
        const older = entries[i + 1];
        const thisEnd = entry.endDate || entry.left;
        const nextStart = older.entryDate || older.arrived;
        const gap = (thisEnd && nextStart) ? daysBetween(nextStart, thisEnd) : null;

        // Do we have a saved canal route for this segment?
        const hasRoute =
          String(entry.routeFromEntry || '') === String(older._id || '') &&
          (entry.routeDistance != null || entry.routeLocks != null);

        if (hasRoute) {
          items.push({
            type: 'segment',
            miles: entry.routeDistance,
            locks: entry.routeLocks,
            days: gap && gap > 1 ? gap : null,
            afterIndex: i,
          });
        } else if (gap == null) {
          // No end date on the newer entry — unknown gap
          items.push({ type: 'gap', days: null, afterIndex: i });
        } else if (gap > 1) {
          items.push({ type: 'gap', days: gap, afterIndex: i });
        }
        // gap === 0 or 1 with no route data: just collapse, no row
      }
    });
    return items;
  }, [entries]);

  /* open entry for editing */
  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      startLocation: entry.startLocation || entry.endLocation || '',
      lat: entry.lat || null,
      lng: entry.lng || null,
      arrived: (entry.entryDate || entry.arrived || '').split('T')[0],
      left: (entry.endDate || entry.left || '').split('T')[0],
      notes: entry.notes || '',
      distance: entry.distance ? String(entry.distance) : '',
      locks: entry.locks ? String(entry.locks) : '',
      photos: entry.photos || [],
    });
    setShowNew(true);
  };

  /* open new entry (for gap fill) */
  const openNewForGap = (afterIndex) => {
    const prevEntry = entries[afterIndex];
    const nextEntry = entries[afterIndex + 1];
    setEditingEntry(null);
    const arrived = prevEntry?.endDate || prevEntry?.left
      ? new Date(prevEntry.endDate || prevEntry.left).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const left = nextEntry?.entryDate || nextEntry?.arrived
      ? new Date(nextEntry.entryDate || nextEntry.arrived).toISOString().split('T')[0]
      : '';
    setForm({ ...blankForm, arrived, left });
    setShowNew(true);
  };

  /* submit (create or update) */
  const submitEntry = async () => {
    setFormError('');
    try {
      const body = {
        boatId: user.boatId,
        entryDate: form.arrived,
        startLocation: form.startLocation,
        endLocation: form.startLocation,
        lat: form.lat,
        lng: form.lng,
        distance: form.distance ? parseFloat(form.distance) : undefined,
        notes: form.notes,
        locks: form.locks ? parseInt(form.locks, 10) : undefined,
        photos: form.photos || [],
      };
      if (form.left) body.endDate = form.left;
      else body.endDate = null;

      if (editingEntry) {
        const updated = await api.updateLogEntry(editingEntry._id, body);
        setEntries(prev => prev.map(e => e._id === editingEntry._id ? updated : e));
      } else {
        const entry = await api.createLogEntry(body);
        setEntries(prev => [entry, ...prev].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)));
      }
      setShowNew(false);
      setEditingEntry(null);
      setForm(blankForm);
    } catch (e) {
      setFormError(e.message);
    }
  };

  const closeForm = () => {
    setShowNew(false);
    setEditingEntry(null);
    setFormError('');
    setForm(blankForm);
  };

  const handleLocationPick = (r) => {
    setForm(f => ({ ...f, startLocation: r.name, lat: r.lat, lng: r.lng }));
    setShowLocationPicker(false);
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
      <div style={{ ...styles.header, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={styles.headerTitle}>Logbook</h1>
          {!loading && entries.length > 0 && (
            <div style={styles.headerSub}>
              {stats.totalNights} night{stats.totalNights !== 1 ? 's' : ''} aboard &middot; {stats.totalMiles} mile{stats.totalMiles !== 1 ? 's' : ''} cruised
            </div>
          )}
        </div>
        {!loading && entries.length > 0 && (
          <button
            aria-label="View on map"
            onClick={() => nav('/map', { state: { logbookOnly: true } })}
            style={{
              width: 44, height: 44, borderRadius: 12, border: '1px solid var(--reed)',
              background: 'var(--linen)', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="map" size={20} color="var(--moss)" />
          </button>
        )}
      </div>

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
            {/* Warning: no open mooring entry */}
            {currentIndex === -1 && entries.length > 0 && (
              <div
                onClick={() => { setEditingEntry(null); setForm(blankForm); setShowNew(true); }}
                style={{
                  margin: '12px 20px 0', padding: '12px 14px',
                  background: 'var(--rust-soft, #fff3f0)', border: '1px solid var(--rust, #c0392b)',
                  borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                }}
              >
                <Icon name="pin" size={18} color="var(--rust, #c0392b)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--rust, #c0392b)' }}>No current mooring logged</div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2 }}>Tap to add where you are now — needed for the map pin and listings.</div>
                </div>
                <Icon name="plus" size={16} color="var(--rust, #c0392b)" />
              </div>
            )}

            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>This year miles</div>
                <div><span style={styles.statValue}>{stats.yearMiles}</span><span style={styles.statUnit}>mi</span></div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Locks</div>
                <div><span style={styles.statValue}>{stats.yearLocks}</span><span style={styles.statUnit}>worked</span></div>
              </div>
            </div>

            <div style={styles.timeline}>
              <div style={styles.timelineLine} />

              {timelineItems.map((item, idx) => {
                if (item.type === 'segment') {
                  // Canal-routed segment between two entries: show miles + locks.
                  // If there's a multi-day gap with no entry filling it, also
                  // surface an "Add missing" button that pre-fills the gap dates.
                  const parts = [];
                  if (item.miles != null) parts.push(`${item.miles} mi`);
                  if (item.locks != null && item.locks > 0) parts.push(`${item.locks} lock${item.locks !== 1 ? 's' : ''}`);
                  if (item.days) parts.push(`${item.days} day${item.days !== 1 ? 's' : ''}`);
                  return (
                    <div key={`seg-${idx}`} style={styles.gapRow}>
                      <div style={styles.dotCol}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pebble)', marginTop: 3 }} />
                      </div>
                      <div style={styles.gapBody}>
                        <Icon name="boat" size={13} color="var(--silt)" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--silt)' }}>
                          {parts.join(' · ') || 'Travelled'}
                        </span>
                        {item.days && item.days > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openNewForGap(item.afterIndex); }}
                            style={{
                              background: 'none', border: '1px solid var(--reed)',
                              borderRadius: 14, padding: '2px 10px', cursor: 'pointer',
                              fontSize: 11, fontWeight: 600, color: 'var(--silt)',
                              fontFamily: 'var(--font-sans)', display: 'inline-flex',
                              alignItems: 'center', gap: 4, marginLeft: 4,
                            }}
                          >
                            <Icon name="plus" size={11} color="var(--silt)" /> Add missing
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                if (item.type === 'gap') {
                  return (
                    <div key={`gap-${idx}`} style={styles.gapRow} onClick={() => openNewForGap(item.afterIndex)}>
                      <div style={styles.dotCol}><div style={styles.dotGap} /></div>
                      <div style={styles.gapBody}>
                        <span style={styles.gapText}>Unknown location</span>
                        {item.days && <span style={styles.gapDays}>&middot; {item.days} day{item.days !== 1 ? 's' : ''}</span>}
                        <Icon name="plus" size={14} color="var(--pebble)" />
                      </div>
                    </div>
                  );
                }

                const { entry, i } = item;
                const isCurrent = i === currentIndex;
                const isExpanded = expandedId === entry._id;
                const loc = entry.startLocation && entry.endLocation && entry.startLocation !== entry.endLocation
                  ? `${entry.startLocation} → ${entry.endLocation}`
                  : entry.startLocation || entry.endLocation || 'Unknown';
                const nights = daysBetween(entry.entryDate || entry.arrived, entry.endDate || entry.left);
                const mi = parseFloat(entry.distance) || 0;
                const locks = parseInt(entry.locks, 10) || 0;

                return (
                  <div key={entry._id || i} style={styles.timelineEntry}
                    onClick={() => setExpandedId(isExpanded ? null : entry._id)}>
                    <div style={styles.dotCol}>
                      <div style={isCurrent ? styles.dotCurrent : styles.dotPast} />
                    </div>
                    <div style={styles.entryBody}>
                      <div style={styles.entryDate}>{fmtDate(entry.entryDate || entry.arrived)}</div>
                      {isCurrent && <div style={styles.entryStatus}>Moored here</div>}
                      <div style={styles.entryLocation}>{loc}</div>
                      <div style={styles.entryMeta}>
                        {nights > 0 && <span style={styles.entryMetaItem}>{nights} night{nights !== 1 ? 's' : ''}</span>}
                        {mi > 0 && <span style={styles.entryMetaItem}>{mi} mi</span>}
                        {locks > 0 && <span style={styles.entryMetaItem}>{locks} lock{locks !== 1 ? 's' : ''}</span>}
                      </div>
                      {entry.notes && <div style={styles.entryNotes}>{entry.notes}</div>}

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn ghost" style={{ fontSize: 13, padding: '6px 14px' }}
                            onClick={(e) => { e.stopPropagation(); openEdit(entry); }}>
                            <Icon name="edit" size={14} /> Edit
                          </button>
                          {!entry.endDate && !entry.left && (
                            <button className="btn ghost" style={{ fontSize: 13, padding: '6px 14px' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const updated = await api.updateLogEntry(entry._id, { endDate: new Date().toISOString().split('T')[0] });
                                  setEntries(prev => prev.map(en => en._id === entry._id ? updated : en));
                                } catch {}
                              }}>
                              Mark as left
                            </button>
                          )}
                          <button className="btn ghost" style={{ fontSize: 13, padding: '6px 14px', color: 'var(--rust)' }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}>
                            <Icon name="trash" size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <button style={styles.fab} onClick={() => { setEditingEntry(null); setForm(blankForm); setShowNew(true); }}>
        <Icon name="plus" size={18} color="var(--paper)" />
        New entry
      </button>

      {/* ── entry form overlay (new + edit) ──────────────────── */}
      {showNew && (
        <div style={styles.overlay}>
          <div style={styles.overlayHeader}>
            <h2 style={styles.overlayTitle}>{editingEntry ? 'Edit entry' : 'New entry'}</h2>
            <button style={styles.overlayClose} onClick={closeForm}>
              <Icon name="close" size={18} color="var(--ink)" />
            </button>
          </div>
          <div style={styles.overlayScroll}>
            <div className="stack">
              {/* Where — text input + map search button */}
              <div>
                <label className="label">Where</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
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
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setShowLocationPicker(true)}
                  >
                    <Icon name="search" size={16} /> Search
                  </button>
                </div>
              </div>

              {/* Arrived / Left */}
              <div style={styles.fieldRow}>
                <div>
                  <label className="label">Arrived</label>
                  <input className="field" type="date" value={form.arrived}
                    onChange={e => setForm(f => ({ ...f, arrived: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Left</label>
                  <input className="field" type="date" value={form.left}
                    onChange={e => setForm(f => ({ ...f, left: e.target.value }))} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes</label>
                <textarea className="field" rows={4} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Anything worth remembering..." style={{ resize: 'none' }} />
              </div>

              {/* Photos */}
              <div>
                <label className="label">Photos ({(form.photos || []).length}/4)</label>
                <input ref={photoInputRef} type="file" accept="image/*" multiple
                  onChange={handlePhotoUpload} style={{ display: 'none' }} />
                <div style={styles.photosRow}>
                  {(form.photos || []).map((src, i) => (
                    <div key={i} style={{
                      width: 72, height: 72, borderRadius: 'var(--r-md)',
                      background: `url(${src}) center/cover`, border: '1px solid var(--reed)',
                      position: 'relative', cursor: 'pointer',
                    }} onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}>
                      <div style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>×</div>
                    </div>
                  ))}
                  {(form.photos || []).length < 4 && (
                    <button type="button" style={styles.photoAdd} onClick={() => photoInputRef.current?.click()}>
                      <Icon name="camera" size={20} color="var(--pebble)" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Locks / Miles */}
              <div style={styles.fieldRow}>
                <div>
                  <label className="label">Locks</label>
                  <input className="field" type="number" min="0" value={form.locks}
                    onChange={e => setForm(f => ({ ...f, locks: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="label">Miles</label>
                  <input className="field" type="number" min="0" step="0.1" value={form.distance}
                    onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} placeholder="0" />
                </div>
              </div>

              {formError && <div className="error-msg">{formError}</div>}

              <button onClick={submitEntry} className="btn primary block">
                {editingEntry ? 'Save changes' : 'Save entry'}
              </button>
              <button onClick={closeForm} className="btn text block" style={{ textAlign: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Location picker overlay */}
      {showLocationPicker && (
        <LocationPicker
          onSelect={handleLocationPick}
          onClose={() => setShowLocationPicker(false)}
          onPickOnMap={() => {
            setShowLocationPicker(false);
            // Stash editing context so we can restore it after the round-trip
            try {
              sessionStorage.setItem('wl_logbook_edit_stash', JSON.stringify({
                entry: editingEntry,
                form,
              }));
            } catch {}
            // Reset checkin handler so the return state triggers
            checkinHandled.current = false;
            nav('/map', {
              state: {
                pickLocationFor: 'logbook',
                lat: form.lat ?? null,
                lng: form.lng ?? null,
              },
            });
          }}
        />
      )}
    </div>
  );
}

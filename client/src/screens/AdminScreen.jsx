import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

/* ── helpers ───────────────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toDateInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0, 10);
}

function downloadCsv(filename, rows, headers) {
  const escape = v => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--reed)',
      borderRadius: 'var(--r-lg)', padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--pebble)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--silt)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

/* ── spreadsheet table (rows clickable when onRowClick provided) ── */

function DataTable({ columns, rows, onDownload, onRowClick }) {
  const thStyle = {
    padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--silt)',
    background: 'var(--linen)', borderBottom: '2px solid var(--reed)',
    position: 'sticky', top: 0,
  };
  const tdStyle = {
    padding: '9px 14px', fontSize: 13, color: 'var(--ink)',
    borderBottom: '1px solid var(--linen)', whiteSpace: 'nowrap',
    maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        {onRowClick && (
          <div style={{ fontSize: 12, color: 'var(--silt)' }}>
            Tap any row to view & edit all fields.
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={onDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--reed)', background: 'var(--paper)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-sans)', color: 'var(--ink)',
            }}
          >
            ↓ Download CSV
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--r-lg)', border: '1px solid var(--reed)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', background: 'var(--paper)' }}>
          <thead>
            <tr>
              {columns.map(c => <th key={c.key} style={thStyle}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--silt)', padding: 32 }}>No data yet</td></tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row._id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  background: i % 2 === 1 ? 'var(--linen)' : 'var(--paper)',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {columns.map(c => (
                  <td key={c.key} style={{ ...tdStyle, background: 'inherit' }}>
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 6, textAlign: 'right' }}>
        {rows.length} row{rows.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

/* ── edit modal ────────────────────────────────────────────────── */

/**
 * Field shape: {
 *   key, label,
 *   type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'images' | 'readonly',
 *   options?: [{value, label}],
 *   help?: string,
 * }
 */
function EditModal({ title, record, fields, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => {
    const o = {};
    for (const f of fields) {
      if (f.type === 'readonly') continue;
      let v = record[f.key];
      if (f.type === 'date') v = toDateInputValue(v);
      if (f.type === 'images') v = Array.isArray(v) ? v.join('\n') : '';
      if (f.type === 'boolean') v = !!v;
      if (v == null) v = '';
      o[f.key] = v;
    }
    return o;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {};
      for (const f of fields) {
        if (f.type === 'readonly') continue;
        let v = form[f.key];
        if (f.type === 'number') v = v === '' ? null : Number(v);
        if (f.type === 'date') v = v ? new Date(v).toISOString() : null;
        if (f.type === 'images') v = String(v).split('\n').map(s => s.trim()).filter(Boolean);
        if (f.type === 'boolean') v = !!v;
        if (typeof v === 'string') v = v.trim() === '' ? null : v;
        payload[f.key] = v;
      }
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this record permanently? This cannot be undone.')) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (e) {
      setError(e.message || 'Delete failed');
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
    border: '1px solid var(--reed)', background: 'var(--paper)',
    fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--ink)',
    boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640, background: 'var(--paper)',
          borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: 24, marginBottom: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--reed)',
          display: 'flex', alignItems: 'center', gap: 10, background: 'var(--linen)',
        }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: 'var(--silt)' }}>×</button>
        </div>

        <div style={{ padding: 18, maxHeight: '70vh', overflowY: 'auto' }}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--silt)', marginBottom: 5,
              }}>{f.label}</label>

              {f.type === 'readonly' && (
                <div style={{ fontSize: 13, color: 'var(--ink)', wordBreak: 'break-word' }}>
                  {f.render ? f.render(record) : (record[f.key] ?? '—')}
                </div>
              )}
              {f.type === 'text' && (
                <input style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />
              )}
              {f.type === 'textarea' && (
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />
              )}
              {f.type === 'number' && (
                <input type="number" style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />
              )}
              {f.type === 'boolean' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)' }}>
                  <input type="checkbox" checked={!!form[f.key]} onChange={e => setField(f.key, e.target.checked)} />
                  {form[f.key] ? 'Yes' : 'No'}
                </label>
              )}
              {f.type === 'select' && (
                <select style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)}>
                  <option value="">— none —</option>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {f.type === 'date' && (
                <input type="date" style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />
              )}
              {f.type === 'images' && (
                <>
                  {String(form[f.key] || '').split('\n').filter(Boolean).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {String(form[f.key]).split('\n').filter(Boolean).map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" style={{
                            width: 72, height: 72, objectFit: 'cover',
                            borderRadius: 6, border: '1px solid var(--reed)',
                          }} />
                        </a>
                      ))}
                    </div>
                  )}
                  <textarea style={{ ...inputStyle, minHeight: 70, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}
                    value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)}
                    placeholder="One image URL per line" />
                </>
              )}
              {f.help && <div style={{ fontSize: 11, color: 'var(--pebble)', marginTop: 4 }}>{f.help}</div>}
            </div>
          ))}

          {error && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.4)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--rust)' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: 14, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8, background: 'var(--linen)' }}>
          {onDelete && (
            <button onClick={handleDelete} disabled={saving}
              style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--rust)', background: 'var(--paper)', color: 'var(--rust)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Delete
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} disabled={saving}
            style={{ padding: '10px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 18px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', fontWeight: 700, fontSize: 14, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── field schemas per record type ─────────────────────────────── */

const userFields = [
  { key: '_id', label: 'User ID', type: 'readonly' },
  { key: 'firstName', label: 'First name', type: 'text' },
  { key: 'surname', label: 'Surname', type: 'text' },
  { key: 'displayName', label: 'Display name', type: 'text' },
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'bio', label: 'Bio', type: 'textarea' },
  { key: 'avatarColor', label: 'Avatar colour (hue 0–360)', type: 'text' },
  { key: 'profilePhotoUrl', label: 'Profile photo URL', type: 'text' },
  { key: 'mooringLocation', label: 'Current mooring (text)', type: 'text' },
  { key: 'mooringLat', label: 'Mooring latitude', type: 'number' },
  { key: 'mooringLng', label: 'Mooring longitude', type: 'number' },
  { key: 'isVerified', label: 'Verified', type: 'boolean' },
  { key: 'verificationStatus', label: 'Verification status', type: 'select', options: [
    { value: 'pending', label: 'Pending' }, { value: 'verified', label: 'Verified' }, { value: 'rejected', label: 'Rejected' },
  ] },
  { key: 'role', label: 'Role', type: 'select', options: [
    { value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' },
  ] },
  { key: 'createdAt', label: 'Joined', type: 'readonly', render: r => fmtDateTime(r.createdAt) },
  { key: 'updatedAt', label: 'Last updated', type: 'readonly', render: r => fmtDateTime(r.updatedAt) },
];

const listingFields = [
  { key: '_id', label: 'Listing ID', type: 'readonly' },
  { key: 'seller', label: 'Seller', type: 'readonly', render: r => `${r.sellerId?.displayName || r.sellerId?.username || '—'} (${r.sellerId?.email || 'no email'})` },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'listingType', label: 'Listing type', type: 'select', options: [
    { value: 'thing', label: 'Thing' }, { value: 'boat', label: 'Boat' }, { value: 'service', label: 'Service' },
  ] },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'price', label: 'Price (£) — 0 means Free', type: 'number' },
  { key: 'condition', label: 'Condition', type: 'select', options: [
    { value: 'new', label: 'New' }, { value: 'like_new', label: 'Like new' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' },
  ] },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'lat', label: 'Latitude', type: 'number' },
  { key: 'lng', label: 'Longitude', type: 'number' },
  { key: 'images', label: 'Photos', type: 'images', help: 'One URL per line. Reorder by moving lines.' },
  { key: 'isAvailable', label: 'Active', type: 'boolean' },
  { key: 'removed', label: 'Removed (soft-deleted)', type: 'boolean' },
  { key: 'removalReason', label: 'Removal reason', type: 'text' },
  { key: 'viewCount', label: 'Unique viewers', type: 'readonly', render: r => (r.viewers?.length ?? 0) },
  { key: 'favCount', label: 'Favourites', type: 'readonly', render: r => (r.favorites?.length ?? 0) },
  { key: 'createdAt', label: 'Listed', type: 'readonly', render: r => fmtDateTime(r.createdAt) },
  { key: 'updatedAt', label: 'Last updated', type: 'readonly', render: r => fmtDateTime(r.updatedAt) },
];

const boatFields = [
  { key: '_id', label: 'Boat ID', type: 'readonly' },
  { key: 'owner', label: 'Owner', type: 'readonly', render: r => `${r.ownerId?.displayName || r.ownerId?.username || '—'} (${r.ownerId?.email || 'no email'})` },
  { key: 'boatName', label: 'Boat name', type: 'text' },
  { key: 'boatIndexNumber', label: 'Boat index no.', type: 'text' },
  { key: 'boatType', label: 'Boat type', type: 'text' },
  { key: 'boatLength', label: 'Length (ft)', type: 'number' },
  { key: 'boatYear', label: 'Year built', type: 'number' },
  { key: 'boatPhotoUrl', label: 'Boat photo URL', type: 'text' },
  { key: 'licenseDocUrl', label: 'Licence document URL', type: 'text' },
  { key: 'ownerContactEmail', label: 'Owner contact email', type: 'text' },
  { key: 'ownerPhone', label: 'Owner phone', type: 'text' },
  { key: 'lastKnownLat', label: 'Last known latitude', type: 'number' },
  { key: 'lastKnownLng', label: 'Last known longitude', type: 'number' },
  { key: 'verificationStatus', label: 'Verification status', type: 'select', options: [
    { value: 'unverified', label: 'Unverified' }, { value: 'pending_approval', label: 'Pending approval' },
    { value: 'verified', label: 'Verified' }, { value: 'rejected', label: 'Rejected' },
  ] },
  { key: 'verificationNotes', label: 'Verification notes', type: 'textarea' },
  { key: 'lastVerifiedAt', label: 'Last verified', type: 'readonly', render: r => fmtDateTime(r.lastVerifiedAt) },
  { key: 'createdAt', label: 'Added', type: 'readonly', render: r => fmtDateTime(r.createdAt) },
];

const hazardFields = [
  { key: '_id', label: 'Hazard ID', type: 'readonly' },
  { key: 'reporter', label: 'Reported by', type: 'readonly', render: r => `${r.reportedBy?.displayName || r.reportedBy?.username || '—'} (${r.reportedBy?.email || 'no email'})` },
  { key: 'hazardType', label: 'Hazard type', type: 'select', options: [
    'debris','underwater_obstruction','shallow_water','weather_warning','lock_closure','obstruction','water_level','crt_works','theft','towpath','wildlife','other',
  ].map(v => ({ value: v, label: v.replace(/_/g, ' ') })) },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'severity', label: 'Severity', type: 'select', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ] },
  { key: 'lat', label: 'Latitude', type: 'number' },
  { key: 'lng', label: 'Longitude', type: 'number' },
  { key: 'isResolved', label: 'Resolved', type: 'boolean' },
  { key: 'source', label: 'Source', type: 'select', options: [
    { value: 'admin', label: 'Admin' }, { value: 'community', label: 'Community' },
  ] },
  { key: 'startsAt', label: 'Starts at', type: 'date' },
  { key: 'expiresAt', label: 'Expires at', type: 'date' },
  { key: 'photos', label: 'Photos', type: 'images', help: 'One URL per line.' },
  { key: 'confirmationCount', label: 'Confirmations', type: 'readonly' },
  { key: 'createdAt', label: 'Reported', type: 'readonly', render: r => fmtDateTime(r.createdAt) },
];

const logFields = [
  { key: '_id', label: 'Log entry ID', type: 'readonly' },
  { key: 'boat', label: 'Boat', type: 'readonly', render: r => r.boatId?.boatName ? `${r.boatId.boatName} (${r.boatId.boatIndexNumber || ''})` : '—' },
  { key: 'entryDate', label: 'Entry date', type: 'date' },
  { key: 'endDate', label: 'End date', type: 'date' },
  { key: 'startLocation', label: 'Start location', type: 'text' },
  { key: 'endLocation', label: 'End location', type: 'text' },
  { key: 'lat', label: 'Latitude', type: 'number' },
  { key: 'lng', label: 'Longitude', type: 'number' },
  { key: 'distance', label: 'Distance (miles)', type: 'number' },
  { key: 'locks', label: 'Locks', type: 'number' },
  { key: 'weather', label: 'Weather', type: 'text' },
  { key: 'conditions', label: 'Conditions', type: 'text' },
  { key: 'fuelUsed', label: 'Fuel used (L)', type: 'number' },
  { key: 'highlights', label: 'Highlights', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'photos', label: 'Photos', type: 'images', help: 'One URL per line.' },
];

const REASON_LABELS = {
  sold_waterline: 'Sold via Waterline',
  sold_elsewhere: 'Sold elsewhere',
  no_longer_needed: 'No longer needed',
};

const TABS = ['Overview', 'Approvals', 'Users', 'Listings', 'Boats', 'Hazards', 'Logbook', 'Removals'];

/* ── main component ────────────────────────────────────────────── */

export default function AdminScreen() {
  const { user, logout } = useAuth();

  // ── inline login state ──
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await api.login(loginForm);
      localStorage.setItem('wl_token', data.token);
      window.location.reload();
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // ── data ──
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [boats, setBoats] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [removals, setRemovals] = useState([]);
  const [pending, setPending] = useState([]);
  const [actioning, setActioning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteMsg, setPromoteMsg] = useState('');

  // edit-modal state: { kind, record }
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    Promise.all([
      api.adminStats(),
      api.adminUsers(),
      api.adminListings(),
      api.adminBoats().catch(() => []),
      api.adminHazards().catch(() => []),
      api.adminLogbooks().catch(() => []),
      api.adminRemovals(),
      api.adminPendingCerts().catch(() => []),
    ]).then(([s, u, l, b, h, lg, r, p]) => {
      setStats(s); setUsers(u); setListings(l); setBoats(b);
      setHazards(h); setLogs(lg); setRemovals(r); setPending(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const approveCert = async (boatId) => {
    setActioning(boatId);
    try {
      await api.adminApproveCert(boatId);
      setPending(p => p.filter(b => b._id !== boatId));
    } catch (e) { alert('Approve failed: ' + e.message); }
    setActioning(null);
  };
  const rejectCert = async (boatId) => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    setActioning(boatId);
    try {
      await api.adminRejectCert(boatId, reason);
      setPending(p => p.filter(b => b._id !== boatId));
    } catch (e) { alert('Reject failed: ' + e.message); }
    setActioning(null);
  };

  const promote = async () => {
    try {
      const res = await api.adminPromote(promoteEmail.trim());
      setPromoteMsg(res.message);
      setPromoteEmail('');
    } catch (e) { setPromoteMsg('Error: ' + e.message); }
  };

  // ── not logged in → inline login wall ──
  if (!user) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Waterline</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Admin dashboard · restricted access</div>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Email</label>
              <input type="email" required autoFocus value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: 'var(--paper)', fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
              <input type="password" required value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: 'var(--paper)', fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {loginError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.5)', borderRadius: 'var(--r-md)', fontSize: 13, color: '#f1a49a' }}>
                {loginError}
              </div>
            )}
            <button type="submit" disabled={loginLoading}
              style={{ width: '100%', padding: 14, borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-sans)', cursor: loginLoading ? 'wait' : 'pointer' }}>
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── logged in but not admin ──
  if (user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--paper)', marginBottom: 8 }}>Access denied</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24 }}>
            {user.email} doesn't have admin access. Contact the site owner to be added.
          </div>
          <button onClick={handleLogout}
            style={{ padding: '10px 24px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sans)', fontSize: 14, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  /* ── column definitions ── */
  const userCols = [
    { key: 'displayName', label: 'Name', render: r => r.displayName || `${r.firstName || ''} ${r.surname || ''}`.trim() || '—' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'isVerified', label: 'Verified', render: r => r.isVerified ? 'Yes' : 'No' },
    { key: 'mooringLocation', label: 'Current mooring' },
    { key: 'createdAt', label: 'Joined', render: r => fmtDate(r.createdAt) },
  ];

  const listingCols = [
    { key: 'photo', label: '', render: r => r.images?.[0]
      ? <img src={r.images[0]} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
      : <div style={{ width: 36, height: 36, background: 'var(--linen)', borderRadius: 4 }} /> },
    { key: 'title', label: 'Title' },
    { key: 'seller', label: 'Seller', render: r => r.sellerId?.displayName || r.sellerId?.username || '—' },
    { key: 'listingType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price (£)', render: r => r.price === 0 ? 'Free' : `£${r.price}` },
    { key: 'isAvailable', label: 'Active', render: r => r.isAvailable ? 'Yes' : 'No' },
    { key: 'removed', label: 'Removed', render: r => r.removed ? 'Yes' : '—' },
    { key: 'photos', label: 'Photos', render: r => r.images?.length ?? 0 },
    { key: 'createdAt', label: 'Listed', render: r => fmtDate(r.createdAt) },
  ];

  const boatCols = [
    { key: 'photo', label: '', render: r => r.boatPhotoUrl
      ? <img src={r.boatPhotoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
      : <div style={{ width: 36, height: 36, background: 'var(--linen)', borderRadius: 4 }} /> },
    { key: 'boatName', label: 'Name' },
    { key: 'boatIndexNumber', label: 'Index no.' },
    { key: 'owner', label: 'Owner', render: r => r.ownerId?.displayName || r.ownerId?.username || '—' },
    { key: 'boatType', label: 'Type' },
    { key: 'boatLength', label: 'Length (ft)' },
    { key: 'boatYear', label: 'Year' },
    { key: 'verificationStatus', label: 'Verification' },
    { key: 'createdAt', label: 'Added', render: r => fmtDate(r.createdAt) },
  ];

  const hazardCols = [
    { key: 'photo', label: '', render: r => r.photos?.[0]
      ? <img src={r.photos[0]} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
      : <div style={{ width: 36, height: 36, background: 'var(--linen)', borderRadius: 4 }} /> },
    { key: 'hazardType', label: 'Type', render: r => r.hazardType?.replace(/_/g, ' ') },
    { key: 'description', label: 'Description' },
    { key: 'severity', label: 'Severity' },
    { key: 'reporter', label: 'Reported by', render: r => r.reportedBy?.displayName || r.reportedBy?.username || '—' },
    { key: 'isResolved', label: 'Resolved', render: r => r.isResolved ? 'Yes' : 'No' },
    { key: 'confirmationCount', label: 'Confirms' },
    { key: 'createdAt', label: 'Reported', render: r => fmtDate(r.createdAt) },
    { key: 'expiresAt', label: 'Expires', render: r => fmtDate(r.expiresAt) },
  ];

  const logCols = [
    { key: 'entryDate', label: 'Date', render: r => fmtDate(r.entryDate) },
    { key: 'boat', label: 'Boat', render: r => r.boatId?.boatName || '—' },
    { key: 'startLocation', label: 'From' },
    { key: 'endLocation', label: 'To' },
    { key: 'distance', label: 'Miles' },
    { key: 'locks', label: 'Locks' },
    { key: 'photos', label: 'Photos', render: r => r.photos?.length ?? 0 },
    { key: 'notes', label: 'Notes' },
  ];

  const removalCols = [
    { key: 'title', label: 'Title' },
    { key: 'seller', label: 'Seller', render: r => r.sellerId?.displayName || r.sellerId?.username || '—' },
    { key: 'listingType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price (£)', render: r => r.price === 0 ? 'Free' : `£${r.price}` },
    { key: 'removalReason', label: 'Reason', render: r => REASON_LABELS[r.removalReason] || r.removalReason },
    { key: 'daysLive', label: 'Days live', render: r => r.daysLive ?? '—' },
    { key: 'removedAt', label: 'Removed', render: r => fmtDate(r.removedAt) },
    { key: 'createdAt', label: 'Originally listed', render: r => fmtDate(r.createdAt) },
  ];

  /* ── CSV download helpers ── */
  const dlUsers = () => downloadCsv('waterline-users.csv',
    users.map(u => ({
      Name: u.displayName, Username: u.username, Email: u.email,
      Role: u.role, Verified: u.isVerified ? 'Yes' : 'No',
      'Current mooring': u.mooringLocation,
      Joined: fmtDate(u.createdAt),
    })),
    ['Name', 'Username', 'Email', 'Role', 'Verified', 'Current mooring', 'Joined'],
  );

  const dlListings = () => downloadCsv('waterline-listings.csv',
    listings.map(l => ({
      Title: l.title,
      Seller: l.sellerId?.displayName || l.sellerId?.username,
      Type: l.listingType, Category: l.category,
      'Price (£)': l.price === 0 ? 'Free' : l.price,
      Active: l.isAvailable ? 'Yes' : 'No',
      Removed: l.removed ? 'Yes' : 'No',
      Photos: l.images?.length ?? 0,
      Listed: fmtDate(l.createdAt),
    })),
    ['Title', 'Seller', 'Type', 'Category', 'Price (£)', 'Active', 'Removed', 'Photos', 'Listed'],
  );

  const dlBoats = () => downloadCsv('waterline-boats.csv',
    boats.map(b => ({
      Name: b.boatName, Index: b.boatIndexNumber,
      Owner: b.ownerId?.displayName || b.ownerId?.username,
      Type: b.boatType, Length: b.boatLength, Year: b.boatYear,
      Verification: b.verificationStatus,
      Added: fmtDate(b.createdAt),
    })),
    ['Name', 'Index', 'Owner', 'Type', 'Length', 'Year', 'Verification', 'Added'],
  );

  const dlHazards = () => downloadCsv('waterline-hazards.csv',
    hazards.map(h => ({
      Type: h.hazardType, Description: h.description, Severity: h.severity,
      'Reported by': h.reportedBy?.displayName || h.reportedBy?.username,
      Resolved: h.isResolved ? 'Yes' : 'No',
      Reported: fmtDate(h.createdAt),
      Expires: fmtDate(h.expiresAt),
    })),
    ['Type', 'Description', 'Severity', 'Reported by', 'Resolved', 'Reported', 'Expires'],
  );

  const dlLogs = () => downloadCsv('waterline-logbook.csv',
    logs.map(l => ({
      Date: fmtDate(l.entryDate),
      Boat: l.boatId?.boatName,
      From: l.startLocation, To: l.endLocation,
      Miles: l.distance, Locks: l.locks,
      Notes: l.notes,
    })),
    ['Date', 'Boat', 'From', 'To', 'Miles', 'Locks', 'Notes'],
  );

  const dlRemovals = () => downloadCsv('waterline-removals.csv',
    removals.map(r => ({
      Title: r.title,
      Seller: r.sellerId?.displayName || r.sellerId?.username,
      Type: r.listingType, Category: r.category,
      'Price (£)': r.price === 0 ? 'Free' : r.price,
      Reason: REASON_LABELS[r.removalReason] || r.removalReason,
      'Days live': r.daysLive,
      Removed: fmtDate(r.removedAt),
      'Originally listed': fmtDate(r.createdAt),
    })),
    ['Title', 'Seller', 'Type', 'Category', 'Price (£)', 'Reason', 'Days live', 'Removed', 'Originally listed'],
  );

  /* ── save / delete handlers for the modal ── */
  const saveEdit = async (updates) => {
    const { kind, record } = editing;
    if (kind === 'user') {
      const updated = await api.adminUpdateUser(record._id, updates);
      setUsers(arr => arr.map(x => x._id === updated._id ? updated : x));
    } else if (kind === 'listing') {
      const updated = await api.adminUpdateListing(record._id, updates);
      setListings(arr => arr.map(x => x._id === updated._id ? updated : x));
    } else if (kind === 'boat') {
      const updated = await api.adminUpdateBoat(record._id, updates);
      setBoats(arr => arr.map(x => x._id === updated._id ? updated : x));
    } else if (kind === 'hazard') {
      const updated = await api.adminUpdateHazard(record._id, updates);
      setHazards(arr => arr.map(x => x._id === updated._id ? updated : x));
    } else if (kind === 'log') {
      const updated = await api.adminUpdateLogbook(record._id, updates);
      setLogs(arr => arr.map(x => x._id === updated._id ? updated : x));
    }
  };
  const deleteEdit = async () => {
    const { kind, record } = editing;
    if (kind === 'user') {
      await api.adminDeleteUser(record._id);
      setUsers(arr => arr.filter(x => x._id !== record._id));
    } else if (kind === 'listing') {
      await api.adminDeleteListing(record._id);
      setListings(arr => arr.filter(x => x._id !== record._id));
    } else if (kind === 'boat') {
      await api.adminDeleteBoat(record._id);
      setBoats(arr => arr.filter(x => x._id !== record._id));
    } else if (kind === 'hazard') {
      await api.adminDeleteHazard(record._id);
      setHazards(arr => arr.filter(x => x._id !== record._id));
    } else if (kind === 'log') {
      await api.adminDeleteLogbook(record._id);
      setLogs(arr => arr.filter(x => x._id !== record._id));
    }
  };

  const modalConfig = editing && {
    user:    { title: `Edit user · ${editing.record.displayName || editing.record.username || editing.record.email}`, fields: userFields },
    listing: { title: `Edit listing · ${editing.record.title}`, fields: listingFields },
    boat:    { title: `Edit boat · ${editing.record.boatName}`, fields: boatFields },
    hazard:  { title: `Edit hazard · ${editing.record.hazardType?.replace(/_/g, ' ')}`, fields: hazardFields },
    log:     { title: `Edit log entry · ${fmtDate(editing.record.entryDate)}`, fields: logFields },
  }[editing.kind];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--linen)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Admin Dashboard</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Signed in as {user.email}</div>
          </div>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Icon name="logout" size={14} color="rgba(255,255,255,0.75)" /> Sign out
          </button>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: '0 0 auto', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--paper)' : 'rgba(255,255,255,0.4)',
              fontWeight: tab === t ? 700 : 500, fontSize: 13, fontFamily: 'var(--font-sans)',
              borderBottom: tab === t ? '2px solid var(--paper)' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px 60px', maxWidth: 1100, margin: '0 auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'Overview' && stats && (
              <>
                <Section title="Users">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <StatCard label="Total" value={stats.users.total} />
                    <StatCard label="Verified" value={stats.users.verified} color="var(--moss)" />
                    <StatCard label="New (30d)" value={stats.users.new30d} color="var(--moss)" />
                  </div>
                </Section>
                <Section title="Boats">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <StatCard label="Total" value={stats.boats.total} />
                    <StatCard label="Verified" value={stats.boats.verified} color="var(--moss)" />
                    <StatCard label="Pending" value={stats.boats.pending} color="var(--rust)" />
                  </div>
                </Section>
                <Section title="Marketplace">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <StatCard label="Total listings" value={stats.listings.total} />
                    <StatCard label="Active" value={stats.listings.active} color="var(--moss)" />
                    <StatCard label="New (30d)" value={stats.listings.new30d} color="var(--moss)" />
                  </div>
                </Section>
                <Section title="Activity">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <StatCard label="Log entries" value={stats.logbook.total} />
                    <StatCard label="Hazard reports" value={stats.hazards.total} />
                  </div>
                </Section>
                <Section title="Listing removals">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
                    <StatCard label="Total removed" value={stats.removals.total} />
                    <StatCard label="Avg days live" value={stats.removals.avgDaysLive != null ? `${Math.round(stats.removals.avgDaysLive)}d` : '—'} sub="before removal" />
                  </div>
                  {stats.removals.breakdown.length > 0 && (
                    <div style={{ overflowX: 'auto', borderRadius: 'var(--r-lg)', border: '1px solid var(--reed)' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'var(--paper)' }}>
                        <thead>
                          <tr>
                            {['Reason', 'Count', 'Avg days live'].map(h => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--silt)', background: 'var(--linen)', borderBottom: '2px solid var(--reed)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.removals.breakdown.map((r, i) => (
                            <tr key={r._id} style={{ background: i % 2 === 1 ? 'var(--linen)' : 'var(--paper)' }}>
                              <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid var(--linen)' }}>{REASON_LABELS[r._id] || r._id}</td>
                              <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--linen)' }}>{r.count}</td>
                              <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid var(--linen)' }}>{Math.round(r.avgDaysLive ?? 0)}d</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>
                <Section title="Promote to admin">
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', padding: 16 }}>
                    <div style={{ fontSize: 13, color: 'var(--silt)', marginBottom: 10 }}>Enter the email of the account to give admin access.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="field" style={{ flex: 1 }} type="email" value={promoteEmail}
                        onChange={e => setPromoteEmail(e.target.value)} placeholder="user@example.com" />
                      <button className="btn primary" onClick={promote} disabled={!promoteEmail.trim()}>Promote</button>
                    </div>
                    {promoteMsg && <div style={{ fontSize: 13, marginTop: 8, color: 'var(--moss)' }}>{promoteMsg}</div>}
                  </div>
                </Section>
              </>
            )}

            {/* ── APPROVALS ── */}
            {tab === 'Approvals' && (
              <Section title={`Boat verifications · ${pending.length} pending`}>
                {pending.length === 0 ? (
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', padding: 32, textAlign: 'center', color: 'var(--silt)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                    Nothing to review. All caught up.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pending.map(b => (
                      <div key={b._id} style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                        {b.licenseDocUrl && (
                          <div style={{ background: 'var(--linen)', padding: 8, borderBottom: '1px solid var(--reed)' }}>
                            <a href={b.licenseDocUrl} target="_blank" rel="noopener noreferrer">
                              <img src={b.licenseDocUrl} alt="Licence" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block', borderRadius: 6 }} />
                            </a>
                          </div>
                        )}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 16, fontWeight: 700 }}>{b.boatName}</div>
                              <div style={{ fontSize: 12, color: 'var(--silt)' }}>
                                Index: <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>{b.boatIndexNumber}</strong>
                                {b.boatType && ` · ${b.boatType}`}
                              </div>
                            </div>
                            <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'var(--rust-soft, #FCEEEA)', color: 'var(--rust)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--silt)', marginBottom: 10 }}>
                            Owner: <strong style={{ color: 'var(--ink)' }}>{b.ownerId?.displayName || b.ownerId?.username}</strong>
                            {b.ownerId?.email && <> · {b.ownerId.email}</>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--pebble)', marginBottom: 12 }}>
                            Submitted {fmtDate(b.crtUploadedAt)}
                            {!b.licenseDocUrl && ' · No document attached'}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => rejectCert(b._id)} disabled={actioning === b._id}
                              style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                              Reject
                            </button>
                            <button onClick={() => approveCert(b._id)} disabled={actioning === b._id}
                              style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                              {actioning === b._id ? '…' : 'Approve'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {tab === 'Users' && (
              <Section title={`All users (${users.length})`}>
                <DataTable columns={userCols} rows={users} onDownload={dlUsers}
                  onRowClick={(r) => setEditing({ kind: 'user', record: r })} />
              </Section>
            )}

            {tab === 'Listings' && (
              <Section title={`All listings (${listings.length})`}>
                <DataTable columns={listingCols} rows={listings} onDownload={dlListings}
                  onRowClick={(r) => setEditing({ kind: 'listing', record: r })} />
              </Section>
            )}

            {tab === 'Boats' && (
              <Section title={`All boats (${boats.length})`}>
                <DataTable columns={boatCols} rows={boats} onDownload={dlBoats}
                  onRowClick={(r) => setEditing({ kind: 'boat', record: r })} />
              </Section>
            )}

            {tab === 'Hazards' && (
              <Section title={`All hazard reports (${hazards.length})`}>
                <DataTable columns={hazardCols} rows={hazards} onDownload={dlHazards}
                  onRowClick={(r) => setEditing({ kind: 'hazard', record: r })} />
              </Section>
            )}

            {tab === 'Logbook' && (
              <Section title={`Log entries (${logs.length})`}>
                <DataTable columns={logCols} rows={logs} onDownload={dlLogs}
                  onRowClick={(r) => setEditing({ kind: 'log', record: r })} />
              </Section>
            )}

            {tab === 'Removals' && (
              <Section title={`Removal log (${removals.length})`}>
                <DataTable columns={removalCols} rows={removals} onDownload={dlRemovals} />
              </Section>
            )}
          </>
        )}
      </div>

      {editing && modalConfig && (
        <EditModal
          title={modalConfig.title}
          fields={modalConfig.fields}
          record={editing.record}
          onSave={saveEdit}
          onDelete={deleteEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

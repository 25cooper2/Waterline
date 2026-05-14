import { useState, useEffect, useCallback } from 'react';
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

/* ── sub-components ────────────────────────────────────────────── */

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

function Section({ title, action, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--silt)' }}>
          {title}
        </div>
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--silt)', fontSize: 14, pointerEvents: 'none' }}>⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Search…'}
        style={{
          width: '100%', padding: '9px 12px 9px 32px',
          borderRadius: 'var(--r-md)', border: '1px solid var(--reed)',
          background: 'var(--paper)', fontSize: 14,
          fontFamily: 'var(--font-sans)', color: 'var(--ink)',
          boxSizing: 'border-box', outline: 'none',
        }}
      />
    </div>
  );
}

function DataTable({ columns, rows, onDownload, onRowClick, emptyMessage }) {
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
          <div style={{ fontSize: 12, color: 'var(--silt)' }}>Tap any row to view & edit.</div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {onDownload && (
            <button onClick={onDownload} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--reed)', background: 'var(--paper)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-sans)', color: 'var(--ink)',
            }}>
              ↓ CSV
            </button>
          )}
        </div>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--r-lg)', border: '1px solid var(--reed)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', background: 'var(--paper)' }}>
          <thead>
            <tr>{columns.map(c => <th key={c.key} style={thStyle}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--silt)', padding: 32 }}>
                {emptyMessage || 'No data yet'}
              </td></tr>
            )}
            {rows.map((row, i) => (
              <tr key={row._id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ background: i % 2 === 1 ? 'var(--linen)' : 'var(--paper)', cursor: onRowClick ? 'pointer' : 'default' }}
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

/* ── edit / create modal ───────────────────────────────────────── */

function EditModal({ title, record, fields, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => {
    const o = {};
    for (const f of fields) {
      if (f.type === 'readonly') continue;
      let v = record ? record[f.key] : undefined;
      if (f.type === 'date') v = toDateInputValue(v);
      if (f.type === 'images') v = Array.isArray(v) ? v.join('\n') : '';
      if (f.type === 'boolean') v = !!v;
      if (v == null) v = f.default ?? '';
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
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 640, background: 'var(--paper)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: 24, marginBottom: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--reed)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--linen)' }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: 'var(--silt)' }}>×</button>
        </div>

        <div style={{ padding: 18, maxHeight: '70vh', overflowY: 'auto' }}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--silt)', marginBottom: 5 }}>
                {f.label}{f.required && <span style={{ color: 'var(--rust)', marginLeft: 3 }}>*</span>}
              </label>
              {f.type === 'readonly' && (
                <div style={{ fontSize: 13, color: 'var(--ink)', wordBreak: 'break-word' }}>
                  {f.render ? f.render(record || {}) : (record?.[f.key] ?? '—')}
                </div>
              )}
              {f.type === 'text' && <input style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />}
              {f.type === 'textarea' && <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-sans)' }} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />}
              {f.type === 'number' && <input type="number" style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />}
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
              {f.type === 'date' && <input type="date" style={inputStyle} value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} />}
              {f.type === 'images' && (
                <>
                  {String(form[f.key] || '').split('\n').filter(Boolean).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {String(form[f.key]).split('\n').filter(Boolean).map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--reed)' }} />
                        </a>
                      ))}
                    </div>
                  )}
                  <textarea style={{ ...inputStyle, minHeight: 70, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}
                    value={form[f.key] ?? ''} onChange={e => setField(f.key, e.target.value)} placeholder="One image URL per line" />
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
            <button onClick={handleDelete} disabled={saving} style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--rust)', background: 'var(--paper)', color: 'var(--rust)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Delete
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} disabled={saving} style={{ padding: '10px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 18px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', fontWeight: 700, fontSize: 14, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── field schemas ─────────────────────────────────────────────── */

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
  { key: 'mooringLocation', label: 'Current mooring', type: 'text' },
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
  { key: 'images', label: 'Photos', type: 'images', help: 'One URL per line.' },
  { key: 'isAvailable', label: 'Active', type: 'boolean' },
  { key: 'removed', label: 'Removed (soft-deleted)', type: 'boolean' },
  { key: 'removalReason', label: 'Removal reason', type: 'text' },
  { key: 'viewCount', label: 'Unique viewers', type: 'readonly', render: r => r.viewers?.length ?? 0 },
  { key: 'favCount', label: 'Favourites', type: 'readonly', render: r => r.favorites?.length ?? 0 },
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
  { key: 'reporter', label: 'Reported by', type: 'readonly', render: r => r.reportedBy ? `${r.reportedBy?.displayName || r.reportedBy?.username || '—'} (${r.reportedBy?.email || 'no email'})` : 'Admin' },
  { key: 'hazardType', label: 'Hazard type', type: 'select', required: true, options: [
    'debris','underwater_obstruction','shallow_water','weather_warning','lock_closure','obstruction','water_level','crt_works','theft','towpath','wildlife','other',
  ].map(v => ({ value: v, label: v.replace(/_/g, ' ') })) },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'severity', label: 'Severity', type: 'select', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
  ] },
  { key: 'lat', label: 'Latitude', type: 'number', required: true },
  { key: 'lng', label: 'Longitude', type: 'number', required: true },
  { key: 'isResolved', label: 'Resolved', type: 'boolean' },
  { key: 'source', label: 'Source', type: 'select', options: [
    { value: 'admin', label: 'Admin' }, { value: 'community', label: 'Community' },
  ] },
  { key: 'startsAt', label: 'Starts at', type: 'date' },
  { key: 'expiresAt', label: 'Expires at', type: 'date', required: true },
  { key: 'photos', label: 'Photos', type: 'images', help: 'One URL per line.' },
  { key: 'confirmationCount', label: 'Confirmations', type: 'readonly' },
  { key: 'createdAt', label: 'Reported', type: 'readonly', render: r => fmtDateTime(r.createdAt) },
];

const hazardCreateFields = hazardFields.filter(f => !['_id', 'reporter', 'confirmationCount', 'createdAt', 'isResolved'].includes(f.key))
  .map(f => f.key === 'source' ? { ...f, default: 'admin' } : f);

const logFields = [
  { key: '_id', label: 'Log entry ID', type: 'readonly' },
  { key: 'boat', label: 'Boat', type: 'readonly', render: r => r.boatId?.boatName ? `${r.boatId.boatName} (${r.boatId.boatIndexNumber || ''})` : '—' },
  { key: 'owner', label: 'Owner', type: 'readonly', render: r => r.boatId?.ownerId?.displayName || r.boatId?.ownerId?.username || '—' },
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

const REPORT_REASON_LABELS = {
  spam_scam: 'Spam or scam',
  harassment: 'Harassment or abuse',
  hate_speech: 'Hate speech',
  sexual_content: 'Sexual or explicit content',
  misinformation: 'Misinformation',
  impersonation: 'Impersonation',
  off_topic: 'Off-topic / not boating-related',
  other: 'Other',
};

/* ── Report detail modal ─────────────────────────────────────────── */

function ReportDetailModal({ report, onClose, onApprove, onDismiss, actioning }) {
  const r = report;
  const t = r.target;
  const rs = r.replySnapshot;

  const typeColors = {
    post: { bg: '#fce4ec', fg: '#880e4f' },
    reply: { bg: '#fce4ec', fg: '#880e4f' },
    product: { bg: '#e3f2fd', fg: '#1565c0' },
    user: { bg: '#e8f5e9', fg: '#2e7d32' },
  };
  const tc = typeColors[r.targetType] || { bg: '#f5f5f5', fg: '#333' };

  const ProfileLink = ({ user, label }) => {
    if (!user?._id) return <span style={{ color: 'var(--silt)' }}>{label || 'Unknown'}</span>;
    return (
      <a href={`/profile/${user._id}`} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--moss)', fontWeight: 600, textDecoration: 'none' }}>
        {label || user.displayName || user.username || user.email}
      </a>
    );
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 680, background: 'var(--paper)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: 24, marginBottom: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--reed)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--linen)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '3px 9px', borderRadius: 99, background: tc.bg, color: tc.fg }}>{r.targetType}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--rust)', flex: 1 }}>{REPORT_REASON_LABELS[r.reason] || r.reason}</span>
          <span style={{ fontSize: 12, color: 'var(--silt)' }}>{fmtDateTime(r.createdAt)}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: 'var(--silt)', marginLeft: 4 }}>×</button>
        </div>

        <div style={{ padding: 18, maxHeight: '72vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--linen)', borderRadius: 'var(--r-md)', fontSize: 13 }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.08em', color: 'var(--silt)', display: 'block', marginBottom: 4 }}>Reported by</span>
            <ProfileLink user={r.reporter} label={`${r.reporter?.displayName || r.reporter?.username || '?'} (${r.reporter?.email || ''})`} />
          </div>

          {!t && <div style={{ padding: 14, background: 'var(--linen)', borderRadius: 'var(--r-md)', color: 'var(--silt)', fontSize: 13, marginBottom: 14 }}>Content has been deleted.</div>}

          {t && r.targetType === 'post' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 8 }}>Post</div>
              <div style={{ padding: '14px 16px', background: 'var(--linen)', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)' }}>
                <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 13 }}>Author: </span><ProfileLink user={t.authorId} label={t.authorId?.displayName || t.authorId?.username} />{t.authorId?.email && <span style={{ fontSize: 12, color: 'var(--silt)', marginLeft: 6 }}>({t.authorId.email})</span>}</div>
                <div style={{ fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5, marginBottom: 10 }}>{t.body}</div>
                {t.photos?.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{t.photos.map((src, i) => <a key={i} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--reed)' }} /></a>)}</div>}
              </div>
            </div>
          )}

          {t && r.targetType === 'reply' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 8 }}>Reported Reply</div>
              {rs ? (
                <div style={{ padding: '14px 16px', background: '#fce4ec22', borderRadius: 'var(--r-md)', border: '1.5px solid #880e4f44' }}>
                  <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 13 }}>Reply author: </span><ProfileLink user={rs.authorId} label={rs.authorId?.displayName || rs.authorId?.username} /></div>
                  <div style={{ fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{rs.body}</div>
                </div>
              ) : <div style={{ padding: 12, background: 'var(--linen)', borderRadius: 'var(--r-md)', color: 'var(--silt)', fontSize: 13 }}>Reply not found (may already be removed).</div>}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 6 }}>Parent post</div>
                <div style={{ padding: '12px 14px', background: 'var(--linen)', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)' }}>
                  <div style={{ marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 13 }}>Post author: </span><ProfileLink user={t.authorId} label={t.authorId?.displayName || t.authorId?.username} /></div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{t.body}</div>
                </div>
              </div>
            </div>
          )}

          {t && r.targetType === 'product' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 8 }}>Listing</div>
              <div style={{ padding: '14px 16px', background: 'var(--linen)', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)' }}>
                <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</span><span style={{ fontSize: 12, color: 'var(--silt)', marginLeft: 8 }}>{t.listingType} · {t.category}</span></div>
                <div style={{ marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 13 }}>Seller: </span><ProfileLink user={t.sellerId} label={t.sellerId?.displayName || t.sellerId?.username} />{t.sellerId?.email && <span style={{ fontSize: 12, color: 'var(--silt)', marginLeft: 6 }}>({t.sellerId.email})</span>}</div>
                {t.description && <div style={{ fontSize: 13.5, color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 10 }}>{t.description}</div>}
                {t.images?.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{t.images.map((src, i) => <a key={i} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--reed)' }} /></a>)}</div>}
              </div>
            </div>
          )}

          {t && r.targetType === 'user' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 8 }}>Reported profile</div>
              <div style={{ padding: '14px 16px', background: 'var(--linen)', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}><ProfileLink user={t} label={t.displayName || t.username || t.email} /></div>
                <div style={{ fontSize: 12, color: 'var(--silt)', marginBottom: 6 }}>{t.email} {t.username ? `· @${t.username}` : ''}</div>
                {t.bio && <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{t.bio}</div>}
              </div>
            </div>
          )}

          {r.details && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 6 }}>Reporter's note</div>
              <div style={{ padding: '12px 14px', background: 'var(--linen)', borderRadius: 'var(--r-md)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink)' }}>"{r.details}"</div>
            </div>
          )}

          {r.adminNote && (
            <div style={{ padding: '10px 14px', background: 'var(--moss-soft)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink)' }}>
              <strong>Admin note:</strong> {r.adminNote}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--reed)', display: 'flex', gap: 8, background: 'var(--linen)' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Close</button>
          <div style={{ flex: 1 }} />
          {r.status === 'pending' && (
            <>
              <button disabled={actioning === r._id} onClick={() => onDismiss(r)} style={{ padding: '10px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Dismiss</button>
              <button disabled={actioning === r._id} onClick={() => onApprove(r)} style={{ padding: '10px 18px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--rust)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: actioning === r._id ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                {actioning === r._id ? '…' : 'Remove content'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── REVIEW QUEUE TAB — combines certifications, reports, trade profiles ── */

function ReviewQueueTab({ pending, setPending, reports, setReports, tradeProfiles, setTradeProfiles, actioning, setActioning, pendingCounts }) {
  const [section, setSection] = useState('certifications');
  const [reportFilter, setReportFilter] = useState('pending');
  const [tradeFilter, setTradeFilter] = useState('pending');
  const [detailReport, setDetailReport] = useState(null);
  const [reportActioning, setReportActioning] = useState(null);
  const [tradeActioning, setTradeActioning] = useState(null);

  const loadReports = async (status) => {
    try { const d = await api.adminReports(status); setReports(d); } catch (e) { alert('Failed: ' + e.message); }
  };
  const loadTrades = async (status) => {
    try { const d = await api.adminTradeProfiles(status); setTradeProfiles(d); } catch (e) { alert('Failed: ' + e.message); }
  };

  const approveCert = async (boatId) => {
    setActioning(boatId);
    try { await api.adminApproveCert(boatId); setPending(p => p.filter(b => b._id !== boatId)); }
    catch (e) { alert('Approve failed: ' + e.message); }
    setActioning(null);
  };

  const rejectCert = async (boatId) => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    setActioning(boatId);
    try { await api.adminRejectCert(boatId, reason); setPending(p => p.filter(b => b._id !== boatId)); }
    catch (e) { alert('Reject failed: ' + e.message); }
    setActioning(null);
  };

  const approveReport = async (report) => {
    const note = prompt('Optional note to include in the message to the reported user:') ?? '';
    if (note === null) return;
    setReportActioning(report._id);
    try { await api.adminApproveReport(report._id, note || undefined); setReports(prev => prev.filter(r => r._id !== report._id)); setDetailReport(null); }
    catch (e) { alert('Failed: ' + e.message); }
    setReportActioning(null);
  };

  const dismissReport = async (report) => {
    const note = prompt('Optional note to include in the message to the reporter:') ?? '';
    if (note === null) return;
    setReportActioning(report._id);
    try { await api.adminDismissReport(report._id, note || undefined); setReports(prev => prev.filter(r => r._id !== report._id)); setDetailReport(null); }
    catch (e) { alert('Failed: ' + e.message); }
    setReportActioning(null);
  };

  const approveTrade = async (tp) => {
    const note = prompt('Optional note to the tradesperson (or leave blank):') || undefined;
    setTradeActioning(tp._id);
    try { await api.adminApproveTradeProfile(tp._id, note); setTradeProfiles(prev => prev.filter(x => x._id !== tp._id)); }
    catch (e) { alert('Failed: ' + e.message); }
    setTradeActioning(null);
  };

  const rejectTrade = async (tp) => {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    setTradeActioning(tp._id);
    try { await api.adminRejectTradeProfile(tp._id, reason); setTradeProfiles(prev => prev.filter(x => x._id !== tp._id)); }
    catch (e) { alert('Failed: ' + e.message); }
    setTradeActioning(null);
  };

  const typeColors = { post: { bg: '#fce4ec', fg: '#880e4f' }, reply: { bg: '#fce4ec', fg: '#880e4f' }, product: { bg: '#e3f2fd', fg: '#1565c0' }, user: { bg: '#e8f5e9', fg: '#2e7d32' } };

  const Badge = ({ n }) => n > 0 ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: 'var(--rust)', color: '#fff', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>{n}</span>
  ) : null;

  const sectionBtnStyle = (active) => ({
    padding: '8px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 700 : 500,
    background: active ? 'var(--ink)' : 'var(--paper)',
    color: active ? 'var(--paper)' : 'var(--ink)',
    border: '1px solid var(--reed)', display: 'flex', alignItems: 'center',
  });

  const subBtnStyle = (active) => ({
    padding: '7px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 700 : 500,
    background: active ? 'var(--ink)' : 'var(--paper)',
    color: active ? 'var(--paper)' : 'var(--ink)',
    border: '1px solid var(--reed)', textTransform: 'capitalize',
  });

  return (
    <div>
      {detailReport && (
        <ReportDetailModal report={detailReport} onClose={() => setDetailReport(null)} onApprove={approveReport} onDismiss={dismissReport} actioning={reportActioning} />
      )}

      {/* Section switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={sectionBtnStyle(section === 'certifications')} onClick={() => setSection('certifications')}>
          Boat certifications<Badge n={pendingCounts.certifications} />
        </button>
        <button style={sectionBtnStyle(section === 'reports')} onClick={() => setSection('reports')}>
          Community reports<Badge n={pendingCounts.reports} />
        </button>
        <button style={sectionBtnStyle(section === 'trade')} onClick={() => setSection('trade')}>
          Trade profiles<Badge n={pendingCounts.tradeProfiles} />
        </button>
      </div>

      {/* ── CERTIFICATIONS ── */}
      {section === 'certifications' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--silt)', marginBottom: 16 }}>
            {pending.length === 0 ? 'All caught up — no pending certifications.' : `${pending.length} boat${pending.length !== 1 ? 's' : ''} waiting for review.`}
          </div>
          {pending.length === 0 ? (
            <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', padding: 40, textAlign: 'center', color: 'var(--silt)' }}>
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
        </>
      )}

      {/* ── REPORTS ── */}
      {section === 'reports' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['pending', 'approved', 'dismissed'].map(s => (
              <button key={s} style={subBtnStyle(reportFilter === s)} onClick={() => { setReportFilter(s); loadReports(s); }}>{s}</button>
            ))}
          </div>
          {reports.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--silt)', fontSize: 14 }}>No {reportFilter} reports.</div>
          ) : reports.map(r => {
            const tc = typeColors[r.targetType] || { bg: '#f5f5f5', fg: '#333' };
            const t = r.target;
            const rs = r.replySnapshot;
            const targetSummary = () => {
              if (!t) return <span style={{ color: 'var(--silt)' }}>Content deleted</span>;
              if (r.targetType === 'reply') return <span>Reply: "{String(rs?.body || '').slice(0, 80)}{(rs?.body?.length || 0) > 80 ? '…' : ''}" — by {rs?.authorId?.displayName || rs?.authorId?.username || '?'}</span>;
              if (r.targetType === 'post') return <span>Post: "{String(t.body || '').slice(0, 80)}{t.body?.length > 80 ? '…' : ''}" — by {t.authorId?.displayName || t.authorId?.username || '?'}</span>;
              if (r.targetType === 'product') return <span>Listing: "{t.title}" — by {t.sellerId?.displayName || t.sellerId?.username || '?'}</span>;
              if (r.targetType === 'user') return <span>Profile: {t.displayName || t.username || t.email}</span>;
            };
            return (
              <div key={r._id} style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 12, cursor: 'pointer' }} onClick={() => setDetailReport(r)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 99, background: tc.bg, color: tc.fg }}>{r.targetType}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--rust)' }}>{REPORT_REASON_LABELS[r.reason] || r.reason}</span>
                      <span style={{ fontSize: 12, color: 'var(--silt)', marginLeft: 'auto' }}>{fmtDateTime(r.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: 6 }}>{targetSummary()}</div>
                    {r.details && <div style={{ fontSize: 13, color: 'var(--silt)', fontStyle: 'italic', marginBottom: 6 }}>"{r.details}"</div>}
                    <div style={{ fontSize: 12, color: 'var(--pebble)' }}>
                      By: {r.reporter?.displayName || r.reporter?.username || '?'} ({r.reporter?.email})
                      <span style={{ marginLeft: 10, color: 'var(--moss)', fontWeight: 600 }}>Tap to view →</span>
                    </div>
                    {r.adminNote && <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 4 }}>Admin note: {r.adminNote}</div>}
                  </div>
                  {reportFilter === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button disabled={reportActioning === r._id} onClick={() => approveReport(r)} style={{ padding: '8px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer', background: 'var(--rust)', color: '#fff', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Remove</button>
                      <button disabled={reportActioning === r._id} onClick={() => dismissReport(r)} style={{ padding: '8px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer', background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--reed)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Dismiss</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TRADE PROFILES ── */}
      {section === 'trade' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['pending', 'approved', 'rejected'].map(s => (
              <button key={s} style={subBtnStyle(tradeFilter === s)} onClick={() => { setTradeFilter(s); loadTrades(s); }}>{s}</button>
            ))}
          </div>
          {tradeProfiles.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--silt)', fontSize: 14 }}>No {tradeFilter} trade profiles.</div>
          ) : tradeProfiles.map(tp => {
            const u = tp.userId || {};
            const allCats = [...(tp.categories || []), ...(tp.otherCategory ? [`Other: ${tp.otherCategory}`] : [])];
            const radius = tp.travelRadius == null ? 'Anywhere' : tp.travelRadius < 1 ? '< 1 mile' : `${tp.travelRadius} miles`;
            return (
              <div key={tp._id} style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', marginBottom: 16, overflow: 'hidden' }}>
                {tp.businessPhotos?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, padding: 8, background: 'var(--linen)', flexWrap: 'wrap' }}>
                    {tp.businessPhotos.map((src, i) => <a key={i} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 6 }} /></a>)}
                  </div>
                )}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{tp.businessName || u.displayName || u.username || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 2 }}>
                        <a href={`/profile/${u._id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--moss)', fontWeight: 600, textDecoration: 'none' }}>{u.displayName || u.username}</a>
                        {u.email && <> · {u.email}</>}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: tp.status === 'approved' ? '#e8f5e9' : tp.status === 'rejected' ? '#fce4ec' : '#fff9c4', color: tp.status === 'approved' ? '#2e7d32' : tp.status === 'rejected' ? '#880e4f' : '#f57f17' }}>{tp.status}</span>
                  </div>
                  {tp.businessDescription && <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>{tp.businessDescription}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--silt)' }}><strong style={{ color: 'var(--ink)' }}>Categories:</strong><br />{allCats.join(', ') || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--silt)' }}><strong style={{ color: 'var(--ink)' }}>Operates at:</strong><br />{tp.operatesAt || '—'} {tp.operatesLat ? `(${tp.operatesLat.toFixed(4)}, ${tp.operatesLng?.toFixed(4)})` : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--silt)' }}><strong style={{ color: 'var(--ink)' }}>Travel radius:</strong><br />{radius}</div>
                    <div style={{ fontSize: 12, color: 'var(--silt)' }}><strong style={{ color: 'var(--ink)' }}>Submitted:</strong><br />{fmtDate(tp.updatedAt)}</div>
                  </div>
                  {tp.liabilityInsuranceUrl && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--silt)', marginBottom: 4 }}>PUBLIC LIABILITY INSURANCE</div>
                      {tp.liabilityInsuranceUrl.startsWith('data:image') ? (
                        <a href={tp.liabilityInsuranceUrl} target="_blank" rel="noopener noreferrer"><img src={tp.liabilityInsuranceUrl} alt="Insurance cert" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--reed)' }} /></a>
                      ) : (
                        <a href={tp.liabilityInsuranceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--linen)', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}>📄 View insurance certificate</a>
                      )}
                    </div>
                  )}
                  {tp.tradeCertUrls?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--silt)', marginBottom: 4 }}>TRADE CERTIFICATES</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {tp.tradeCertUrls.map((src, i) => src.startsWith('data:image') ? (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--reed)' }} /></a>
                        ) : (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--linen)', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}>📄 Certificate {i + 1}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {tp.adminNote && <div style={{ padding: '8px 12px', background: 'var(--moss-soft)', borderRadius: 'var(--r-md)', fontSize: 13, marginBottom: 10 }}><strong>Admin note:</strong> {tp.adminNote}</div>}
                  {tp.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button disabled={tradeActioning === tp._id} onClick={() => rejectTrade(tp)} style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--reed)', background: 'var(--paper)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Reject</button>
                      <button disabled={tradeActioning === tp._id} onClick={() => approveTrade(tp)} style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>{tradeActioning === tp._id ? '…' : 'Approve'}</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── tab definitions ───────────────────────────────────────────── */

const TABS = ['Overview', 'Review Queue', 'Users', 'Listings', 'Boats', 'Hazards & Logbook'];

/* ── main component ────────────────────────────────────────────── */

export default function AdminScreen() {
  const { user, logout } = useAuth();

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

  const handleLogout = () => { logout(); window.location.reload(); };

  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [listings, setListings] = useState([]);
  const [listingSearch, setListingSearch] = useState('');
  const [boats, setBoats] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pending, setPending] = useState([]);
  const [reports, setReports] = useState([]);
  const [tradeProfiles, setTradeProfiles] = useState([]);
  const [actioning, setActioning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creatingHazard, setCreatingHazard] = useState(false);

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
      api.adminPendingCerts().catch(() => []),
      api.adminReports('pending').catch(() => []),
      api.adminTradeProfiles('pending').catch(() => []),
    ]).then(([s, u, l, b, h, lg, p, rpts, tps]) => {
      setStats(s); setUsers(u); setListings(l); setBoats(b);
      setHazards(h); setLogs(lg); setPending(p);
      setReports(rpts); setTradeProfiles(tps);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const searchUsers = useCallback(async (q) => {
    setUserSearch(q);
    try { const d = await api.adminUsers(q); setUsers(d); } catch {}
  }, []);

  const searchListings = useCallback(async (q) => {
    setListingSearch(q);
    try { const d = await api.adminListings(q); setListings(d); } catch {}
  }, []);

  /* ── CSV helpers ── */
  const dlUsers = () => downloadCsv('waterline-users.csv', users.map(u => ({ Name: u.displayName, Username: u.username, Email: u.email, Role: u.role, Verified: u.isVerified ? 'Yes' : 'No', 'Current mooring': u.mooringLocation, Joined: fmtDate(u.createdAt) })), ['Name', 'Username', 'Email', 'Role', 'Verified', 'Current mooring', 'Joined']);
  const dlListings = () => downloadCsv('waterline-listings.csv', listings.map(l => ({ Title: l.title, Seller: l.sellerId?.displayName || l.sellerId?.username, Type: l.listingType, Category: l.category, 'Price (£)': l.price === 0 ? 'Free' : l.price, Active: l.isAvailable ? 'Yes' : 'No', Removed: l.removed ? 'Yes' : 'No', Photos: l.images?.length ?? 0, Listed: fmtDate(l.createdAt) })), ['Title', 'Seller', 'Type', 'Category', 'Price (£)', 'Active', 'Removed', 'Photos', 'Listed']);
  const dlBoats = () => downloadCsv('waterline-boats.csv', boats.map(b => ({ Name: b.boatName, Index: b.boatIndexNumber, Owner: b.ownerId?.displayName || b.ownerId?.username, Type: b.boatType, Length: b.boatLength, Year: b.boatYear, Verification: b.verificationStatus, Added: fmtDate(b.createdAt) })), ['Name', 'Index', 'Owner', 'Type', 'Length', 'Year', 'Verification', 'Added']);
  const dlHazards = () => downloadCsv('waterline-hazards.csv', hazards.map(h => ({ Type: h.hazardType, Description: h.description, Severity: h.severity, 'Reported by': h.reportedBy?.displayName || h.reportedBy?.username || 'Admin', Resolved: h.isResolved ? 'Yes' : 'No', Reported: fmtDate(h.createdAt), Expires: fmtDate(h.expiresAt) })), ['Type', 'Description', 'Severity', 'Reported by', 'Resolved', 'Reported', 'Expires']);
  const dlLogs = () => downloadCsv('waterline-logbook.csv', logs.map(l => ({ Date: fmtDate(l.entryDate), Boat: l.boatId?.boatName, From: l.startLocation, To: l.endLocation, Miles: l.distance, Locks: l.locks, Notes: l.notes })), ['Date', 'Boat', 'From', 'To', 'Miles', 'Locks', 'Notes']);

  /* ── save / delete handlers ── */
  const saveEdit = async (updates) => {
    const { kind, record } = editing;
    if (kind === 'user') { const u = await api.adminUpdateUser(record._id, updates); setUsers(arr => arr.map(x => x._id === u._id ? u : x)); }
    else if (kind === 'listing') { const l = await api.adminUpdateListing(record._id, updates); setListings(arr => arr.map(x => x._id === l._id ? l : x)); }
    else if (kind === 'boat') { const b = await api.adminUpdateBoat(record._id, updates); setBoats(arr => arr.map(x => x._id === b._id ? b : x)); }
    else if (kind === 'hazard') { const h = await api.adminUpdateHazard(record._id, updates); setHazards(arr => arr.map(x => x._id === h._id ? h : x)); }
    else if (kind === 'log') { const lg = await api.adminUpdateLogbook(record._id, updates); setLogs(arr => arr.map(x => x._id === lg._id ? lg : x)); }
  };

  const deleteEdit = async () => {
    const { kind, record } = editing;
    if (kind === 'user') { await api.adminDeleteUser(record._id); setUsers(arr => arr.filter(x => x._id !== record._id)); }
    else if (kind === 'listing') { await api.adminDeleteListing(record._id); setListings(arr => arr.filter(x => x._id !== record._id)); }
    else if (kind === 'boat') { await api.adminDeleteBoat(record._id); setBoats(arr => arr.filter(x => x._id !== record._id)); }
    else if (kind === 'hazard') { await api.adminDeleteHazard(record._id); setHazards(arr => arr.filter(x => x._id !== record._id)); }
    else if (kind === 'log') { await api.adminDeleteLogbook(record._id); setLogs(arr => arr.filter(x => x._id !== record._id)); }
  };

  const saveNewHazard = async (data) => {
    const h = await api.adminCreateHazard(data);
    setHazards(arr => [h, ...arr]);
  };

  const modalConfig = editing && {
    user:    { title: `Edit user · ${editing.record.displayName || editing.record.username || editing.record.email}`, fields: userFields },
    listing: { title: `Edit listing · ${editing.record.title}`, fields: listingFields },
    boat:    { title: `Edit boat · ${editing.record.boatName}`, fields: boatFields },
    hazard:  { title: `Edit hazard · ${editing.record.hazardType?.replace(/_/g, ' ')}`, fields: hazardFields },
    log:     { title: `Edit log entry · ${fmtDate(editing.record.entryDate)}`, fields: logFields },
  }[editing.kind];

  /* ── pending queue counts ── */
  const pendingCounts = {
    certifications: pending.length,
    reports: reports.filter(r => r.status === 'pending').length,
    tradeProfiles: tradeProfiles.filter(t => t.status === 'pending').length,
    total: 0,
  };
  pendingCounts.total = pendingCounts.certifications + pendingCounts.reports + pendingCounts.tradeProfiles;

  /* ── column definitions ── */
  const userCols = [
    { key: 'displayName', label: 'Name', render: r => r.displayName || `${r.firstName || ''} ${r.surname || ''}`.trim() || '—' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'isVerified', label: 'Verified', render: r => r.isVerified ? 'Yes' : 'No' },
    { key: 'mooringLocation', label: 'Mooring' },
    { key: 'createdAt', label: 'Joined', render: r => fmtDate(r.createdAt) },
  ];

  const listingCols = [
    { key: 'photo', label: '', render: r => r.images?.[0] ? <img src={r.images[0]} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: 36, height: 36, background: 'var(--linen)', borderRadius: 4 }} /> },
    { key: 'title', label: 'Title' },
    { key: 'seller', label: 'Seller', render: r => r.sellerId?.displayName || r.sellerId?.username || '—' },
    { key: 'listingType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', render: r => r.price === 0 ? 'Free' : `£${r.price}` },
    { key: 'isAvailable', label: 'Active', render: r => r.isAvailable ? 'Yes' : 'No' },
    { key: 'removed', label: 'Removed', render: r => r.removed ? 'Yes' : '—' },
    { key: 'createdAt', label: 'Listed', render: r => fmtDate(r.createdAt) },
  ];

  const boatCols = [
    { key: 'photo', label: '', render: r => r.boatPhotoUrl ? <img src={r.boatPhotoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: 36, height: 36, background: 'var(--linen)', borderRadius: 4 }} /> },
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
    { key: 'photo', label: '', render: r => r.photos?.[0] ? <img src={r.photos[0]} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: 36, height: 36, background: 'var(--linen)', borderRadius: 4 }} /> },
    { key: 'hazardType', label: 'Type', render: r => r.hazardType?.replace(/_/g, ' ') },
    { key: 'description', label: 'Description' },
    { key: 'severity', label: 'Severity' },
    { key: 'source', label: 'Source' },
    { key: 'isResolved', label: 'Resolved', render: r => r.isResolved ? 'Yes' : 'No' },
    { key: 'createdAt', label: 'Reported', render: r => fmtDate(r.createdAt) },
    { key: 'expiresAt', label: 'Expires', render: r => fmtDate(r.expiresAt) },
  ];

  const logCols = [
    { key: 'entryDate', label: 'Date', render: r => fmtDate(r.entryDate) },
    { key: 'boat', label: 'Boat', render: r => r.boatId?.boatName || '—' },
    { key: 'owner', label: 'Owner', render: r => r.boatId?.ownerId?.displayName || r.boatId?.ownerId?.username || '—' },
    { key: 'startLocation', label: 'From' },
    { key: 'endLocation', label: 'To' },
    { key: 'distance', label: 'Miles' },
    { key: 'locks', label: 'Locks' },
    { key: 'notes', label: 'Notes' },
  ];

  /* ── login wall ── */
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
              <input type="email" required autoFocus value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: 'var(--paper)', fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
              <input type="password" required value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: 'var(--paper)', fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {loginError && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.5)', borderRadius: 'var(--r-md)', fontSize: 13, color: '#f1a49a' }}>{loginError}</div>}
            <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: 14, borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-sans)', cursor: loginLoading ? 'wait' : 'pointer' }}>
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--paper)', marginBottom: 8 }}>Access denied</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24 }}>{user.email} doesn't have admin access.</div>
          <button onClick={handleLogout} style={{ padding: '10px 24px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sans)', fontSize: 14, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>
    );
  }

  const queueTotal = pendingCounts.total;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--linen)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Admin Dashboard</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Signed in as {user.email}</div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t}
              {t === 'Review Queue' && queueTotal > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: 'var(--rust)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{queueTotal}</span>
              )}
            </button>
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
                {queueTotal > 0 && (
                  <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--rust-soft, #FCEEEA)', border: '1px solid var(--rust)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--rust)' }}>
                        {queueTotal} item{queueTotal !== 1 ? 's' : ''} waiting for review
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 2 }}>
                        {pendingCounts.certifications > 0 && `${pendingCounts.certifications} boat cert${pendingCounts.certifications !== 1 ? 's' : ''}`}
                        {pendingCounts.certifications > 0 && (pendingCounts.reports > 0 || pendingCounts.tradeProfiles > 0) && ' · '}
                        {pendingCounts.reports > 0 && `${pendingCounts.reports} report${pendingCounts.reports !== 1 ? 's' : ''}`}
                        {pendingCounts.reports > 0 && pendingCounts.tradeProfiles > 0 && ' · '}
                        {pendingCounts.tradeProfiles > 0 && `${pendingCounts.tradeProfiles} trade profile${pendingCounts.tradeProfiles !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <button onClick={() => setTab('Review Queue')} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--rust)', background: 'var(--rust)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                      Go to queue →
                    </button>
                  </div>
                )}

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
                    <StatCard label="Pending" value={stats.boats.pending} color={stats.boats.pending > 0 ? 'var(--rust)' : undefined} />
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <StatCard label="Log entries" value={stats.logbook.total} />
                    <StatCard label="Hazard reports" value={stats.hazards.total} />
                    <StatCard label="Pending reports" value={stats.pendingQueue?.reports ?? 0} color={stats.pendingQueue?.reports > 0 ? 'var(--rust)' : undefined} />
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
                          <tr>{['Reason', 'Count', 'Avg days live'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--silt)', background: 'var(--linen)', borderBottom: '2px solid var(--reed)' }}>{h}</th>)}</tr>
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
                  {stats.removals.topCategories?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 8 }}>Top removed categories</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stats.removals.topCategories.map(c => (
                          <span key={c._id} style={{ padding: '5px 12px', background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 99, fontSize: 13 }}>
                            {c._id || 'Uncategorised'} <strong>({c.count})</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              </>
            )}

            {/* ── REVIEW QUEUE ── */}
            {tab === 'Review Queue' && (
              <ReviewQueueTab
                pending={pending} setPending={setPending}
                reports={reports} setReports={setReports}
                tradeProfiles={tradeProfiles} setTradeProfiles={setTradeProfiles}
                actioning={actioning} setActioning={setActioning}
                pendingCounts={pendingCounts}
              />
            )}

            {/* ── USERS ── */}
            {tab === 'Users' && (
              <Section title={`Users (${users.length})`}>
                <SearchBar value={userSearch} onChange={searchUsers} placeholder="Search by name, username or email…" />
                <DataTable columns={userCols} rows={users} onDownload={dlUsers} onRowClick={r => setEditing({ kind: 'user', record: r })} emptyMessage="No users match your search." />
              </Section>
            )}

            {/* ── LISTINGS ── */}
            {tab === 'Listings' && (
              <Section title={`Listings (${listings.length})`}>
                <SearchBar value={listingSearch} onChange={searchListings} placeholder="Search by title, category or location…" />
                <DataTable columns={listingCols} rows={listings} onDownload={dlListings} onRowClick={r => setEditing({ kind: 'listing', record: r })} emptyMessage="No listings match your search." />
              </Section>
            )}

            {/* ── BOATS ── */}
            {tab === 'Boats' && (
              <Section title={`Boats (${boats.length})`}>
                <DataTable columns={boatCols} rows={boats} onDownload={dlBoats} onRowClick={r => setEditing({ kind: 'boat', record: r })} />
              </Section>
            )}

            {/* ── HAZARDS & LOGBOOK ── */}
            {tab === 'Hazards & Logbook' && (
              <>
                <Section
                  title={`Hazards (${hazards.length})`}
                  action={
                    <button onClick={() => setCreatingHazard(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--moss)', color: 'var(--paper)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                      + Post hazard
                    </button>
                  }
                >
                  <DataTable columns={hazardCols} rows={hazards} onDownload={dlHazards} onRowClick={r => setEditing({ kind: 'hazard', record: r })} />
                </Section>

                <Section title={`Logbook entries (${logs.length})`}>
                  <DataTable columns={logCols} rows={logs} onDownload={dlLogs} onRowClick={r => setEditing({ kind: 'log', record: r })} />
                </Section>
              </>
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      {editing && modalConfig && (
        <EditModal title={modalConfig.title} fields={modalConfig.fields} record={editing.record} onSave={saveEdit} onDelete={deleteEdit} onClose={() => setEditing(null)} />
      )}

      {/* Create hazard modal */}
      {creatingHazard && (
        <EditModal title="Post new hazard" fields={hazardCreateFields} record={null} onSave={saveNewHazard} onClose={() => setCreatingHazard(false)} />
      )}
    </div>
  );
}

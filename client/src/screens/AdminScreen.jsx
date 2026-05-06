import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

/* ── helpers ───────────────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

/* ── spreadsheet table ─────────────────────────────────────────── */

function DataTable({ columns, rows, onDownload }) {
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
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
              <tr key={i} style={{ background: i % 2 === 1 ? 'var(--linen)' : 'var(--paper)' }}>
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

const REASON_LABELS = {
  sold_waterline: 'Sold via Waterline',
  sold_elsewhere: 'Sold elsewhere',
  no_longer_needed: 'No longer needed',
};

const TABS = ['Overview', 'Users', 'Listings', 'Removals'];

/* ── main component ────────────────────────────────────────────── */

export default function AdminScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [removals, setRemovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteMsg, setPromoteMsg] = useState('');

  useEffect(() => {
    if (!user) { nav('/auth'); return; }
    if (user.role !== 'admin') { nav('/map'); return; }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    Promise.all([
      api.adminStats(),
      api.adminUsers(),
      api.adminListings(),
      api.adminRemovals(),
    ]).then(([s, u, l, r]) => {
      setStats(s); setUsers(u); setListings(l); setRemovals(r);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const promote = async () => {
    try {
      const res = await api.adminPromote(promoteEmail.trim());
      setPromoteMsg(res.message);
      setPromoteEmail('');
    } catch (e) { setPromoteMsg('Error: ' + e.message); }
  };

  if (!user || user.role !== 'admin') return null;

  /* ── column definitions ── */
  const userCols = [
    { key: 'displayName', label: 'Name' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'isVerified', label: 'Verified', render: r => r.isVerified ? 'Yes' : 'No' },
    { key: 'mooringLocation', label: 'Current mooring' },
    { key: 'createdAt', label: 'Joined', render: r => fmtDate(r.createdAt) },
  ];

  const listingCols = [
    { key: 'title', label: 'Title' },
    { key: 'seller', label: 'Seller', render: r => r.sellerId?.displayName || r.sellerId?.username || '—' },
    { key: 'listingType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price (£)', render: r => r.price === 0 ? 'Free' : `£${r.price}` },
    { key: 'isAvailable', label: 'Status', render: r => r.isAvailable ? 'Active' : 'Inactive' },
    { key: 'createdAt', label: 'Listed', render: r => fmtDate(r.createdAt) },
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
      Verified: u.isVerified ? 'Yes' : 'No',
      'Current mooring': u.mooringLocation,
      Joined: fmtDate(u.createdAt),
    })),
    ['Name', 'Username', 'Email', 'Verified', 'Current mooring', 'Joined'],
  );

  const dlListings = () => downloadCsv('waterline-listings.csv',
    listings.map(l => ({
      Title: l.title,
      Seller: l.sellerId?.displayName || l.sellerId?.username,
      Type: l.listingType, Category: l.category,
      'Price (£)': l.price === 0 ? 'Free' : l.price,
      Status: l.isAvailable ? 'Active' : 'Inactive',
      Listed: fmtDate(l.createdAt),
    })),
    ['Title', 'Seller', 'Type', 'Category', 'Price (£)', 'Status', 'Listed'],
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

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--linen)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => nav('/map')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Icon name="back" size={22} color="var(--paper)" />
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Admin Dashboard</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Waterline internal · {user?.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--paper)' : 'rgba(255,255,255,0.4)',
              fontWeight: tab === t ? 700 : 500, fontSize: 13, fontFamily: 'var(--font-sans)',
              borderBottom: tab === t ? '2px solid var(--paper)' : '2px solid transparent',
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

            {/* ── USERS ── */}
            {tab === 'Users' && (
              <Section title={`All users (${users.length})`}>
                <DataTable columns={userCols} rows={users} onDownload={dlUsers} />
              </Section>
            )}

            {/* ── LISTINGS ── */}
            {tab === 'Listings' && (
              <Section title={`Recent listings (${listings.length})`}>
                <DataTable columns={listingCols} rows={listings} onDownload={dlListings} />
              </Section>
            )}

            {/* ── REMOVALS ── */}
            {tab === 'Removals' && (
              <Section title={`Removal log (${removals.length})`}>
                <DataTable columns={removalCols} rows={removals} onDownload={dlRemovals} />
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

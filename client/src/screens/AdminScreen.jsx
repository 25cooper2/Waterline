import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

/* ── tiny helpers ─────────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

const REASON_LABELS = {
  sold_waterline: '✅ Sold via Waterline',
  sold_elsewhere: '🔀 Sold elsewhere',
  no_longer_needed: '❌ No longer needed',
};

/* ── tabs ─────────────────────────────────────────────────────── */
const TABS = ['Overview', 'Users', 'Listings', 'Removals'];

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

  // Guard — must be admin
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
      setStats(s);
      setUsers(u);
      setListings(l);
      setRemovals(r);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const promote = async () => {
    try {
      const res = await api.adminPromote(promoteEmail.trim());
      setPromoteMsg(res.message);
      setPromoteEmail('');
    } catch (e) {
      setPromoteMsg('Error: ' + e.message);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--linen)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => nav('/map')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--paper)', display: 'flex' }}
          >
            <Icon name="back" size={22} color="var(--paper)" />
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Admin Dashboard</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Waterline internal</div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t ? 'var(--paper)' : 'rgba(255,255,255,0.45)',
                fontWeight: tab === t ? 700 : 500, fontSize: 13,
                fontFamily: 'var(--font-sans)',
                borderBottom: tab === t ? '2px solid var(--paper)' : '2px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px 60px', maxWidth: 800, margin: '0 auto' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'Overview' && stats && (
              <>
                <Section title="Users">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <StatCard label="Total" value={stats.users.total} />
                    <StatCard label="Verified" value={stats.users.verified} color="var(--moss)" />
                    <StatCard label="New (30d)" value={stats.users.new30d} color="var(--moss)" />
                  </div>
                </Section>

                <Section title="Boats">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <StatCard label="Total" value={stats.boats.total} />
                    <StatCard label="Verified" value={stats.boats.verified} color="var(--moss)" />
                    <StatCard label="Pending" value={stats.boats.pending} color="var(--rust)" />
                  </div>
                </Section>

                <Section title="Marketplace">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <StatCard label="Total listings" value={stats.listings.total} />
                    <StatCard label="Active" value={stats.listings.active} color="var(--moss)" />
                    <StatCard label="New (30d)" value={stats.listings.new30d} color="var(--moss)" />
                  </div>
                </Section>

                <Section title="Activity">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <StatCard label="Log entries" value={stats.logbook.total} />
                    <StatCard label="Hazard reports" value={stats.hazards.total} />
                  </div>
                </Section>

                <Section title="Listing removals">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <StatCard label="Total removed" value={stats.removals.total} />
                    <StatCard
                      label="Avg days live"
                      value={stats.removals.avgDaysLive != null ? `${Math.round(stats.removals.avgDaysLive)}d` : '—'}
                      sub="before removal"
                    />
                  </div>
                  {/* Reason breakdown */}
                  {stats.removals.breakdown.length > 0 && (
                    <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                      {stats.removals.breakdown.map((r, i) => (
                        <div key={r._id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderBottom: i < stats.removals.breakdown.length - 1 ? '1px solid var(--linen)' : 'none',
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{REASON_LABELS[r._id] || r._id}</div>
                            <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 2 }}>
                              Avg {Math.round(r.avgDaysLive ?? 0)} days live
                            </div>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{r.count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Top categories */}
                  {stats.removals.topCategories.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--silt)', fontWeight: 600, marginBottom: 8 }}>TOP REMOVED CATEGORIES</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stats.removals.topCategories.map(c => (
                          <span key={c._id} style={{
                            padding: '4px 12px', borderRadius: 'var(--r-pill)',
                            background: 'var(--paper)', border: '1px solid var(--reed)',
                            fontSize: 13, fontWeight: 500,
                          }}>
                            {c._id || 'Other'} <strong>({c.count})</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>

                {/* Promote user */}
                <Section title="Promote to admin">
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', padding: '16px' }}>
                    <div style={{ fontSize: 13, color: 'var(--silt)', marginBottom: 10 }}>
                      Enter the email address of the Waterline account you want to give admin access.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="field"
                        style={{ flex: 1 }}
                        type="email"
                        value={promoteEmail}
                        onChange={e => setPromoteEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                      <button className="btn primary" onClick={promote} disabled={!promoteEmail.trim()}>
                        Promote
                      </button>
                    </div>
                    {promoteMsg && <div style={{ fontSize: 13, marginTop: 8, color: 'var(--moss)' }}>{promoteMsg}</div>}
                  </div>
                </Section>
              </>
            )}

            {/* ── USERS ── */}
            {tab === 'Users' && (
              <Section title={`All users (${users.length})`}>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                  {users.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--silt)' }}>No users yet</div>
                  )}
                  {users.map((u, i) => (
                    <div key={u._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderBottom: i < users.length - 1 ? '1px solid var(--linen)' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'var(--moss)',
                      }}>
                        {(u.displayName || u.username || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.displayName || u.username || 'No name'}</div>
                        <div style={{ fontSize: 12, color: 'var(--silt)' }}>{u.email}</div>
                        {u.mooringLocation && (
                          <div style={{ fontSize: 11, color: 'var(--pebble)', marginTop: 1 }}>📍 {u.mooringLocation}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {u.isVerified && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--moss)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Verified</span>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--silt)', marginTop: 2 }}>{fmtDate(u.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── LISTINGS ── */}
            {tab === 'Listings' && (
              <Section title={`Recent listings (${listings.length})`}>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                  {listings.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--silt)' }}>No listings yet</div>
                  )}
                  {listings.map((l, i) => (
                    <div key={l._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderBottom: i < listings.length - 1 ? '1px solid var(--linen)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{l.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 2 }}>
                          {l.sellerId?.displayName || 'Unknown'} · {l.category} · {l.listingType}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: l.price === 0 ? 'var(--moss)' : 'var(--ink)' }}>
                          {l.price === 0 ? 'Free' : `£${l.price}`}
                        </div>
                        <div style={{ fontSize: 11, color: l.isAvailable ? 'var(--moss)' : 'var(--silt)', marginTop: 2 }}>
                          {l.isAvailable ? 'Active' : 'Inactive'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--silt)' }}>{fmtDate(l.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── REMOVALS ── */}
            {tab === 'Removals' && (
              <Section title={`Removal log (${removals.length})`}>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                  {removals.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--silt)' }}>No removals recorded yet</div>
                  )}
                  {removals.map((r, i) => (
                    <div key={r._id} style={{
                      padding: '12px 16px',
                      borderBottom: i < removals.length - 1 ? '1px solid var(--linen)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{r.title || 'Untitled'}</div>
                          <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 2 }}>
                            {r.sellerId?.displayName || 'Unknown'} · {r.category} · {r.listingType}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 1 }}>
                            {REASON_LABELS[r.removalReason] || r.removalReason}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                            {r.price === 0 ? 'Free' : `£${r.price}`}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--pebble)', marginTop: 2 }}>
                            {r.daysLive != null ? `${r.daysLive}d live` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--silt)' }}>{fmtDate(r.removedAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

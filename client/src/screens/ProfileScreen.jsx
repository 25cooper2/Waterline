import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import LoginWall from '../components/LoginWall';
import Plate from '../components/Plate';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const nav = useNavigate();

  // Boat registration modal state
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [boatForm, setBoatForm] = useState({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
  const [boatError, setBoatError] = useState('');
  const [boatLoading, setBoatLoading] = useState(false);

  // Data for listings, logbook, friends
  const [listings, setListings] = useState([]);
  const [logbookCount, setLogbookCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch user's listings
    api.listProducts({ seller: user._id }).then(res => {
      const items = Array.isArray(res) ? res : (res.products || []);
      setListings(items);
    }).catch(() => {});

    // Fetch logbook count
    if (user.boatId) {
      api.getLogbook(user.boatId, { limit: 1 }).then(res => {
        if (res.total != null) setLogbookCount(res.total);
        else if (Array.isArray(res)) setLogbookCount(res.length);
        else if (res.entries) setLogbookCount(res.entries.length);
      }).catch(() => {});
    }

    api.inbox({ unreadOnly: 'true' }).then(res => {
      const list = Array.isArray(res) ? res : [];
      setUnreadCount(list.length);
    }).catch(() => {});

    // Fetch following/friends
    api.following(user._id).then(res => {
      const list = Array.isArray(res) ? res : (res.following || []);
      setFriends(list);
    }).catch(() => {});
  }, [user]);

  const submitBoat = async () => {
    setBoatError('');
    setBoatLoading(true);
    try {
      await api.createBoat(boatForm);
      await refreshUser();
      setShowAddBoat(false);
      setBoatForm({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
    } catch (e) {
      setBoatError(e.message);
    } finally {
      setBoatLoading(false);
    }
  };

  if (!user) return <LoginWall tab="me" />;

  return (
    <div className="screen">
      {/* App bar — "Me" title + settings gear */}
      <div className="appbar">
        <h1>Me</h1>
        <button
          className="btn text"
          style={{ padding: '8px 0' }}
          onClick={() => nav('/settings')}
          aria-label="Settings"
        >
          <Icon name="settings" size={22} color="var(--ink)" />
        </button>
      </div>

      <div className="scroll">
        {/* Profile header */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}>
          <Avatar name={user.displayName} src={user.profilePhotoUrl} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {user.displayName || 'Boater'}
            </div>
            {user.username && (
              <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>@{user.username}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {user.boatId && user.boatIndexNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plate>{user.boatIndexNumber}</Plate>
                  {user.boatName && (
                    <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{user.boatName}</span>
                  )}
                </div>
              )}
              {user.isVerified && (
                <span className="chip moss" style={{ cursor: 'default', height: 24, fontSize: 11.5, padding: '0 10px', gap: 4 }}>
                  <Icon name="check" size={11} color="var(--moss)" stroke={2.5} /> Verified boat
                </span>
              )}
            </div>
            {!user.boatId && (
              <button
                onClick={() => setShowAddBoat(true)}
                className="btn text"
                style={{ padding: '6px 0 0', fontSize: 13, color: 'var(--moss)', fontWeight: 600 }}
              >
                <Icon name="plus" size={14} color="var(--moss)" stroke={2} /> Add my boat
              </button>
            )}
          </div>
        </div>

        {/* Messages quick link */}
        <div style={{ padding: '0 20px 16px' }}>
          <button onClick={() => nav('/messages')} className="row" style={{
            cursor: 'pointer', width: '100%', padding: '14px 16px', gap: 12,
            background: 'var(--paper)', border: '1px solid var(--reed)',
            borderRadius: 'var(--r-lg)', alignItems: 'center', fontFamily: 'var(--font-sans)',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="inbox" size={20} color="var(--moss)" />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Messages</div>
              <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'Direct messages and hails'}
              </div>
            </div>
            {unreadCount > 0 && (
              <span style={{ background: 'var(--moss)', color: 'var(--paper)', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '2px 8px', minWidth: 22, textAlign: 'center' }}>{unreadCount}</span>
            )}
            <Icon name="chevron" size={16} color="var(--pebble)" />
          </button>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '1px solid var(--reed)',
          borderBottom: '1px solid var(--reed)',
        }}>
          <button
            onClick={() => nav('/market')}
            style={{
              ...statCell,
              borderRight: '1px solid var(--reed)',
            }}
          >
            <span style={statNumber}>{listings.length}</span>
            <span style={statLabel}>Listings</span>
          </button>
          <button
            onClick={() => nav('/logbook')}
            style={{
              ...statCell,
              borderRight: '1px solid var(--reed)',
            }}
          >
            <span style={statNumber}>{logbookCount}</span>
            <span style={statLabel}>Logbook</span>
          </button>
          <button
            onClick={() => nav('/friends')}
            style={statCell}
          >
            <span style={statNumber}>{friends.length}</span>
            <span style={statLabel}>Friends</span>
          </button>
        </div>

        {/* Trade upgrade card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            background: 'var(--moss-soft)',
            border: '1px solid rgba(26,107,90,0.15)',
            borderRadius: 'var(--r-lg)',
            padding: '20px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--r-md)',
              background: 'rgba(26,107,90,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name="wrench" size={22} color="var(--moss)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 3 }}>
                Offer your services
              </div>
              <div style={{ fontSize: 13, color: 'var(--silt)', lineHeight: 1.45, marginBottom: 14 }}>
                Become a Waterline Trade
              </div>
              <button
                onClick={() => nav('/trade-setup')}
                className="btn primary"
                style={{ height: 40, fontSize: 13.5, padding: '0 18px' }}
              >
                Set up trade profile
              </button>
            </div>
          </div>
        </div>

        {/* My listings section */}
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div className="label" style={{ marginBottom: 0 }}>My listings</div>
            <button
              onClick={() => nav('/market')}
              className="btn text"
              style={{ fontSize: 13, padding: 0, height: 'auto' }}
            >
              See all <Icon name="chevron" size={14} color="var(--silt)" />
            </button>
          </div>

          {listings.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <Icon name="market" size={28} color="var(--pebble)" />
              <p style={{ margin: '8px 0 14px', color: 'var(--silt)', fontSize: 14 }}>
                No listings yet.
              </p>
              <button
                onClick={() => nav('/market')}
                className="btn ghost"
                style={{ height: 40, fontSize: 13.5 }}
              >
                <Icon name="plus" size={16} /> Create listing
              </button>
            </div>
          ) : (
            <div className="card">
              {listings.slice(0, 4).map((item, i) => (
                <div
                  key={item._id || i}
                  className="row"
                  style={{ cursor: 'pointer', gap: 12, padding: '12px 16px' }}
                  onClick={() => nav(item.listingType === 'service' ? `/market/service/${item._id}` : `/market/edit/${item._id}`)}
                >
                  {/* Image placeholder */}
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 'var(--r-sm)',
                    background: item.images?.[0]
                      ? `url(${item.images[0]}) center/cover`
                      : 'var(--linen)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {!item.images?.[0] && (
                      <Icon name="image" size={20} color="var(--pebble)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: 600, fontSize: 14 }}>
                      {item.title || 'Untitled'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--moss)' }}>
                        {item.price != null ? `£${item.price}` : 'Free'}
                      </span>
                      {item.inquiries > 0 && (
                        <span className="muted" style={{ fontSize: 12 }}>
                          {item.inquiries} {item.inquiries === 1 ? 'inquiry' : 'inquiries'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Icon name="chevron" size={16} color="var(--pebble)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends & following carousel */}
        <div style={{ padding: '24px 0 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            marginBottom: 14,
          }}>
            <div className="label" style={{ marginBottom: 0 }}>Friends &amp; following</div>
            <button
              onClick={() => nav('/friends')}
              className="btn text"
              style={{ fontSize: 13, padding: 0, height: 'auto' }}
            >
              See all <Icon name="chevron" size={14} color="var(--silt)" />
            </button>
          </div>

          {friends.length === 0 ? (
            <div style={{ padding: '0 20px 24px' }}>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <Icon name="friend" size={28} color="var(--pebble)" />
                <p style={{ margin: '8px 0 0', color: 'var(--silt)', fontSize: 14 }}>
                  No friends yet. Find boaters on the map!
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              padding: '0 20px 24px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}>
              {friends.map((f, i) => (
                <div
                  key={f._id || i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 72,
                    scrollSnapAlign: 'start',
                    cursor: 'pointer',
                  }}
                  onClick={() => f._id && nav(`/profile/${f._id}`)}
                >
                  <Avatar
                    name={f.displayName || f.username || ''}
                    src={f.profilePhotoUrl}
                    size={56}
                  />
                  <span className="truncate" style={{
                    fontSize: 12,
                    fontWeight: 600,
                    maxWidth: 72,
                    textAlign: 'center',
                  }}>
                    {f.displayName || f.username || 'Boater'}
                  </span>
                  {f.boatIndexNumber && (
                    <Plate>{f.boatIndexNumber}</Plate>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom spacing */}
        <div style={{ height: 24 }} />
      </div>

      {/* Add boat sheet modal */}
      {showAddBoat && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(31,42,38,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          <div className="sheet" style={{ width: '100%', padding: '0 0 40px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>Register your boat</h3>
              <div className="stack">
                <div>
                  <label className="label">Boat index number (CRT)</label>
                  <input
                    className="field mono"
                    value={boatForm.boatIndexNumber}
                    onChange={e => setBoatForm(f => ({ ...f, boatIndexNumber: e.target.value.toUpperCase() }))}
                    placeholder="E.G. ABC1234"
                    maxLength={7}
                  />
                  <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>
                    Found on your CRT or authority licence.
                  </div>
                </div>
                <div>
                  <label className="label">Boat name</label>
                  <input
                    className="field"
                    value={boatForm.boatName}
                    onChange={e => setBoatForm(f => ({ ...f, boatName: e.target.value }))}
                    placeholder="e.g. Kingfisher"
                  />
                </div>
                <div>
                  <label className="label">Boat type</label>
                  <select
                    className="field"
                    value={boatForm.boatType}
                    onChange={e => setBoatForm(f => ({ ...f, boatType: e.target.value }))}
                  >
                    <option value="narrowboat">Narrowboat</option>
                    <option value="widebeam">Widebeam</option>
                    <option value="cruiser">Cruiser</option>
                    <option value="dutch">Dutch barge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {boatError && <div className="error-msg">{boatError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowAddBoat(false)} className="btn ghost" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={submitBoat}
                    disabled={!boatForm.boatIndexNumber || !boatForm.boatName || boatLoading}
                    className="btn primary"
                    style={{ flex: 1 }}
                  >
                    {boatLoading ? 'Adding…' : 'Register boat'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Shared styles for the stats grid */
const statCell = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  padding: '18px 0',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const statNumber = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--ink)',
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

const statLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--silt)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

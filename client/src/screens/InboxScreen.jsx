import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';
import { getCachedLocation, saveDeviceLocation, getLiveLocation } from '../utils/deviceLocation';
import { compressImage } from '../utils/imageCompress';
import ReportSheet from '../components/ReportSheet';

const HAIL_REASONS = [
  'Moored next to you',
  'Lost & found',
  'Spotted a hazard',
  'General hello',
];

const SCOPES = [
  { id: 'nearby', label: 'Nearby' },
  { id: 'following', label: 'Following' },
  { id: 'all', label: 'All' },
];

const RADIUS_OPTIONS = [
  { mi: 0.62,  label: 'Within 1 km' },
  { mi: 5,     label: 'Within 5 mi (default)' },
  { mi: 6.21,  label: 'Within 10 km' },
  { mi: 25,    label: 'Within 25 mi' },
];

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function InboxScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState('nearby');
  const [radiusMi, setRadiusMi] = useState(5);
  const [showRadius, setShowRadius] = useState(false);
  const [feedQuery, setFeedQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showHail, setShowHail] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [openPostId, setOpenPostId] = useState(null);
  const [showDM, setShowDM] = useState(false);
  const [dmQuery, setDmQuery] = useState('');
  const [dmResults, setDmResults] = useState([]);
  const [hazardsNearby, setHazardsNearby] = useState([]);
  const [postPhotos, setPostPhotos] = useState([]);
  const photoInputRef = useRef(null);
  const dmTimer = useRef(null);

  const [hailForm, setHailForm] = useState({ recipientBoatIndexNumber: '', body: '', reason: '' });
  const [hailError, setHailError] = useState('');
  const [hailNotFound, setHailNotFound] = useState(false);

  const [postForm, setPostForm] = useState({ body: '', tags: '', includeLocation: true });
  const [postError, setPostError] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const tagSearchTimer = useRef(null);
  const searchTimeout = useRef(null);

  const requireLogin = () => {
    if (!user) { setShowLoginGate(true); return false; }
    return true;
  };

  /* ---- load feed ---- */
  const getBestLocation = () =>
    getCachedLocation() || (user?.mooringLat ? { lat: user.mooringLat, lng: user.mooringLng } : null);

  const fetchHazards = async (loc) => {
    if (!loc) return;
    const dLat = radiusMi / 69;
    const dLng = radiusMi / (69 * Math.cos(loc.lat * Math.PI / 180));
    try {
      const hz = await api.listHazards({
        minLat: loc.lat - dLat, maxLat: loc.lat + dLat,
        minLng: loc.lng - dLng, maxLng: loc.lng + dLng,
      });
      setHazardsNearby(hz || []);
    } catch { /* keep existing */ }
  };

  const loadFeed = async () => {
    setLoading(true);
    const params = {};
    let nearLoc = null;
    if (scope === 'nearby') {
      // Use cached/mooring immediately — GPS update fires in background
      nearLoc = getBestLocation();
      if (nearLoc) {
        params.lat = nearLoc.lat;
        params.lng = nearLoc.lng;
        params.radius = radiusMi;
      }
      // Ask GPS in background; if it returns a better location, refresh hazards
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            saveDeviceLocation(pos.coords.latitude, pos.coords.longitude);
            fetchHazards({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    } else if (scope === 'following') {
      if (!user) { setLoading(false); setPosts([]); setHazardsNearby([]); return; }
      params.followingOnly = 'true';
    }
    if (activeTag) params.tag = activeTag;
    if (feedQuery.trim()) params.q = feedQuery.trim();
    try {
      const result = await api.listPosts(params);
      setPosts(result || []);
    } catch { setPosts([]); }

    if (scope === 'nearby' && !activeTag && !feedQuery.trim()) {
      await fetchHazards(nearLoc);
    } else {
      setHazardsNearby([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(loadFeed, feedQuery ? 300 : 0);
    return () => clearTimeout(searchTimeout.current);
  }, [scope, radiusMi, activeTag, feedQuery, user]);

  // Auto-refresh hazards every 60 s so new ones appear in the timeline
  useEffect(() => {
    if (scope !== 'nearby') return;
    const id = setInterval(() => {
      const loc = getBestLocation();
      if (loc) fetchHazards(loc);
    }, 60000);
    return () => clearInterval(id);
  }, [scope, radiusMi, user]);

  useEffect(() => {
    api.trendingTags().then(setTrendingTags).catch(() => {});
  }, []);

  /* ---- tag autocomplete (comma-separated; spaces allowed inside a tag) ---- */
  useEffect(() => {
    clearTimeout(tagSearchTimer.current);
    const last = tagInput.split(',').pop() || '';
    const cleaned = last.replace(/^#/, '').toLowerCase().trim();
    if (cleaned.length < 2) { setTagSuggestions([]); return; }
    tagSearchTimer.current = setTimeout(() => {
      api.searchTags(cleaned).then(setTagSuggestions).catch(() => setTagSuggestions([]));
    }, 200);
    return () => clearTimeout(tagSearchTimer.current);
  }, [tagInput]);

  const completeTag = (tag) => {
    const parts = tagInput.split(',');
    parts[parts.length - 1] = ' ' + tag;
    setTagInput(parts.join(',') + ', ');
    setTagSuggestions([]);
  };

  /* ---- DM user search ---- */
  useEffect(() => {
    clearTimeout(dmTimer.current);
    if (!showDM || dmQuery.trim().length < 2) { setDmResults([]); return; }
    dmTimer.current = setTimeout(() => {
      api.searchUsers(dmQuery.trim()).then(setDmResults).catch(() => setDmResults([]));
    }, 250);
    return () => clearTimeout(dmTimer.current);
  }, [dmQuery, showDM]);

  /* ---- hail ---- */
  const openHail = () => {
    if (!requireLogin()) return;
    setHailForm({ recipientBoatIndexNumber: '', body: '', reason: '' });
    setHailError(''); setHailNotFound(false); setShowHail(true);
  };

  const sendHail = async () => {
    setHailError(''); setHailNotFound(false);
    try {
      await api.sendHail({
        recipientBoatIndexNumber: hailForm.recipientBoatIndexNumber,
        body: hailForm.body,
        reason: hailForm.reason || undefined,
      });
      setShowHail(false);
    } catch (e) {
      if (e.message === 'boat_not_found' || e.message?.includes('not on Waterline')) setHailNotFound(true);
      else setHailError(e.message);
    }
  };

  /* ---- post ---- */
  const openPostComposer = () => {
    if (!requireLogin()) return;
    setPostForm({ body: '', tags: '', includeLocation: true });
    setTagInput('');
    setPostPhotos([]);
    setPostError(''); setShowPost(true);
  };

  const handlePhotoPick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - postPhotos.length);
    const compressed = await Promise.all(files.map(f => compressImage(f, { maxDim: 1400, quality: 0.8 })));
    setPostPhotos(p => [...p, ...compressed.filter(Boolean)]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const submitPost = async () => {
    if (!postForm.body.trim()) return;
    setPostSubmitting(true);
    setPostError('');
    try {
      const body = { body: postForm.body.trim(), tags: tagInput, photos: postPhotos };
      if (postForm.includeLocation) {
        // Use device's live location at the moment of posting
        const live = await getLiveLocation();
        if (live) { body.lat = live.lat; body.lng = live.lng; }
      }
      await api.createPost(body);
      setShowPost(false);
      loadFeed();
    } catch (e) { setPostError(e.message); }
    setPostSubmitting(false);
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="appbar" style={{ height: 'auto', padding: '14px 20px 0', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>Feed</h1>
            <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 4 }}>
              {posts.length} post{posts.length !== 1 ? 's' : ''}{scope === 'nearby' ? ' nearby' : scope === 'following' ? ' from people you follow' : ''}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)} className="btn primary"
              style={{ width: 40, height: 40, padding: 0, borderRadius: 'var(--r-pill)', flexShrink: 0 }} aria-label="New">
              <Icon name="plus" size={20} />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} />
                <div style={{ position: 'absolute', top: 46, right: 0, zIndex: 1600, background: 'var(--paper)', borderRadius: 12, boxShadow: 'var(--sh-3)', border: '1px solid var(--reed)', minWidth: 200, overflow: 'hidden' }}>
                  <button onClick={() => { setMenuOpen(false); openHail(); }} style={menuItemStyle}>
                    <Icon name="send" size={16} color="var(--moss)" />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Hail a boat</div>
                      <div style={{ fontSize: 12, color: 'var(--silt)' }}>Direct message by index</div>
                    </div>
                  </button>
                  <div style={{ height: 1, background: 'var(--reed)' }} />
                  <button onClick={() => { setMenuOpen(false); openPostComposer(); }} style={menuItemStyle}>
                    <Icon name="image" size={16} color="var(--moss)" />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Post to feed</div>
                      <div style={{ fontSize: 12, color: 'var(--silt)' }}>Share with nearby boaters</div>
                    </div>
                  </button>
                  <div style={{ height: 1, background: 'var(--reed)' }} />
                  <button onClick={() => {
                    setMenuOpen(false);
                    if (!requireLogin()) return;
                    setDmQuery(''); setDmResults([]); setShowDM(true);
                  }} style={menuItemStyle}>
                    <Icon name="friend" size={16} color="var(--moss)" />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Direct message</div>
                      <div style={{ fontSize: 12, color: 'var(--silt)' }}>Search by name, username or boat</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--linen)', borderRadius: 10, padding: '8px 12px' }}>
          <Icon name="search" size={16} color="var(--silt)" />
          <input value={feedQuery} onChange={e => setFeedQuery(e.target.value)}
            placeholder="Search posts, #tags or friends…"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 14, fontFamily: 'var(--font-sans)', minWidth: 0 }} />
          {(feedQuery || activeTag) && (
            <button onClick={() => { setFeedQuery(''); setActiveTag(null); }} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2, color: 'var(--silt)' }}>
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scope chips */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 20px 0', overflowX: 'auto', scrollbarWidth: 'none', position: 'relative' }}>
        {SCOPES.map(s => (
          <button key={s.id} className={`chip${scope === s.id ? ' active' : ''}`}
            onClick={() => {
              if (s.id === 'nearby') { if (scope === 'nearby') { setShowRadius(o => !o); } else { setScope('nearby'); } }
              else { setScope(s.id); setShowRadius(false); }
            }}
            style={{ border: 0 }}>
            {s.id === 'nearby' && <Icon name="pin" size={12} />}
            {s.id === 'following' && <Icon name="friend" size={12} />}
            {s.id === 'nearby' ? `${s.label} · ${radiusMi < 1 ? '1 km' : radiusMi === 6.21 ? '10 km' : `${radiusMi} mi`}` : s.label}
            {s.id === 'nearby' && <Icon name="chevron" size={10} />}
          </button>
        ))}
        {showRadius && (
          <>
            <div onClick={() => setShowRadius(false)} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} />
            <div style={{ position: 'absolute', top: 44, left: 20, zIndex: 1600, background: 'var(--paper)', borderRadius: 12, boxShadow: 'var(--sh-3)', border: '1px solid var(--reed)', minWidth: 220, overflow: 'hidden' }}>
              {RADIUS_OPTIONS.map(o => (
                <button key={o.mi} onClick={() => { setRadiusMi(o.mi); setScope('nearby'); setShowRadius(false); }}
                  style={{ ...menuItemStyle, justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>{o.label}</span>
                  {radiusMi === o.mi && <Icon name="check" size={14} color="var(--moss)" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Active tag pill */}
      {activeTag && (
        <div style={{ padding: '8px 20px 0' }}>
          <span className="chip amber" style={{ cursor: 'default' }}>
            #{activeTag}
            <button onClick={() => setActiveTag(null)} style={{ marginLeft: 6, background: 'none', border: 0, cursor: 'pointer', display: 'flex' }}>
              <Icon name="close" size={12} />
            </button>
          </span>
        </div>
      )}

      {/* Trending tags */}
      {!activeTag && !feedQuery && trendingTags.length > 0 && (
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 6 }}>Trending tags</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {trendingTags.slice(0, 8).map(t => (
              <button key={t.tag} onClick={() => setActiveTag(t.tag)} className="chip" style={{ border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer' }}>
                #{t.tag} <span style={{ color: 'var(--silt)', fontSize: 11 }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scroll" style={{ marginTop: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : (posts.length === 0 && hazardsNearby.length === 0) ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="image" size={40} color="var(--pebble)" />
            <p style={{ margin: '12px 0 4px', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>
              {scope === 'nearby' ? 'Nothing nearby right now' : scope === 'following' ? 'No posts from boaters you follow' : 'No posts match that search'}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
              {user ? 'Tap the + button to share what\'s happening.' : 'Sign in to post and reply.'}
            </p>
          </div>
        ) : (
          [
            ...hazardsNearby.map(h => ({ kind: 'hazard', sortAt: h.createdAt, data: h })),
            ...posts.map(p => ({ kind: 'post', sortAt: p.createdAt, data: p })),
          ]
            .sort((a, b) => new Date(b.sortAt) - new Date(a.sortAt))
            .map(item => item.kind === 'hazard' ? (
              <HazardCard key={`hz-${item.data._id}`} hazard={item.data} onOpen={() => navigate(`/hazard/${item.data._id}`, { state: { hazard: item.data } })} />
            ) : (
              <PostCard key={item.data._id} post={item.data}
                onTagClick={(t) => { setActiveTag(t); setFeedQuery(''); }}
                onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
                onOpen={() => setOpenPostId(item.data._id)}
                onLike={async () => {
                  if (!requireLogin()) return;
                  setPosts(prev => prev.map(p => p._id === item.data._id
                    ? { ...p, likedByMe: !p.likedByMe, likeCount: (p.likeCount || 0) + (p.likedByMe ? -1 : 1) }
                    : p));
                  try { await api.likePost(item.data._id); } catch {}
                }}
                currentUser={user}
              />
            ))
        )}
      </div>

      {/* Post detail / reply sheet */}
      {openPostId && (
        <PostDetailSheet
          postId={openPostId}
          onClose={() => { setOpenPostId(null); loadFeed(); }}
          requireLogin={requireLogin}
          navigate={navigate}
          currentUser={user}
        />
      )}

      {/* Login gate */}
      {showLoginGate && (
        <div onClick={() => setShowLoginGate(false)} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ width: '100%', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Sign in to join the conversation</h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>You can browse the feed without an account, but posting and replying need a login.</p>
              <div className="stack">
                <button onClick={() => navigate('/auth')} className="btn primary block">Sign in or create account</button>
                <button onClick={() => setShowLoginGate(false)} className="btn ghost block">Keep browsing</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hail Modal */}
      {showHail && (
        <div onClick={() => setShowHail(false)} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ width: '100%', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              {hailNotFound ? (
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600 }}>Boat not found</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)', lineHeight: 1.5 }}>
                    <strong>{hailForm.recipientBoatIndexNumber}</strong> isn't on Waterline yet.
                  </p>
                  <div className="stack">
                    <a href={`sms:?body=Hey, I tried to hail your boat (${hailForm.recipientBoatIndexNumber}) on Waterline.`}
                      className="btn primary block" style={{ textAlign: 'center', textDecoration: 'none' }}>Invite via SMS</a>
                    <button onClick={() => setHailNotFound(false)} className="btn ghost block">Try a different boat</button>
                    <button onClick={() => setShowHail(false)} className="btn text block" style={{ color: 'var(--silt)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Hail a boat</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>Message any boat by their index number.</p>
                  <div className="stack">
                    <div>
                      <label className="label">Boat index number</label>
                      <input className="field mono" value={hailForm.recipientBoatIndexNumber}
                        onChange={e => setHailForm(f => ({ ...f, recipientBoatIndexNumber: e.target.value.toUpperCase() }))}
                        placeholder="E.G. ABC1234" maxLength={7} />
                    </div>
                    <div>
                      <label className="label">Reason</label>
                      <select className="field" value={hailForm.reason}
                        onChange={e => setHailForm(f => ({ ...f, reason: e.target.value }))}
                        style={{ color: hailForm.reason ? 'var(--ink)' : 'var(--pebble)' }}>
                        <option value="">Select a reason...</option>
                        {HAIL_REASONS.map(r => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Message</label>
                      <textarea className="field" rows={3} value={hailForm.body}
                        onChange={e => setHailForm(f => ({ ...f, body: e.target.value }))}
                        placeholder="Ahoy! I'm moored just ahead..." style={{ resize: 'none' }} />
                    </div>
                    {hailError && <div className="error-msg">{hailError}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setShowHail(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                      <button onClick={sendHail} disabled={!hailForm.recipientBoatIndexNumber || !hailForm.body}
                        className="btn primary" style={{ flex: 1 }}>Send hail</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Message modal */}
      {showDM && (
        <div onClick={() => setShowDM(false)} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '12px 20px 0' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Direct message</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--silt)' }}>Search by username, name or boat name.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--linen)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
                <Icon name="search" size={16} color="var(--silt)" />
                <input autoFocus value={dmQuery} onChange={e => setDmQuery(e.target.value)}
                  placeholder="Type to search…"
                  style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 14, fontFamily: 'var(--font-sans)' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 8px' }}>
              {dmResults.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--silt)', fontSize: 13.5 }}>
                  {dmQuery.trim().length < 2 ? 'Type at least 2 characters.' : 'No boaters match that search.'}
                </div>
              ) : (
                dmResults.map(u => (
                  <button key={u._id} onClick={() => { setShowDM(false); navigate(`/inbox/${u._id}`); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 0', background: 'none', border: 0, borderBottom: '1px solid var(--linen)', cursor: 'pointer', textAlign: 'left' }}>
                    <Avatar name={u.displayName || u.username} src={u.profilePhotoUrl} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                        {u.username ? `@${u.username}` : (u.displayName || 'Boater')}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>
                        {u.displayName && u.username ? u.displayName : ''}
                        {u.boatName ? ` · ${u.boatName}` : ''}
                        {u.boatIndexNumber ? ` · ${u.boatIndexNumber}` : ''}
                      </div>
                    </div>
                    <Icon name="chevron" size={16} color="var(--pebble)" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post composer */}
      {showPost && (
        <div onClick={() => setShowPost(false)} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ width: '100%', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Post to the feed</h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>Share with boaters in your area or use #tags so others can find it.</p>
              <div className="stack">
                <div>
                  <label className="label">What's happening?</label>
                  <textarea className="field" rows={4} value={postForm.body}
                    onChange={e => setPostForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="e.g. Beer festival on the towpath at Victoria Park this weekend…"
                    maxLength={2000} style={{ resize: 'none' }} />
                </div>
                <div>
                  <label className="label">Photos ({postPhotos.length}/3, optional)</label>
                  <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoPick} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {postPhotos.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, background: `url(${src}) center/cover`, border: '1px solid var(--reed)' }}
                        onClick={() => setPostPhotos(p => p.filter((_, idx) => idx !== i))}>
                        <div style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, cursor: 'pointer' }}>×</div>
                      </div>
                    ))}
                    {postPhotos.length < 3 && (
                      <button type="button" onClick={() => photoInputRef.current?.click()}
                        style={{ width: 72, height: 72, borderRadius: 8, border: '2px dashed var(--reed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', background: 'transparent', color: 'var(--pebble)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                        <Icon name="camera" size={20} color="var(--pebble)" /> Add
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <label className="label">Tags</label>
                  <input className="field" value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="grand union, victoria park, beer festival" />
                  <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 6 }}>
                    Comma-separated. Type to search existing tags. Up to 8.
                  </div>
                  {tagSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5, background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 10, marginTop: 4, boxShadow: 'var(--sh-2)', overflow: 'hidden' }}>
                      {tagSuggestions.map(s => (
                        <button key={s.tag} type="button" onClick={() => completeTag(s.tag)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink)' }}>
                          <span><span style={{ color: 'var(--moss)', fontWeight: 700 }}>#</span>{s.tag}</span>
                          <span style={{ fontSize: 12, color: 'var(--silt)' }}>{s.count} post{s.count !== 1 ? 's' : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={postForm.includeLocation}
                    onChange={e => setPostForm(f => ({ ...f, includeLocation: e.target.checked }))}
                    style={{ accentColor: 'var(--moss)' }} />
                  Share my approximate location so nearby boaters see this
                </label>
                {postError && <div className="error-msg">{postError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowPost(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitPost} disabled={!postForm.body.trim() || postSubmitting}
                    className="btn primary" style={{ flex: 1 }}>
                    {postSubmitting ? 'Posting…' : 'Post'}
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

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 14px', width: '100%', background: 'none', border: 0,
  cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)',
};

function PostCard({ post, onTagClick, onAuthorClick, onOpen, onLike }) {
  const a = post.authorId || {};
  const handle = a.username ? `@${a.username}` : (a.displayName || 'Boater');
  const plate = a.boatIndexNumber;
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--linen)', cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div onClick={(e) => { e.stopPropagation(); onAuthorClick?.(a._id); }} style={{ cursor: 'pointer', flexShrink: 0 }}>
          <Avatar name={a.displayName || a.username} src={a.profilePhotoUrl} size={42} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span onClick={(e) => { e.stopPropagation(); onAuthorClick?.(a._id); }}
              style={{ fontWeight: 600, fontSize: 14.5, cursor: 'pointer', color: 'var(--moss)' }}>{handle}</span>
            {plate && <Plate>{plate}</Plate>}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)', flexShrink: 0 }}>{timeAgo(post.createdAt)}</span>
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.body}</div>
        </div>
      </div>
      {post.photos?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {post.photos.map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 400, objectFit: 'cover' }} />
          ))}
        </div>
      )}
      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {post.tags.map(t => (
            <button key={t} onClick={(e) => { e.stopPropagation(); onTagClick?.(t); }}
              style={{ background: 'var(--moss-soft)', color: 'var(--moss)', border: 0, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>#{t}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12.5, color: 'var(--silt)' }}>
        <button onClick={(e) => { e.stopPropagation(); onLike?.(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, color: post.likedByMe ? 'var(--moss)' : 'var(--silt)' }}>
          <Icon name="heart" size={13} stroke={post.likedByMe ? 0 : 2} color={post.likedByMe ? 'var(--moss)' : 'var(--silt)'} /> {post.likeCount || 0}
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="inbox" size={13} /> {post.replyCount || 0} repl{(post.replyCount || 0) === 1 ? 'y' : 'ies'}
        </span>
        {post.locationName && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" size={13} /> {post.locationName}
          </span>
        )}
      </div>
    </div>
  );
}

function PostDetailSheet({ postId, onClose, requireLogin, navigate, currentUser }) {
  const [post, setPost] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportingReplyId, setReportingReplyId] = useState(null);

  useEffect(() => {
    api.getPost(postId).then(setPost).catch(() => {});
  }, [postId]);

  const submitReply = async () => {
    if (!reply.trim()) return;
    if (!requireLogin()) return;
    setBusy(true);
    try {
      await api.replyToPost(postId, reply.trim());
      const fresh = await api.getPost(postId);
      setPost(fresh);
      setReply('');
    } catch (e) { alert(e.message); }
    setBusy(false);
  };

  if (!post) return null;
  const a = post.authorId || {};
  const handle = a.username ? `@${a.username}` : (a.displayName || 'Boater');
  const isOwnPost = currentUser && post.authorId?._id === currentUser._id;

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} className="sheet"
        style={{ width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        <div className="sheet-handle" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 0' }}>
          {/* Original post */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div onClick={() => navigate(`/profile/${a._id}`)} style={{ cursor: 'pointer' }}>
              <Avatar name={a.displayName || a.username} src={a.profilePhotoUrl} size={40} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span onClick={() => navigate(`/profile/${a._id}`)} style={{ fontWeight: 600, fontSize: 14.5, cursor: 'pointer', color: 'var(--moss)' }}>{handle}</span>
                {a.boatIndexNumber && <Plate>{a.boatIndexNumber}</Plate>}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)' }}>{timeAgo(post.createdAt)}</span>
              </div>
              <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.45, marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.body}</div>
              {post.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {post.tags.map(t => (
                    <span key={t} style={{ fontSize: 12, color: 'var(--moss)', fontWeight: 600 }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8, borderBottom: '1px solid var(--reed)' }}>
            <button onClick={() => document.getElementById('reply-input')?.focus()} className="btn ghost" style={{ flex: 1, height: 36, fontSize: 13 }}>
              <Icon name="send" size={14} /> Reply
            </button>
            {!isOwnPost && (
              <button onClick={() => { if (requireLogin()) setShowReport(true); }} className="btn ghost" style={{ flex: 1, height: 36, fontSize: 13, color: 'var(--rust)' }}>
                <Icon name="flag" size={14} color="var(--rust)" /> Report
              </button>
            )}
          </div>

          <ReportSheet
            open={showReport}
            onClose={() => setShowReport(false)}
            targetLabel="this post"
            onSubmit={(reason, details) => api.fileReport({ targetType: 'post', targetId: postId, reason, details })}
          />

          {/* Reply report sheet */}
          <ReportSheet
            open={!!reportingReplyId}
            onClose={() => setReportingReplyId(null)}
            targetLabel="this reply"
            onSubmit={async (reason, details) => {
              await api.reportReply(postId, reportingReplyId, reason, details);
              setPost(p => ({ ...p, replies: (p.replies || []).filter(r => r._id !== reportingReplyId) }));
            }}
          />

          {/* Replies */}
          <div style={{ marginTop: 12, paddingBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 8 }}>
              {post.replies?.length || 0} repl{(post.replies?.length || 0) === 1 ? 'y' : 'ies'}
            </div>
            {(post.replies || []).map((r, i) => {
              const ra = r.authorId || {};
              const rhandle = ra.username ? `@${ra.username}` : (ra.displayName || 'Boater');
              const isOwnReply = currentUser && ra._id === currentUser._id;
              return (
                <div key={r._id || i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i === 0 ? 0 : '1px solid var(--linen)' }}>
                  <div onClick={() => ra._id && navigate(`/profile/${ra._id}`)} style={{ cursor: ra._id ? 'pointer' : 'default' }}>
                    <Avatar name={ra.displayName || ra.username} src={ra.profilePhotoUrl} size={32} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span onClick={() => ra._id && navigate(`/profile/${ra._id}`)} style={{ fontWeight: 600, fontSize: 13.5, cursor: ra._id ? 'pointer' : 'default', color: 'var(--moss)' }}>{rhandle}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--silt)' }}>{timeAgo(r.createdAt)}</span>
                      {!isOwnReply && currentUser && r._id && (
                        <button
                          onClick={() => setReportingReplyId(r._id)}
                          title="Report this reply"
                          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--silt)', display: 'flex', alignItems: 'center' }}
                        >
                          <Icon name="flag" size={13} color="var(--silt)" />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 14, marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Composer */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 20px', borderTop: '1px solid var(--reed)' }}>
          <input id="reply-input" className="field" value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitReply(); }}
            placeholder={currentUser ? 'Write a reply…' : 'Sign in to reply'}
            disabled={!currentUser}
            style={{ flex: 1 }} />
          <button onClick={submitReply} disabled={!reply.trim() || busy || !currentUser} className="btn primary" style={{ flexShrink: 0 }}>
            <Icon name="send" size={16} color="var(--paper)" />
          </button>
        </div>
      </div>
    </div>
  );
}

const SEV_COLORS = { high: '#C0392B', medium: '#E68A00', low: '#F5C518' };
function HazardCard({ hazard, onOpen }) {
  const color = SEV_COLORS[hazard.severity] || SEV_COLORS.medium;
  return (
    <div onClick={onOpen} style={{ padding: '14px 20px', borderBottom: '1px solid var(--linen)', cursor: 'pointer', display: 'flex', gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="warning" size={22} color="#fff" stroke={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color, padding: '2px 7px', borderRadius: 4, background: color + '22' }}>Hazard nearby</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)' }}>
            {(() => { const d = Date.now() - new Date(hazard.createdAt).getTime(); const m = Math.floor(d/60000); if (m<60) return m+'m'; const h=Math.floor(m/60); if(h<24) return h+'h'; return Math.floor(h/24)+'d'; })()}
          </span>
        </div>
        <div style={{ fontSize: 14.5, marginTop: 4, lineHeight: 1.4 }}>{hazard.description || 'Hazard reported'}</div>
        <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 4 }}>
          {hazard.reportedBy?.displayName || hazard.reportedBy?.username || 'Boater'} · {hazard.confirmationCount || 0} confirm{(hazard.confirmationCount || 0) === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import LoginWall from '../components/LoginWall';
import Plate from '../components/Plate';
import { getCachedLocation } from '../utils/deviceLocation';

const HAIL_REASONS = [
  'Moored next to you',
  'Lost & found',
  'Spotted a hazard',
  'General hello',
];

const THREAD_FILTERS = ['All', 'Unread', 'Market', 'Hails', 'CRT'];
const FEED_SCOPES = ['Nearby', 'Following', 'All'];

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

function threadKind(msgs) {
  const last = msgs[msgs.length - 1];
  if (last?.kind === 'official' || last?.kind === 'crt') return 'official';
  if (last?.kind === 'hail' || last?.isHail) return 'hail';
  if (last?.productId || last?.product) return 'market';
  return null;
}

function KindBadge({ kind }) {
  if (kind === 'official') return <span className="chip moss" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3 }}><Icon name="shield" size={11} />Official</span>;
  if (kind === 'hail') return <span className="chip amber" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3 }}><Icon name="send" size={11} />Hail</span>;
  return null;
}

export default function InboxScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Top tab — Threads vs Feed
  const [topTab, setTopTab] = useState('Threads');

  // Threads state
  const [messages, setMessages] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadFilter, setThreadFilter] = useState('All');

  // Feed state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [feedScope, setFeedScope] = useState('Nearby');
  const [feedQuery, setFeedQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);

  // + dropdown menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Modals
  const [showHail, setShowHail] = useState(false);
  const [showPost, setShowPost] = useState(false);

  // Hail form
  const [hailForm, setHailForm] = useState({ recipientBoatIndexNumber: '', body: '', reason: '' });
  const [hailError, setHailError] = useState('');
  const [hailNotFound, setHailNotFound] = useState(false);

  // Post form
  const [postForm, setPostForm] = useState({ body: '', tags: '', includeLocation: true });
  const [postError, setPostError] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  const searchTimeout = useRef(null);

  /* ---- load threads ---- */
  useEffect(() => {
    if (!user) return;
    api.inbox().then(setMessages).catch(() => {}).finally(() => setThreadsLoading(false));
  }, [user]);

  /* ---- load feed ---- */
  const loadFeed = () => {
    if (!user) return;
    setPostsLoading(true);
    const params = {};
    if (feedScope === 'Nearby') {
      const cached = getCachedLocation();
      if (cached) {
        params.lat = cached.lat;
        params.lng = cached.lng;
        params.radius = 5;
      }
    } else if (feedScope === 'Following') {
      params.followingOnly = 'true';
    }
    if (activeTag) params.tag = activeTag;
    if (feedQuery.trim()) params.q = feedQuery.trim();
    api.listPosts(params).then(setPosts).catch(() => setPosts([])).finally(() => setPostsLoading(false));
  };

  useEffect(() => {
    if (topTab !== 'Feed' || !user) return;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(loadFeed, feedQuery ? 300 : 0);
    return () => clearTimeout(searchTimeout.current);
  }, [topTab, feedScope, activeTag, feedQuery, user]);

  useEffect(() => {
    if (topTab !== 'Feed') return;
    api.trendingTags().then(setTrendingTags).catch(() => {});
  }, [topTab]);

  if (!user) return <LoginWall tab="inbox" />;

  /* ---- threads grouping ---- */
  const threads = useMemo(() => {
    const grouped = messages.reduce((acc, m) => {
      const otherId = (m.senderId?._id || m.senderId) === user._id
        ? (m.recipientId?._id || m.recipientId)
        : (m.senderId?._id || m.senderId);
      const key = otherId || 'unknown';
      if (!acc[key]) {
        const otherUser = (m.senderId?._id || m.senderId) === user._id ? m.recipientId : m.senderId;
        acc[key] = { id: key, other: otherUser, messages: [], unread: 0 };
      }
      acc[key].messages.push(m);
      if (!m.isRead && (m.senderId?._id || m.senderId) !== user._id) acc[key].unread++;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => {
      const aT = new Date(a.messages[a.messages.length - 1].createdAt).getTime();
      const bT = new Date(b.messages[b.messages.length - 1].createdAt).getTime();
      return bT - aT;
    });
  }, [messages, user._id]);

  const filteredThreads = useMemo(() => {
    if (threadFilter === 'All') return threads;
    if (threadFilter === 'Unread') return threads.filter(t => t.unread > 0);
    if (threadFilter === 'Market') return threads.filter(t => threadKind(t.messages) === 'market');
    if (threadFilter === 'Hails') return threads.filter(t => threadKind(t.messages) === 'hail');
    if (threadFilter === 'CRT') return threads.filter(t => threadKind(t.messages) === 'official');
    return threads;
  }, [threads, threadFilter]);

  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  /* ---- hail ---- */
  const openHail = () => {
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
      const fresh = await api.inbox();
      setMessages(fresh);
    } catch (e) {
      if (e.message === 'boat_not_found' || e.message?.includes('not on Waterline')) setHailNotFound(true);
      else setHailError(e.message);
    }
  };

  /* ---- post to feed ---- */
  const openPostComposer = () => {
    setPostForm({ body: '', tags: '', includeLocation: true });
    setPostError(''); setShowPost(true);
  };

  const submitPost = async () => {
    if (!postForm.body.trim()) return;
    setPostSubmitting(true);
    setPostError('');
    try {
      const body = { body: postForm.body.trim(), tags: postForm.tags };
      if (postForm.includeLocation) {
        const cached = getCachedLocation();
        if (cached) { body.lat = cached.lat; body.lng = cached.lng; }
      }
      await api.createPost(body);
      setShowPost(false);
      setTopTab('Feed');
      loadFeed();
    } catch (e) { setPostError(e.message); }
    setPostSubmitting(false);
  };

  /* ---- + menu actions ---- */
  const onMenuHail = () => { setMenuOpen(false); openHail(); };
  const onMenuPost = () => { setMenuOpen(false); openPostComposer(); };

  return (
    <div className="screen">
      {/* --- Header --- */}
      <div className="appbar" style={{ height: 'auto', padding: '14px 20px 0', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>Chats</h1>
            <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 4 }}>
              {topTab === 'Threads'
                ? `${totalUnread} unread · ${threads.length} conversation${threads.length !== 1 ? 's' : ''}`
                : `${posts.length} post${posts.length !== 1 ? 's' : ''}${feedScope === 'Nearby' ? ' nearby' : ''}`}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="btn primary"
              style={{ width: 40, height: 40, padding: 0, borderRadius: 'var(--r-pill)', flexShrink: 0 }}
              aria-label="New"
            >
              <Icon name="plus" size={20} />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} />
                <div style={{
                  position: 'absolute', top: 46, right: 0, zIndex: 1600,
                  background: 'var(--paper)', borderRadius: 12, boxShadow: 'var(--sh-3)',
                  border: '1px solid var(--reed)', minWidth: 200, overflow: 'hidden',
                }}>
                  <button onClick={onMenuHail} style={menuItemStyle}>
                    <Icon name="send" size={16} color="var(--moss)" />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Hail a boat</div>
                      <div style={{ fontSize: 12, color: 'var(--silt)' }}>Direct message by index</div>
                    </div>
                  </button>
                  <div style={{ height: 1, background: 'var(--reed)' }} />
                  <button onClick={onMenuPost} style={menuItemStyle}>
                    <Icon name="image" size={16} color="var(--moss)" />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Post to feed</div>
                      <div style={{ fontSize: 12, color: 'var(--silt)' }}>Share with nearby boaters</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top tab switcher */}
        <div style={{ display: 'flex', gap: 0, marginTop: 14, borderBottom: '1px solid var(--reed)' }}>
          {['Threads', 'Feed'].map(t => (
            <button key={t} onClick={() => setTopTab(t)} style={{
              flex: 1, padding: '10px 0', background: 'none', border: 0, cursor: 'pointer',
              fontSize: 14, fontWeight: topTab === t ? 700 : 500,
              color: topTab === t ? 'var(--ink)' : 'var(--silt)',
              borderBottom: topTab === t ? '2px solid var(--ink)' : '2px solid transparent',
              fontFamily: 'var(--font-sans)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* === THREADS === */}
      {topTab === 'Threads' && (
        <>
          <div style={{ display: 'flex', gap: 8, padding: '10px 20px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
            {THREAD_FILTERS.map(f => (
              <button key={f} className={`chip${threadFilter === f ? ' active' : ''}`}
                onClick={() => setThreadFilter(f)} style={{ border: 0 }}>{f}</button>
            ))}
          </div>
          <div className="scroll">
            {threadsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading...</div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>
                <Icon name="inbox" size={40} color="var(--pebble)" />
                <p style={{ margin: '12px 0 4px', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>
                  {threadFilter === 'All' ? 'No messages yet' : `No ${threadFilter.toLowerCase()} messages`}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
                  {threadFilter === 'All' ? 'Hail a nearby boat by their index number to start a conversation.' : 'Nothing here right now.'}
                </p>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const last = thread.messages[thread.messages.length - 1];
                const other = thread.other;
                const name = other?.displayName || 'Unknown';
                const plate = other?.boat?.boatIndexNumber || other?.boatIndexNumber;
                const kind = threadKind(thread.messages);
                const hasUnread = thread.unread > 0;
                return (
                  <div key={thread.id} className="row" style={{ cursor: 'pointer', padding: '14px 20px', gap: 12, alignItems: 'flex-start' }}
                    onClick={() => navigate(`/inbox/${thread.id}`)}>
                    <Avatar name={name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 15, flexShrink: 0 }}>{name}</span>
                        {plate && <Plate>{plate}</Plate>}
                        <KindBadge kind={kind} />
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)', flexShrink: 0 }}>{timeAgo(last.createdAt)}</span>
                      </div>
                      {last.subject && (
                        <div className="truncate" style={{ fontSize: 14, fontWeight: hasUnread ? 600 : 400, lineHeight: 1.3 }}>{last.subject}</div>
                      )}
                      <div className="truncate" style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 1, lineHeight: 1.35, fontWeight: hasUnread ? 500 : 400 }}>
                        {last.body || ''}
                      </div>
                    </div>
                    {hasUnread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--moss)', flexShrink: 0, marginTop: 6 }} />}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* === FEED === */}
      {topTab === 'Feed' && (
        <>
          {/* Search bar */}
          <div style={{ padding: '10px 20px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--linen)', borderRadius: 10, padding: '8px 12px',
            }}>
              <Icon name="search" size={16} color="var(--silt)" />
              <input
                value={feedQuery}
                onChange={e => setFeedQuery(e.target.value)}
                placeholder="Search posts, #tags or friends…"
                style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 14, fontFamily: 'var(--font-sans)', minWidth: 0 }}
              />
              {(feedQuery || activeTag) && (
                <button onClick={() => { setFeedQuery(''); setActiveTag(null); }}
                  style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2, color: 'var(--silt)' }}>
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Scope chips */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {FEED_SCOPES.map(s => (
              <button key={s} className={`chip${feedScope === s ? ' active' : ''}`}
                onClick={() => setFeedScope(s)} style={{ border: 0 }}>
                {s === 'Nearby' && <Icon name="pin" size={12} />}
                {s === 'Following' && <Icon name="friend" size={12} />}
                {s}
              </button>
            ))}
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

          {/* Trending tags row */}
          {!activeTag && !feedQuery && trendingTags.length > 0 && (
            <div style={{ padding: '10px 20px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)', marginBottom: 6 }}>
                Trending tags
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {trendingTags.slice(0, 8).map(t => (
                  <button key={t.tag} onClick={() => setActiveTag(t.tag)}
                    className="chip" style={{ border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer' }}>
                    #{t.tag} <span style={{ color: 'var(--silt)', fontSize: 11 }}>{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="scroll" style={{ marginTop: 10 }}>
            {postsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
            ) : posts.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>
                <Icon name="image" size={40} color="var(--pebble)" />
                <p style={{ margin: '12px 0 4px', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>
                  {feedScope === 'Nearby' ? 'No posts in your area yet' : feedScope === 'Following' ? 'No posts from boaters you follow' : 'No posts match that search'}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                  Tap the + button to share what's happening on your stretch of the cut.
                </p>
              </div>
            ) : (
              posts.map(p => (
                <PostCard
                  key={p._id}
                  post={p}
                  onTagClick={(t) => { setActiveTag(t); setFeedQuery(''); }}
                  onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ====== Hail Modal ====== */}
      {showHail && (
        <div onClick={() => setShowHail(false)} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet"
            style={{ width: '100%', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              {hailNotFound ? (
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600 }}>Boat not found</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)', lineHeight: 1.5 }}>
                    <strong>{hailForm.recipientBoatIndexNumber}</strong> isn't on Waterline yet. Invite the owner.
                  </p>
                  <div className="stack">
                    <a href={`sms:?body=Hey, I tried to hail your boat (${hailForm.recipientBoatIndexNumber}) on Waterline. Download the app at waterline.app`}
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

      {/* ====== Post composer ====== */}
      {showPost && (
        <div onClick={() => setShowPost(false)} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet"
            style={{ width: '100%', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Post to the feed</h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>
                Share with boaters in your area or use #tags so others can find it.
              </p>
              <div className="stack">
                <div>
                  <label className="label">What's happening?</label>
                  <textarea className="field" rows={4} value={postForm.body}
                    onChange={e => setPostForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="e.g. Beer festival on the towpath at Victoria Park this weekend…"
                    maxLength={2000} style={{ resize: 'none' }} />
                </div>
                <div>
                  <label className="label">Tags (comma or space separated)</label>
                  <input className="field" value={postForm.tags}
                    onChange={e => setPostForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="grand-union victoria-park beer-festival" />
                  <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 6 }}>Up to 8 tags. Skip the # — added automatically.</div>
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

function PostCard({ post, onTagClick, onAuthorClick }) {
  const a = post.authorId || {};
  const name = a.displayName || a.username || 'Boater';
  const plate = a.boatIndexNumber;
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--linen)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div onClick={() => onAuthorClick?.(a._id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
          <Avatar name={name} src={a.profilePhotoUrl} size={42} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span onClick={() => onAuthorClick?.(a._id)} style={{ fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>{name}</span>
            {plate && <Plate>{plate}</Plate>}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)', flexShrink: 0 }}>{timeAgo(post.createdAt)}</span>
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {post.body}
          </div>
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {post.tags.map(t => (
                <button key={t} onClick={() => onTagClick?.(t)}
                  style={{ background: 'var(--moss-soft)', color: 'var(--moss)', border: 0, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  #{t}
                </button>
              ))}
            </div>
          )}
          {post.locationName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: 'var(--silt)' }}>
              <Icon name="pin" size={12} /> {post.locationName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

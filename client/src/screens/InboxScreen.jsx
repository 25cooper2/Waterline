import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import LoginWall from '../components/LoginWall';
import Plate from '../components/Plate';

const FILTERS = ['All', 'Unread', 'Market', 'Hails', 'CRT'];

const HAIL_REASONS = [
  'Moored next to you',
  'Lost & found',
  'Spotted a hazard',
  'General hello',
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

function threadKind(msgs) {
  const last = msgs[msgs.length - 1];
  if (last?.kind === 'official' || last?.kind === 'crt') return 'official';
  if (last?.kind === 'hail' || last?.isHail) return 'hail';
  if (last?.productId || last?.product) return 'market';
  return null;
}

function KindBadge({ kind }) {
  if (kind === 'official') {
    return <span className="chip moss" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3 }}><Icon name="shield" size={11} />Official</span>;
  }
  if (kind === 'hail') {
    return <span className="chip amber" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3 }}><Icon name="send" size={11} />Hail</span>;
  }
  return null;
}

export default function InboxScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showHail, setShowHail] = useState(false);
  const [hailForm, setHailForm] = useState({ recipientBoatIndexNumber: '', body: '', reason: '' });
  const [hailError, setHailError] = useState('');
  const [hailNotFound, setHailNotFound] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.inbox()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <LoginWall tab="inbox" />;

  /* --- group messages into threads --- */
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
      const aTime = new Date(a.messages[a.messages.length - 1].createdAt).getTime();
      const bTime = new Date(b.messages[b.messages.length - 1].createdAt).getTime();
      return bTime - aTime;
    });
  }, [messages, user._id]);

  /* --- filter logic --- */
  const filtered = useMemo(() => {
    if (filter === 'All') return threads;
    if (filter === 'Unread') return threads.filter(t => t.unread > 0);
    if (filter === 'Market') return threads.filter(t => threadKind(t.messages) === 'market');
    if (filter === 'Hails') return threads.filter(t => threadKind(t.messages) === 'hail');
    if (filter === 'CRT') return threads.filter(t => threadKind(t.messages) === 'official');
    return threads;
  }, [threads, filter]);

  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  /* --- hail actions --- */
  const openHail = () => {
    setHailForm({ recipientBoatIndexNumber: '', body: '', reason: '' });
    setHailError('');
    setHailNotFound(false);
    setShowHail(true);
  };

  const sendHail = async () => {
    setHailError('');
    setHailNotFound(false);
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
      if (e.message === 'boat_not_found' || e.message?.includes('not on Waterline')) {
        setHailNotFound(true);
      } else {
        setHailError(e.message);
      }
    }
  };

  return (
    <div className="screen">
      {/* --- Large appbar with title + subtitle + "+" button --- */}
      <div className="appbar" style={{ height: 'auto', padding: '14px 20px 12px', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>Inbox</h1>
            <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 4 }}>
              {totalUnread} unread &middot; {threads.length} conversation{threads.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={openHail}
            className="btn primary"
            style={{ width: 40, height: 40, padding: 0, borderRadius: 'var(--r-pill)', flexShrink: 0 }}
            aria-label="New hail"
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      </div>

      {/* --- Filter chips row --- */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 20px',
        overflowX: 'auto', flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
            style={{ border: 0 }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* --- Thread list --- */}
      <div className="scroll">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="inbox" size={40} color="var(--pebble)" />
            <p style={{ margin: '12px 0 4px', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>
              {filter === 'All' ? 'No messages yet' : `No ${filter.toLowerCase()} messages`}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
              {filter === 'All'
                ? 'Hail a nearby boat by their CRT index number to start a conversation.'
                : 'Nothing here right now.'}
            </p>
          </div>
        ) : (
          filtered.map((thread) => {
            const last = thread.messages[thread.messages.length - 1];
            const other = thread.other;
            const name = other?.displayName || 'Unknown';
            const plate = other?.boat?.boatIndexNumber || other?.boatIndexNumber;
            const kind = threadKind(thread.messages);
            const hasUnread = thread.unread > 0;
            const subject = last.subject;
            const preview = last.body || '';

            return (
              <div
                key={thread.id}
                className="row"
                style={{ cursor: 'pointer', padding: '14px 20px', gap: 12, alignItems: 'flex-start' }}
                onClick={() => navigate(`/inbox/${thread.id}`)}
              >
                {/* Avatar */}
                <Avatar name={name} size={44} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top row: name, badges, time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 15, flexShrink: 0 }}>{name}</span>
                    {plate && <Plate>{plate}</Plate>}
                    <KindBadge kind={kind} />
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)', flexShrink: 0 }}>
                      {timeAgo(last.createdAt)}
                    </span>
                  </div>

                  {/* Subject line */}
                  {subject && (
                    <div className="truncate" style={{ fontSize: 14, fontWeight: hasUnread ? 600 : 400, lineHeight: 1.3 }}>
                      {subject}
                    </div>
                  )}

                  {/* Preview text */}
                  <div className="truncate" style={{
                    fontSize: 13.5, color: 'var(--silt)', marginTop: 1, lineHeight: 1.35,
                    fontWeight: hasUnread ? 500 : 400,
                  }}>
                    {preview}
                  </div>
                </div>

                {/* Unread dot */}
                {hasUnread && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--moss)', flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ====== Hail Modal (Bottom Sheet) ====== */}
      {showHail && (
        <div
          onClick={() => setShowHail(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 2000,
            background: 'rgba(31,42,38,0.5)',
            display: 'flex', alignItems: 'flex-end',
            animation: 'fade-in 180ms ease-out',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="sheet"
            style={{
              width: '100%',
              paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
              animation: 'slide-up 220ms cubic-bezier(.2,.8,.2,1)',
            }}
          >
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              {hailNotFound ? (
                /* --- Boat not found state --- */
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 600 }}>Boat not found</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)', lineHeight: 1.5 }}>
                    <strong>{hailForm.recipientBoatIndexNumber}</strong> isn't on Waterline yet. You can invite the owner to join.
                  </p>
                  <div className="stack">
                    <a
                      href={`sms:?body=Hey, I tried to hail your boat (${hailForm.recipientBoatIndexNumber}) on Waterline. Download the app at waterline.app`}
                      className="btn primary block"
                      style={{ textAlign: 'center', textDecoration: 'none' }}
                    >
                      Invite via SMS
                    </a>
                    <button onClick={() => setHailNotFound(false)} className="btn ghost block">
                      Try a different boat
                    </button>
                    <button onClick={() => setShowHail(false)} className="btn text block" style={{ color: 'var(--silt)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* --- Normal hail form --- */
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Hail a boat</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>
                    Message any boat by their CRT index number.
                  </p>
                  <div className="stack">
                    <div>
                      <label className="label">Boat index number</label>
                      <input
                        className="field mono"
                        value={hailForm.recipientBoatIndexNumber}
                        onChange={e => setHailForm(f => ({ ...f, recipientBoatIndexNumber: e.target.value.toUpperCase() }))}
                        placeholder="E.G. ABC1234"
                        maxLength={7}
                      />
                    </div>
                    <div>
                      <label className="label">Reason</label>
                      <select
                        className="field"
                        value={hailForm.reason}
                        onChange={e => setHailForm(f => ({ ...f, reason: e.target.value }))}
                        style={{ color: hailForm.reason ? 'var(--ink)' : 'var(--pebble)' }}
                      >
                        <option value="">Select a reason...</option>
                        {HAIL_REASONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Message</label>
                      <textarea
                        className="field"
                        rows={3}
                        value={hailForm.body}
                        onChange={e => setHailForm(f => ({ ...f, body: e.target.value }))}
                        placeholder="Ahoy! I'm moored just ahead..."
                        style={{ resize: 'none' }}
                      />
                    </div>
                    {hailError && <div className="error-msg">{hailError}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setShowHail(false)} className="btn ghost" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button
                        onClick={sendHail}
                        disabled={!hailForm.recipientBoatIndexNumber || !hailForm.body}
                        className="btn primary"
                        style={{ flex: 1 }}
                      >
                        Send hail
                      </button>
                    </div>
                    {/* Privacy note */}
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      padding: '10px 12px', background: 'var(--linen)',
                      borderRadius: 'var(--r-md)', marginTop: 4,
                    }}>
                      <Icon name="eye-off" size={16} color="var(--silt)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12.5, color: 'var(--silt)', lineHeight: 1.45 }}>
                        Your location is never shared. The recipient will only see your boat name and index number.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

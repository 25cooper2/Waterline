import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import LoginWall from '../components/LoginWall';
import Plate from '../components/Plate';

const FILTERS = ['All', 'Unread', 'Market', 'Hails', 'CRT'];

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

function threadKind(thread) {
  if (thread.listing) return 'market';
  const msgs = thread.messages;
  if (msgs.some(m => m.kind === 'official' || m.kind === 'crt')) return 'official';
  if (msgs.some(m => m.kind === 'hail' || m.isHail)) return 'hail';
  return null;
}

function KindBadge({ kind }) {
  if (kind === 'official') return <span className="chip moss" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3 }}><Icon name="shield" size={11} />Official</span>;
  if (kind === 'hail') return <span className="chip amber" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3 }}><Icon name="send" size={11} />Hail</span>;
  if (kind === 'market') return <span className="chip" style={{ height: 20, fontSize: 11, padding: '0 7px', gap: 3, background: 'var(--moss-soft)', color: 'var(--moss-dark)' }}><Icon name="market" size={11} />Market</span>;
  return null;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!user) return;
    api.inbox().then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <LoginWall tab="me" />;

  const threads = useMemo(() => {
    const grouped = messages.reduce((acc, m) => {
      const otherId = (m.senderId?._id || m.senderId) === user._id
        ? (m.recipientId?._id || m.recipientId)
        : (m.senderId?._id || m.senderId);
      const listingId = m.listingId?._id || m.listingId || null;
      // Composite key: pure DMs and listing-tied threads are kept separate,
      // and each listing gets its own thread even between the same two users.
      const key = `${otherId || 'unknown'}::${listingId || 'dm'}`;
      if (!acc[key]) {
        const otherUser = (m.senderId?._id || m.senderId) === user._id ? m.recipientId : m.senderId;
        acc[key] = {
          key,
          otherId,
          listingId,
          listing: (m.listingId && typeof m.listingId === 'object') ? m.listingId : null,
          other: otherUser,
          messages: [],
          unread: 0,
        };
      }
      // Backfill listing if a later message has a populated object
      if (!acc[key].listing && m.listingId && typeof m.listingId === 'object') {
        acc[key].listing = m.listingId;
      }
      acc[key].messages.push(m);
      if (!m.isRead && (m.senderId?._id || m.senderId) !== user._id) acc[key].unread++;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(b.messages[0].createdAt) - new Date(a.messages[0].createdAt));
  }, [messages, user._id]);

  const filtered = useMemo(() => {
    if (filter === 'All') return threads;
    if (filter === 'Unread') return threads.filter(t => t.unread > 0);
    if (filter === 'Market') return threads.filter(t => threadKind(t) === 'market');
    if (filter === 'Hails') return threads.filter(t => threadKind(t) === 'hail');
    if (filter === 'CRT') return threads.filter(t => threadKind(t) === 'official');
    return threads;
  }, [threads, filter]);

  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav('/me')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
          <Icon name="back" />
        </button>
        <h1>Messages</h1>
      </div>

      <div style={{ padding: '4px 20px 4px', fontSize: 13, color: 'var(--silt)' }}>
        {totalUnread} unread · {threads.length} conversation{threads.length !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '10px 20px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)} style={{ border: 0 }}>{f}</button>
        ))}
      </div>

      <div className="scroll" style={{ background: 'var(--paper)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="inbox" size={40} color="var(--pebble)" />
            <p style={{ margin: '12px 0 4px', fontWeight: 500, fontSize: 16, color: 'var(--ink)' }}>
              {filter === 'All' ? 'No messages yet' : `No ${filter.toLowerCase()} messages`}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
              {filter === 'All' ? 'Hail a boat from the feed to start a conversation.' : 'Nothing here right now.'}
            </p>
          </div>
        ) : (
          filtered.map(thread => {
            const last = thread.messages[0];
            const other = thread.other;
            const name = other?.displayName || 'Unknown';
            const plate = other?.boat?.boatIndexNumber || other?.boatIndexNumber;
            const kind = threadKind(thread);
            const hasUnread = thread.unread > 0;
            const route = thread.listingId
              ? `/inbox/listing/${thread.listingId}/${thread.otherId}`
              : `/inbox/${thread.otherId}`;
            return (
              <div key={thread.key} className="row" style={{ cursor: 'pointer', padding: '14px 20px', gap: 12, alignItems: 'flex-start' }}
                onClick={() => nav(route)}>
                <Avatar name={name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 15, flexShrink: 0 }}>{name}</span>
                    {plate && <Plate>{plate}</Plate>}
                    <KindBadge kind={kind} />
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--silt)', flexShrink: 0 }}>{timeAgo(last.createdAt)}</span>
                  </div>
                  {thread.listing && (
                    <div className="truncate" style={{ fontSize: 13, color: 'var(--moss-dark)', fontWeight: 600, marginTop: 1 }}>
                      Re: {thread.listing.title}
                    </div>
                  )}
                  {last.subject && !thread.listing && <div className="truncate" style={{ fontSize: 14, fontWeight: hasUnread ? 600 : 400 }}>{last.subject}</div>}
                  <div className="truncate" style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 1, fontWeight: hasUnread ? 500 : 400 }}>{last.body || ''}</div>
                </div>
                {hasUnread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--moss)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

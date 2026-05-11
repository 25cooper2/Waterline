import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function groupByDate(msgs) {
  const groups = [];
  let currentDate = null;
  msgs.forEach(m => {
    const dateStr = new Date(m.createdAt).toDateString();
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groups.push({ date: m.createdAt, messages: [] });
    }
    groups[groups.length - 1].messages.push(m);
  });
  return groups;
}

export default function MessageThreadScreen() {
  const { threadId, listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch the listing details when this is a listing-tied thread
  useEffect(() => {
    if (!listingId) { setListing(null); return; }
    api.getProduct(listingId).then(p => setListing(p)).catch(() => {});
  }, [listingId]);

  // Load the other person's profile so we always have their name/photo,
  // even if there are no messages yet (fresh conversation from "Message seller")
  useEffect(() => {
    if (!threadId) return;
    api.getPublicProfile(threadId).then(p => {
      if (p) setOtherUser(p);
    }).catch(() => {});
  }, [threadId]);

  useEffect(() => {
    if (!user || !threadId) return;
    setLoading(true);
    api.conversation(threadId, listingId ? { listingId } : {})
      .then(data => {
        const msgs = Array.isArray(data) ? data : data.messages || [];
        setMessages(msgs.map(m => ({
          ...m,
          fromMe: (m.senderId?._id || m.senderId) === user._id,
        })));
        // If messages exist, use the sender info to fill in otherUser details
        if (msgs.length > 0) {
          const firstOther = msgs.find(m => (m.senderId?._id || m.senderId) !== user._id);
          if (firstOther?.senderId && typeof firstOther.senderId === 'object') {
            setOtherUser(prev => prev || firstOther.senderId);
          }
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [threadId, listingId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!user) return;
    messages.forEach(m => {
      if (!m.fromMe && !m.isRead && m._id) {
        api.markRead(m._id).catch(() => {});
      }
    });
  }, [messages, user]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText('');

    const optimistic = {
      _id: `local-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      fromMe: true,
      senderId: user._id,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await api.sendMessage({ recipientId: threadId, body, ...(listingId ? { listingId } : {}) });
      const data = await api.conversation(threadId, listingId ? { listingId } : {});
      const msgs = Array.isArray(data) ? data : data.messages || [];
      if (msgs.length > 0) {
        setMessages(msgs.map(m => ({
          ...m,
          fromMe: (m.senderId?._id || m.senderId) === user._id,
        })));
      }
    } catch {
      // keep optimistic message visible so they know it was typed
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = otherUser?.displayName || 'Boater';
  const plate = otherUser?.boatIndexNumber;
  const dateGroups = groupByDate(messages);
  const listingRemoved = !!listing?.removed;
  const composerDisabled = listingRemoved;

  return (
    <div className="screen" style={{ background: 'var(--linen)' }}>
      {/* App bar */}
      <div className="appbar" style={{ gap: 10, padding: '0 12px 0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}
            aria-label="Back"
          >
            <Icon name="back" />
          </button>
          <Avatar name={displayName} src={otherUser?.profilePhotoUrl} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{displayName}</span>
              {plate && <Plate>{plate}</Plate>}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/profile/${threadId}`)}
          style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}
          aria-label="View profile"
        >
          <Icon name="me" size={20} />
        </button>
      </div>

      {/* Listing context banner — only shown in listing-tied threads */}
      {listing && (
        <div
          onClick={() => { if (!listingRemoved) navigate(`/market/product/${listing._id}`); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: listingRemoved ? 'var(--linen)' : 'var(--paper)',
            borderBottom: '1px solid var(--reed)',
            cursor: listingRemoved ? 'default' : 'pointer',
            flexShrink: 0,
            opacity: listingRemoved ? 0.7 : 1,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-sm)',
            background: listing.images?.[0] ? `url(${listing.images[0]}) center/cover no-repeat` : 'var(--linen)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            filter: listingRemoved ? 'grayscale(1)' : 'none',
          }}>
            {!listing.images?.[0] && <Icon name="market" size={20} color="var(--pebble)" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: listingRemoved ? 'var(--silt)' : 'var(--moss)', marginBottom: 2,
            }}>{listingRemoved ? 'Listing removed' : 'About listing'}</div>
            <div className="truncate" style={{ fontWeight: 600, fontSize: 14, textDecoration: listingRemoved ? 'line-through' : 'none', color: listingRemoved ? 'var(--silt)' : 'var(--ink)' }}>{listing.title}</div>
            <div style={{ fontSize: 13, color: listingRemoved ? 'var(--silt)' : 'var(--moss)', fontWeight: 600 }}>
              {listing.price === 0 ? 'Free' : `£${listing.price?.toLocaleString()}`}
            </div>
          </div>
          {!listingRemoved && <Icon name="chevron" size={18} color="var(--pebble)" />}
        </div>
      )}

      {/* Removed-listing notice */}
      {listingRemoved && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px',
          background: 'var(--amber-soft, #fff4e0)',
          borderBottom: '1px solid var(--reed)',
          color: 'var(--ink)',
          fontSize: 13, lineHeight: 1.4,
          flexShrink: 0,
        }}>
          <Icon name="shield" size={16} color="var(--rust)" />
          <div>
            <strong style={{ fontWeight: 700 }}>This item has been removed from Waterline.</strong>
            <div style={{ color: 'var(--silt)', marginTop: 2 }}>
              You can still read past messages, but no new messages can be sent in this thread.
            </div>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="scroll"
        style={{ padding: '16px 14px 8px', background: 'var(--linen)' }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--silt)' }}>
            <Avatar name={displayName} src={otherUser?.profilePhotoUrl} size={64} />
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginTop: 14 }}>{displayName}</div>
            {plate && <div style={{ marginTop: 4 }}><Plate>{plate}</Plate></div>}
            <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.5, maxWidth: 260, margin: '12px auto 0' }}>
              No messages yet. Send a message to start the conversation.
            </p>
          </div>
        ) : (
          dateGroups.map((group, gi) => (
            <div key={gi}>
              <div style={{
                textAlign: 'center', margin: '16px 0 12px',
                fontSize: 12, fontWeight: 600, color: 'var(--silt)',
              }}>
                <span style={{
                  background: 'rgba(228,222,207,0.7)',
                  padding: '4px 12px', borderRadius: 'var(--r-pill)',
                }}>
                  {formatDateHeader(group.date)}
                </span>
              </div>

              {group.messages.map((msg, mi) => {
                const isMe = msg.fromMe;
                const nextMsg = group.messages[mi + 1];
                const sameSenderNext = nextMsg && nextMsg.fromMe === isMe;
                const showTime = !sameSenderNext;

                return (
                  <div key={msg._id} style={{ marginBottom: showTime ? 12 : 3 }}>
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '78%',
                        padding: '10px 14px',
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        background: isMe ? 'var(--moss)' : 'var(--paper)',
                        color: isMe ? '#fff' : 'var(--ink)',
                        border: isMe ? 'none' : '1px solid var(--reed)',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: 'var(--sh-1)',
                        wordBreak: 'break-word',
                      }}>
                        {msg.body}
                      </div>
                    </div>
                    {showTime && (
                      <div style={{
                        textAlign: isMe ? 'right' : 'left',
                        fontSize: 11, color: 'var(--pebble)',
                        marginTop: 3,
                        paddingLeft: isMe ? 0 : 4,
                        paddingRight: isMe ? 4 : 0,
                      }}>
                        {formatTime(msg.createdAt)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '10px 12px',
        paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
        background: 'var(--paper)',
        borderTop: '1px solid var(--reed)',
        flexShrink: 0,
        opacity: composerDisabled ? 0.55 : 1,
        pointerEvents: composerDisabled ? 'none' : 'auto',
      }}>
        <textarea
          value={composerDisabled ? '' : text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={composerDisabled ? 'Messaging is closed for this listing' : `Message ${displayName}…`}
          disabled={composerDisabled}
          rows={1}
          style={{
            flex: 1, resize: 'none',
            padding: '10px 16px',
            border: '1px solid var(--reed)',
            borderRadius: 'var(--r-pill)',
            background: 'var(--paper-2)',
            fontFamily: 'var(--font-sans)',
            fontSize: 15, lineHeight: 1.35,
            color: 'var(--ink)',
            outline: 'none',
            maxHeight: 100, minHeight: 40,
            overflow: 'auto',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || composerDisabled}
          className="btn primary"
          style={{
            width: 40, height: 40, padding: 0,
            borderRadius: '50%', flexShrink: 0,
            opacity: text.trim() && !sending && !composerDisabled ? 1 : 0.4,
          }}
          aria-label="Send"
        >
          <Icon name="send" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

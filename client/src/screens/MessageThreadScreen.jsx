import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

/* -- Mock data used as fallback when conversation API returns empty -- */
const MOCK_MESSAGES = [
  { _id: 'mock-1', body: 'Hey, saw you moored up at Braunston. Nice boat!', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), fromMe: false },
  { _id: 'mock-2', body: 'Thanks! We just got through the tunnel this morning. Beautiful stretch.', createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(), fromMe: true },
  { _id: 'mock-3', body: 'Heading that way tomorrow. Any tips on the moorings past the junction?', createdAt: new Date(Date.now() - 3600000).toISOString(), fromMe: false },
  { _id: 'mock-4', body: 'The visitor moorings just past the marina are great. 48hr limit but plenty of space mid-week.', createdAt: new Date(Date.now() - 1800000).toISOString(), fromMe: true },
];

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
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user || !threadId) return;
    setLoading(true);

    api.conversation(threadId)
      .then(data => {
        const msgs = Array.isArray(data) ? data : data.messages || [];
        if (msgs.length > 0) {
          /* Determine which messages are from the current user */
          const normalised = msgs.map(m => ({
            ...m,
            fromMe: (m.senderId?._id || m.senderId) === user._id,
          }));
          setMessages(normalised);

          /* Figure out the other participant */
          const firstOther = msgs.find(m => (m.senderId?._id || m.senderId) !== user._id);
          if (firstOther?.senderId && typeof firstOther.senderId === 'object') {
            setOtherUser(firstOther.senderId);
          } else if (firstOther?.recipientId && typeof firstOther.recipientId === 'object') {
            setOtherUser(firstOther.recipientId);
          }
        } else {
          setMessages(MOCK_MESSAGES);
        }
      })
      .catch(() => {
        setMessages(MOCK_MESSAGES);
      })
      .finally(() => setLoading(false));
  }, [threadId, user]);

  /* Scroll to bottom when messages change */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /* Mark messages as read */
  useEffect(() => {
    if (!user) return;
    messages.forEach(m => {
      if (!m.fromMe && !m.isRead && m._id && !m._id.startsWith('mock')) {
        api.markRead(m._id).catch(() => {});
      }
    });
  }, [messages, user]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText('');

    /* Optimistic local message */
    const optimistic = {
      _id: `local-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      fromMe: true,
      senderId: user._id,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await api.sendMessage({ recipientId: threadId, body });
      /* Refresh full conversation */
      const data = await api.conversation(threadId);
      const msgs = Array.isArray(data) ? data : data.messages || [];
      if (msgs.length > 0) {
        setMessages(msgs.map(m => ({
          ...m,
          fromMe: (m.senderId?._id || m.senderId) === user._id,
        })));
      }
    } catch {
      /* keep optimistic message */
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
  const plate = otherUser?.boat?.boatIndexNumber || otherUser?.boatIndexNumber;
  const product = messages.find(m => m.product || m.productId)?.product;
  const dateGroups = groupByDate(messages);

  return (
    <div className="screen" style={{ background: 'var(--linen)' }}>
      {/* ====== App bar ====== */}
      <div className="appbar" style={{ gap: 10, padding: '0 12px 0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <button
            onClick={() => navigate('/inbox')}
            style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}
            aria-label="Back"
          >
            <Icon name="back" />
          </button>
          <Avatar name={displayName} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{displayName}</span>
              {plate && <Plate>{plate}</Plate>}
            </div>
            {otherUser?.distance && (
              <div style={{ fontSize: 12, color: 'var(--silt)' }}>{otherUser.distance}</div>
            )}
          </div>
        </div>
        <button
          style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}
          aria-label="More"
        >
          <Icon name="more" />
        </button>
      </div>

      {/* ====== Context banner (product card) ====== */}
      {product && (
        <div style={{
          margin: '0 12px', padding: '10px 14px',
          background: 'var(--paper)', borderRadius: 'var(--r-md)',
          border: '1px solid var(--reed)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          {product.image && (
            <img
              src={product.image}
              alt=""
              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ fontWeight: 600, fontSize: 14 }}>{product.title}</div>
            {product.price != null && (
              <div style={{ fontSize: 13, color: 'var(--moss)', fontWeight: 600 }}>
                {typeof product.price === 'number' ? `£${product.price}` : product.price}
              </div>
            )}
          </div>
          <Icon name="chevron" size={18} color="var(--pebble)" />
        </div>
      )}

      {/* ====== Chat area ====== */}
      <div
        ref={scrollRef}
        className="scroll"
        style={{ padding: '16px 14px 8px', background: 'var(--linen)' }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading...</div>
        ) : (
          dateGroups.map((group, gi) => (
            <div key={gi}>
              {/* Date header */}
              <div style={{
                textAlign: 'center', margin: '16px 0 12px',
                fontSize: 12, fontWeight: 600, color: 'var(--silt)',
                letterSpacing: '0.02em',
              }}>
                <span style={{
                  background: 'rgba(228,222,207,0.7)',
                  padding: '4px 12px', borderRadius: 'var(--r-pill)',
                }}>
                  {formatDateHeader(group.date)}
                </span>
              </div>

              {/* Bubbles */}
              {group.messages.map((msg, mi) => {
                const isMe = msg.fromMe;
                const nextMsg = group.messages[mi + 1];
                const sameSenderNext = nextMsg && nextMsg.fromMe === isMe;
                /* Show time after last message in a consecutive run from the same sender */
                const showTime = !sameSenderNext;

                return (
                  <div key={msg._id} style={{ marginBottom: showTime ? 12 : 3 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '78%',
                        padding: '10px 14px',
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        background: isMe ? 'var(--moss)' : 'var(--paper)',
                        color: isMe ? '#fff' : 'var(--ink)',
                        border: isMe ? 'none' : '1px solid var(--reed)',
                        borderRadius: isMe
                          ? '18px 18px 4px 18px'
                          : '18px 18px 18px 4px',
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

      {/* ====== Bottom composer ====== */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '10px 12px',
        paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
        background: 'var(--paper)',
        borderTop: '1px solid var(--reed)',
        flexShrink: 0,
      }}>
        <button
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--linen)', border: '1px solid var(--reed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, color: 'var(--silt)',
          }}
          aria-label="Attach"
        >
          <Icon name="plus" size={20} />
        </button>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
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
          disabled={!text.trim()}
          className="btn primary"
          style={{
            width: 40, height: 40, padding: 0,
            borderRadius: '50%', flexShrink: 0,
            opacity: text.trim() ? 1 : 0.4,
          }}
          aria-label="Send"
        >
          <Icon name="send" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

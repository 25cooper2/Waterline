import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import LoginWall from '../components/LoginWall';

export default function InboxScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHail, setShowHail] = useState(false);
  const [hailForm, setHailForm] = useState({ recipientBoatIndexNumber: '', body: '' });
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

  const openHail = () => {
    setHailForm({ recipientBoatIndexNumber: '', body: '' });
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

  const grouped = messages.reduce((acc, m) => {
    const key = m.senderId?._id || m.senderId;
    if (!acc[key]) acc[key] = { sender: m.senderId, messages: [], unread: 0 };
    acc[key].messages.push(m);
    if (!m.isRead) acc[key].unread++;
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="appbar">
        <h1>Inbox</h1>
        <button onClick={openHail} className="btn ghost" style={{ height: 38, padding: '0 14px', fontSize: 14 }}>
          <Icon name="send" size={15} /> Hail
        </button>
      </div>

      <div className="scroll">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : Object.values(grouped).length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="inbox" size={40} color="var(--pebble)" />
            <p>No messages yet.</p>
            <p style={{ fontSize: 14 }}>Hail a nearby boat by their CRT index number.</p>
          </div>
        ) : (
          Object.values(grouped).map(({ sender, messages: msgs, unread }) => {
            const last = msgs[msgs.length - 1];
            return (
              <div key={sender?._id || sender} className="row" style={{ cursor: 'pointer' }}>
                <Avatar name={sender?.displayName} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: unread ? 700 : 500, fontSize: 15 }}>{sender?.displayName || 'Unknown'}</span>
                    <span style={{ fontSize: 12, color: 'var(--silt)' }}>{new Date(last.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="truncate" style={{ fontSize: 14, color: 'var(--silt)', marginTop: 2 }}>{last.body}</div>
                </div>
                {unread > 0 && (
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: 'var(--moss)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {unread}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showHail && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div className="sheet" style={{ width: '100%', padding: '0 0 40px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>

              {hailNotFound ? (
                /* Boat not found state */
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
                    <button
                      onClick={() => setHailNotFound(false)}
                      className="btn ghost block"
                    >
                      Try a different boat
                    </button>
                    <button
                      onClick={() => setShowHail(false)}
                      className="btn text block"
                      style={{ color: 'var(--silt)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal hail form */
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Hail a boat</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>Message any boat by their CRT index number.</p>
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
                      <label className="label">Message</label>
                      <textarea
                        className="field"
                        rows={3}
                        value={hailForm.body}
                        onChange={e => setHailForm(f => ({ ...f, body: e.target.value }))}
                        placeholder="Ahoy! I'm moored just ahead…"
                        style={{ resize: 'none' }}
                      />
                    </div>
                    {hailError && <div className="error-msg">{hailError}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setShowHail(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                      <button
                        onClick={sendHail}
                        disabled={!hailForm.recipientBoatIndexNumber || !hailForm.body}
                        className="btn primary"
                        style={{ flex: 1 }}
                      >
                        Send hail
                      </button>
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

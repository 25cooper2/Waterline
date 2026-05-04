import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';

export default function InboxScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHail, setShowHail] = useState(false);
  const [hailForm, setHailForm] = useState({ recipientBoatIndexNumber: '', body: '' });
  const [hailError, setHailError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.inbox()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="screen">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="inbox" size={34} color="var(--moss)" />
          </div>
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 400, fontStyle: 'italic', margin: '0 0 12px' }}>Inbox is for members.</h2>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 300, margin: 0 }}>
            Hails, marketplace messages and CRT updates are tied to your account.
          </p>
          <button onClick={() => nav('/auth')} className="btn primary" style={{ marginTop: 28, minWidth: 200 }}>Log in or sign up</button>
        </div>
      </div>
    );
  }

  const sendHail = async () => {
    setHailError('');
    try {
      await api.sendMessage({ ...hailForm, isHail: true, senderBoatIndexNumber: '' });
      setShowHail(false);
      setHailForm({ recipientBoatIndexNumber: '', body: '' });
      const fresh = await api.inbox();
      setMessages(fresh);
    } catch (e) {
      setHailError(e.message);
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
        <button onClick={() => setShowHail(true)} className="btn ghost" style={{ height: 38, padding: '0 14px', fontSize: 14 }}>
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
              <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600 }}>Hail a boat</h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--silt)' }}>Message any boat on the waterway by their CRT index number.</p>
              <div className="stack">
                <div>
                  <label className="label">Boat index number</label>
                  <input className="field mono" value={hailForm.recipientBoatIndexNumber}
                    onChange={e => setHailForm(f => ({ ...f, recipientBoatIndexNumber: e.target.value.toUpperCase() }))}
                    placeholder="E.G. ABC1234" maxLength={7} />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="field" rows={3} value={hailForm.body}
                    onChange={e => setHailForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Ahoy! I'm moored just ahead…" style={{ resize: 'none' }} />
                </div>
                {hailError && <div className="error-msg">{hailError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowHail(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={sendHail} disabled={!hailForm.body} className="btn primary" style={{ flex: 1 }}>Send hail</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

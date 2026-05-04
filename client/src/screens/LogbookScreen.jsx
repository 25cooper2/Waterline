import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';

export default function LogbookScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ entryDate: new Date().toISOString().split('T')[0], startLocation: '', endLocation: '', distance: '', weather: '', notes: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) return setLoading(false);
    if (!user.boatId) return setLoading(false);
    api.getLogbook(user.boatId)
      .then(data => setEntries(data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="screen">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="logbook" size={34} color="var(--moss)" />
          </div>
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 400, fontStyle: 'italic', margin: '0 0 12px' }}>Your logbook is private.</h2>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 300, margin: 0 }}>
            Log in to track your stays, miles cruised and locks worked.
          </p>
          <button onClick={() => nav('/auth')} className="btn primary" style={{ marginTop: 28, minWidth: 200 }}>Log in or sign up</button>
        </div>
      </div>
    );
  }

  const submitEntry = async () => {
    setFormError('');
    try {
      const entry = await api.createLogEntry({
        ...form,
        boatId: user.boatId,
        distance: form.distance ? parseFloat(form.distance) : undefined,
      });
      setEntries(prev => [entry, ...prev]);
      setShowNew(false);
      setForm({ entryDate: new Date().toISOString().split('T')[0], startLocation: '', endLocation: '', distance: '', weather: '', notes: '' });
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <div className="screen">
      <div className="appbar">
        <h1>Logbook</h1>
        {user.boatId && (
          <button onClick={() => setShowNew(true)} className="btn primary" style={{ height: 38, padding: '0 14px', fontSize: 14 }}>
            <Icon name="plus" size={16} color="white" /> Entry
          </button>
        )}
      </div>

      <div className="scroll">
        {!user.boatId ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="boat" size={40} color="var(--pebble)" />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No boat registered yet.</p>
            <p style={{ fontSize: 14 }}>Add your boat to start logging journeys.</p>
            <button onClick={() => nav('/me')} className="btn primary" style={{ marginTop: 8 }}>Go to profile</button>
          </div>
        ) : loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="logbook" size={40} color="var(--pebble)" />
            <p>No entries yet. Start logging your journeys!</p>
          </div>
        ) : (
          entries.map(entry => <LogEntry key={entry._id} entry={entry} />)
        )}
      </div>

      {showNew && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div className="sheet" style={{ width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '0 0 40px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>New log entry</h3>
              <div className="stack">
                <div>
                  <label className="label">Date</label>
                  <input className="field" type="date" value={form.entryDate} onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="label">From</label>
                    <input className="field" value={form.startLocation} onChange={e => setForm(f => ({ ...f, startLocation: e.target.value }))} placeholder="e.g. Braunston" />
                  </div>
                  <div>
                    <label className="label">To</label>
                    <input className="field" value={form.endLocation} onChange={e => setForm(f => ({ ...f, endLocation: e.target.value }))} placeholder="e.g. Napton" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="label">Miles</label>
                    <input className="field" type="number" min="0" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Weather</label>
                    <input className="field" value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))} placeholder="e.g. Sunny" />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea className="field" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything worth remembering…" style={{ resize: 'none' }} />
                </div>
                {formError && <div className="error-msg">{formError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowNew(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitEntry} className="btn primary" style={{ flex: 1 }}>Save entry</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogEntry({ entry }) {
  const date = new Date(entry.entryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--reed)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div className="mono muted" style={{ fontSize: 12, letterSpacing: '0.06em' }}>{date}</div>
        {entry.distance && <span className="chip moss" style={{ cursor: 'default', height: 24, fontSize: 12 }}>{entry.distance} mi</span>}
      </div>
      {(entry.startLocation || entry.endLocation) && (
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
          {entry.startLocation && entry.endLocation
            ? `${entry.startLocation} → ${entry.endLocation}`
            : entry.startLocation || entry.endLocation}
        </div>
      )}
      {entry.weather && <div style={{ fontSize: 14, color: 'var(--silt)', marginBottom: 4 }}>{entry.weather}</div>}
      {entry.notes && <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{entry.notes}</div>}
    </div>
  );
}

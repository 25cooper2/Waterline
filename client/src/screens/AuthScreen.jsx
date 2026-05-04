import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthScreen() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const nav = useNavigate();

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
        nav('/map');
      } else {
        await register(email, password, displayName);
        nav('/onboarding/welcome');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="scroll" style={{ padding: '24px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="serif" style={{ fontSize: 38, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.05 }}>
            Welcome aboard.
          </h1>
          <p style={{ color: 'var(--silt)', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            Sign in to your account, or create one in under a minute.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--linen)', borderRadius: 12, marginBottom: 24 }}>
          {[['login', 'Log in'], ['signup', 'Create account']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, height: 40, border: 0, borderRadius: 9, cursor: 'pointer',
              background: tab === t ? 'var(--paper)' : 'transparent',
              color: tab === t ? 'var(--ink)' : 'var(--silt)',
              fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-sans)',
              boxShadow: tab === t ? 'var(--sh-1)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        <div className="stack">
          {tab === 'signup' && (
            <div>
              <label className="label">Display name</label>
              <input className="field" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label className="label" style={{ marginBottom: 0 }}>Password</label>
            </div>
            <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button onClick={submit} disabled={loading || !email || !password} className="btn primary block" style={{ marginTop: 8 }}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>

        <button onClick={() => nav('/map')} className="btn text block" style={{ marginTop: 12, textAlign: 'center' }}>
          Continue as guest
        </button>
      </div>
    </div>
  );
}

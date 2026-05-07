import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthScreen() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        await register(email, password);
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

        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <img src="/logo.png" alt="" style={{ height: 28, width: 'auto' }} />
          <span
            className="serif"
            style={{
              fontSize: 20,
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          >
            Waterline
          </span>
        </div>

        {/* Heading + subtitle */}
        <div style={{ marginBottom: 28 }}>
          <h1
            className="serif"
            style={{
              fontSize: 38,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
              lineHeight: 1.05,
              color: 'var(--ink)',
            }}
          >
            Welcome aboard.
          </h1>
          <p style={{ color: 'var(--silt)', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            Sign in to your account, or create one in under a minute.
          </p>
        </div>

        {/* Tab toggle */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            background: 'var(--linen)',
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          {[['login', 'Log in'], ['signup', 'Create account']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                height: 40,
                border: 0,
                borderRadius: 9,
                cursor: 'pointer',
                background: tab === t ? 'var(--paper)' : 'transparent',
                color: tab === t ? 'var(--ink)' : 'var(--silt)',
                fontWeight: 600,
                fontSize: 14.5,
                fontFamily: 'var(--font-sans)',
                boxShadow: tab === t ? 'var(--sh-1)' : 'none',
                transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="stack">
          <div>
            <label className="label">Email</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 8,
              }}
            >
              <label className="label" style={{ marginBottom: 0 }}>Password</label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => nav('/forgot-password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--moss)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              className="field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="btn primary block"
            style={{ marginTop: 8 }}
          >
            {loading
              ? 'Please wait…'
              : tab === 'login'
                ? 'Log in'
                : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

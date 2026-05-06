import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/Icon';

export default function ForgotPasswordScreen() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const isReset = !!token;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const submitForgot = async () => {
    if (!email.trim()) return setError('Enter your email');
    setLoading(true); setError(''); setMessage(''); setResetUrl('');
    try {
      const r = await api.forgotPassword({ email: email.trim() });
      setMessage(r.message || 'Reset link generated.');
      if (r.resetUrl) setResetUrl(r.resetUrl);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const submitReset = async () => {
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true); setError(''); setMessage('');
    try {
      const r = await api.resetPassword({ token, password });
      setMessage(r.message || 'Password reset!');
      setTimeout(() => nav('/auth'), 1500);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav('/auth')} style={{ background: 'none', border: 0, cursor: 'pointer', display: 'flex', padding: 0 }}>
          <Icon name="back" size={24} />
        </button>
        <h1>{isReset ? 'Reset password' : 'Forgot password'}</h1>
        <div style={{ width: 24 }} />
      </div>
      <div className="scroll" style={{ padding: '24px 24px 60px' }}>
        {!isReset ? (
          <>
            <p style={{ fontSize: 15, color: 'var(--silt)', lineHeight: 1.5, marginBottom: 20 }}>
              Enter the email you signed up with and we'll generate a reset link.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email</label>
              <input className="field" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            {message && (
              <div style={{ background: 'var(--moss-soft)', color: 'var(--moss-dark)', padding: '12px 14px', borderRadius: 'var(--r-md)', marginBottom: 12, fontSize: 14 }}>
                {message}
              </div>
            )}
            {resetUrl && (
              <div style={{ background: 'var(--linen)', padding: 14, borderRadius: 'var(--r-md)', marginBottom: 16, fontSize: 13, lineHeight: 1.5, border: '1px solid var(--reed)' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Email service isn't set up yet — use this link directly:</div>
                <a href={resetUrl} style={{ color: 'var(--moss)', wordBreak: 'break-all' }}>{resetUrl}</a>
              </div>
            )}
            <button onClick={submitForgot} disabled={loading} className="btn primary block">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, color: 'var(--silt)', lineHeight: 1.5, marginBottom: 20 }}>
              Choose a new password (at least 6 characters).
            </p>
            <div style={{ marginBottom: 16 }}>
              <label className="label">New password</label>
              <input className="field" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Confirm password</label>
              <input className="field" type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="••••••" />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            {message && (
              <div style={{ background: 'var(--moss-soft)', color: 'var(--moss-dark)', padding: '12px 14px', borderRadius: 'var(--r-md)', marginBottom: 12, fontSize: 14 }}>
                {message}
              </div>
            )}
            <button onClick={submitReset} disabled={loading} className="btn primary block">
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

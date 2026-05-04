import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const nav = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0f0d',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
    }}>
      {/* Top spacer */}
      <div style={{ flex: 1 }} />

      {/* Logo + wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <img
          src="/logo.png"
          alt="Waterline"
          style={{ width: 110, height: 110, objectFit: 'contain' }}
        />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 42,
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            color: '#f5f2ec',
            margin: 0,
            lineHeight: 1,
          }}>
            Waterline
          </h1>
          <p style={{
            marginTop: 12,
            fontSize: 15,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.01em',
          }}>
            The inland waterways companion
          </p>
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />

      {/* CTAs */}
      <div style={{ width: '100%', paddingBottom: 52, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => nav('/auth')}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: '#1A6B5A',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Get started
        </button>
        <button
          onClick={() => nav('/map')}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Browse as guest
        </button>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const nav = useNavigate();

  return (
    <div className="screen" style={{
      justifyContent: 'space-between',
      background: 'linear-gradient(to bottom, #FCF9F3, #E6EDEA)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100dvh',
    }}>

      {/* Wave locked to the bottom of the screen */}
      <svg
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 220 }}
        viewBox="0 0 360 220"
        preserveAspectRatio="none"
      >
        <path d="M -20 70 Q 90 50 180 70 Q 270 90 380 70 L 380 220 L -20 220 Z" fill="#C9DDE0" opacity="0.6" />
        <path d="M -20 120 Q 90 100 180 120 Q 270 140 380 120 L 380 220 L -20 220 Z" fill="#1A6B5A" opacity="0.2" />
      </svg>

      {/* Centred content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
        position: 'relative',
        zIndex: 1,
      }}>
        <img
          src="/logo.png"
          alt="Waterline"
          style={{ width: 110, height: 'auto', objectFit: 'contain', marginBottom: 22 }}
        />
        <h1 className="serif" style={{
          fontSize: 58,
          fontWeight: 400,
          fontStyle: 'italic',
          letterSpacing: '-0.025em',
          margin: '0 0 12px',
          lineHeight: 1,
          color: 'var(--ink)',
        }}>
          Waterline
        </h1>
        <p style={{
          fontSize: 16,
          color: 'var(--silt)',
          maxWidth: 280,
          margin: 0,
          lineHeight: 1.55,
          textAlign: 'center',
        }}>
          The map, market &amp; messaging app for the UK's inland waterways.
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        padding: '0 24px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        zIndex: 1,
      }}>
        <button onClick={() => nav('/auth')} className="btn primary block">Get started</button>
        <button onClick={() => nav('/map')} className="btn text" style={{ fontSize: 15, color: 'var(--silt)' }}>
          Browse as a guest
        </button>
      </div>

    </div>
  );
}

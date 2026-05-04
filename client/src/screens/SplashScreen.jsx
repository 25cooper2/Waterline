import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const nav = useNavigate();
  return (
    <div className="screen" style={{ justifyContent: 'space-between', background: 'var(--paper)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative' }}>
        <svg viewBox="0 0 360 600" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.45 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="splashbg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FCF9F3" />
              <stop offset="100%" stopColor="#E0EDE8" />
            </linearGradient>
          </defs>
          <rect width="360" height="600" fill="url(#splashbg)" />
          <path d="M -20 410 Q 90 390 180 410 Q 270 430 380 410 L 380 600 L -20 600 Z" fill="#C9DDE0" opacity="0.5" />
          <path d="M -20 470 Q 90 450 180 470 Q 270 490 380 470 L 380 600 L -20 600 Z" fill="#1A6B5A" opacity="0.18" />
        </svg>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h1 className="serif" style={{ fontSize: 64, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1, color: 'var(--ink)' }}>
            Waterline
          </h1>
          <p style={{ fontSize: 17, color: 'var(--silt)', maxWidth: 300, margin: '0 auto', lineHeight: 1.5 }}>
            The map, market &amp; messaging app for the UK's inland waterways.
          </p>
        </div>
      </div>
      <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => nav('/auth')} className="btn primary block">Get started</button>
        <button onClick={() => nav('/map')} className="btn text" style={{ fontSize: 15 }}>Browse as a guest</button>
      </div>
    </div>
  );
}

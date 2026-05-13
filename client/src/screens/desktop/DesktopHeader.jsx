import { Link, useNavigate } from 'react-router-dom';

export default function DesktopHeader({ active }) {
  const nav = useNavigate();
  return (
    <header className="wl-d-header">
      <Link to="/" className="wl-d-brand">
        <img src="/logo.png" alt="" className="wl-d-brand-logo" />
        <span className="wl-d-brand-name">Waterline</span>
      </Link>

      <nav className="wl-d-nav">
        <Link
          to="/"
          className={`wl-d-nav-link ${active === 'market' ? 'on' : ''}`}
        >
          Marketplace
        </Link>
        <Link
          to="/features"
          className={`wl-d-nav-link ${active === 'features' ? 'on' : ''}`}
        >
          All features
        </Link>
      </nav>

      <div className="wl-d-header-cta">
        <button
          type="button"
          className="wl-d-btn ghost"
          onClick={() => nav('/features')}
        >
          Get the app
        </button>
      </div>
    </header>
  );
}

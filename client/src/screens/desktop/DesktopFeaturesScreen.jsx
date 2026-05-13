import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import DesktopHeader from './DesktopHeader';

const FEATURES = [
  {
    img: '/onboarding/card-1-welcome.png',
    title: 'A home for UK boaters',
    body: 'A community hub for people living on or around the cut. Built by boaters, for boaters.',
  },
  {
    img: '/onboarding/card-2-market.png',
    title: 'Marketplace',
    body: 'Buy and sell boats, parts and bits. Find skilled tradespeople for paint, engineering and survey work.',
  },
  {
    img: '/onboarding/card-3-hails.png',
    title: 'Hail any boat',
    body: 'Send a message to any boat by its CRT number — no phone number needed. Follow friends and see where they\'re moored.',
  },
  {
    img: '/onboarding/card-4-hazard.png',
    title: 'Live hazard map',
    body: 'Crowdsourced reports of low bridges, shallow pounds and closures. Always fresh — reports auto-expire after 30 days.',
  },
  {
    img: '/onboarding/card-5-logbook.png',
    title: 'Personal logbook',
    body: 'Log every mooring and every mile. Your private record of life afloat — yours to keep.',
  },
];

export default function DesktopFeaturesScreen() {
  const nav = useNavigate();
  const onboardingUrl = `${window.location.origin}/onboarding/welcome`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(onboardingUrl)}`;

  return (
    <div className="wl-d-page">
      <DesktopHeader active="features" />

      <section className="wl-d-features-hero">
        <div className="wl-d-features-hero-inner">
          <div>
            <div className="wl-d-eyebrow">Get the app</div>
            <h1>Everything a boater needs, in one place.</h1>
            <p>
              Waterline is a free app for life on the UK waterways. Marketplace, messaging,
              hazard map and logbook — it all lives on your phone. Scan the QR code to set
              up in under a minute.
            </p>
            <div className="wl-d-features-cta">
              <button className="wl-d-btn primary" onClick={() => nav('/')}>
                Browse marketplace first
              </button>
              <span className="wl-d-features-cta-note">
                or scan the QR code &rarr;
              </span>
            </div>
          </div>

          <div className="wl-d-features-qr">
            <div className="wl-d-features-qr-card">
              <div className="wl-d-features-qr-title">Scan to open on your phone</div>
              <div className="wl-d-features-qr-frame">
                <img src={qrSrc} alt="QR code" />
              </div>
              <div className="wl-d-features-qr-sub">
                Point your phone's camera at the code. Works in any browser — no app store needed.
              </div>
              <div className="wl-d-features-qr-url">
                {onboardingUrl.replace(/^https?:\/\//, '')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wl-d-features-list">
        {FEATURES.map((f, i) => (
          <div key={f.title} className={`wl-d-feature-row ${i % 2 ? 'rev' : ''}`}>
            <div className="wl-d-feature-img">
              <img src={f.img} alt="" />
            </div>
            <div className="wl-d-feature-body">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="wl-d-features-bottom">
        <h2>Ready to come aboard?</h2>
        <p>Scan the code above with your phone, or visit the link in any phone browser.</p>
        <button className="wl-d-btn ghost" onClick={() => nav('/')}>
          <Icon name="back" size={16} /> Back to marketplace
        </button>
      </section>

      <footer className="wl-d-footer">
        <div className="wl-d-footer-inner">
          <div>
            <div className="wl-d-footer-brand">
              <img src="/logo.png" alt="" />
              <span>Waterline</span>
            </div>
            <p>Built by boaters, for boaters. Free forever.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

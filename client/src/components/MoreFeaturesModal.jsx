import { useEffect } from 'react';
import Icon from './Icon';

const FEATURES = [
  {
    img: '/onboarding/card-2-market.png',
    title: 'Buy, sell & swap',
    body: 'Free classifieds — list anything from spare parts to whole boats. No fees, no middleman.',
  },
  {
    img: '/onboarding/card-3-hails.png',
    title: 'Message any boat',
    body: 'Send a Hail to any boat using their CRT number. Follow friends and keep up with boats you meet.',
  },
  {
    img: '/onboarding/card-4-hazard.png',
    title: 'Live hazard map',
    body: 'See low bridges, shallow pounds and closures reported by other boaters. Auto-refreshes so it stays current.',
  },
  {
    img: '/onboarding/card-5-logbook.png',
    title: 'Your logbook',
    body: 'Record where you moored and how far you travelled — a private record of your waterway life.',
  },
];

export default function MoreFeaturesModal({ onClose }) {
  // QR code points the phone straight at the onboarding flow
  const onboardingUrl = `${window.location.origin}/onboarding/welcome`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(onboardingUrl)}`;

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="wl-modal-root" onClick={onClose}>
      <div className="wl-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="wl-modal-x" onClick={onClose} aria-label="Close">
          <Icon name="close" size={20} color="var(--silt)" />
        </button>

        <div className="wl-modal-grid">
          {/* Left: features */}
          <div className="wl-modal-features">
            <div className="wl-modal-eyebrow">The full Waterline app</div>
            <h2>More than a marketplace</h2>
            <p className="wl-modal-lede">
              The marketplace is just one part of Waterline. The full app lives on your phone —
              here's what else you get.
            </p>

            <div className="wl-modal-feat-list">
              {FEATURES.map((f) => (
                <div key={f.title} className="wl-modal-feat">
                  <div className="wl-modal-feat-img">
                    <img src={f.img} alt="" />
                  </div>
                  <div className="wl-modal-feat-body">
                    <div className="wl-modal-feat-title">{f.title}</div>
                    <div className="wl-modal-feat-text">{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: QR code */}
          <aside className="wl-modal-qr">
            <div className="wl-modal-qr-title">Get it on your phone</div>
            <p className="wl-modal-qr-sub">
              Scan this code with your phone's camera. It'll open Waterline and walk you
              through setup in under a minute.
            </p>
            <div className="wl-modal-qr-frame">
              <img src={qrSrc} alt="QR code to open Waterline on your phone" />
            </div>
            <div className="wl-modal-qr-or">or visit</div>
            <div className="wl-modal-qr-url">{onboardingUrl.replace(/^https?:\/\//, '')}</div>
            <div className="wl-modal-qr-foot">
              Works in any modern phone browser — no app store needed.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

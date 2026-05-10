import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CARDS = [
  {
    img: '/onboarding/card-1-welcome.png',
    title: 'Welcome to Waterline',
    subtitle: 'The app built for life on the cut',
    body: 'The community hub for UK boaters — built by boaters, for boaters. Everything you need, from finding help to reporting hazards, in one place.',
  },
  {
    img: '/onboarding/card-2-market.png',
    title: 'Buy, sell, swap — and find skilled hands',
    subtitle: 'Free classifieds, no middleman',
    body: 'List spare parts, find secondhand gear, or hire a painter. Tradespeople can set up a profile so boaters can find them wherever they\'re moored.',
  },
  {
    img: '/onboarding/card-3-hails.png',
    title: 'Stay connected on the cut',
    subtitle: 'Message any boat, follow any boater',
    body: 'Send a Hail to any boat using their CRT number — no phone needed. Follow friends, see where they\'ve checked in, and keep up with boats you meet along the way.',
  },
  {
    img: '/onboarding/card-4-hazard.png',
    title: 'Know what\'s ahead',
    subtitle: 'Crowdsourced reports, always fresh',
    body: 'Report low bridges, shallow pounds, and closures. Check in at your mooring to share your location with friends. Hazards auto-expire after 30 days so the map stays current.',
  },
  {
    img: '/onboarding/card-5-logbook.png',
    title: 'Log every mile',
    subtitle: 'Your personal record of life afloat',
    body: 'Record where you\'ve moored and how far you\'ve travelled. Your logbook builds into a beautiful record of your waterway life — private by default, yours to keep.',
  },
  // Final CTA card — rendered differently (no img, special layout)
  { cta: true },
];

function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function IOSSteps() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--moss)',
        fontFamily: 'var(--font-sans)', marginBottom: 10,
      }}>
        Add to your home screen
      </div>
      {[
        { icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
        { icon: '➕', text: 'Tap "Add to Home Screen"' },
        { icon: '✓', text: 'Tap "Add" — done!' },
      ].map(({ icon, text }, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginBottom: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--moss-soft)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.5, color: 'var(--silt)',
            fontFamily: 'var(--font-sans)', paddingTop: 4,
          }}>
            {text}
          </div>
        </div>
      ))}
      <div style={{
        fontSize: 12, color: 'var(--pebble)',
        fontFamily: 'var(--font-sans)', marginTop: 4,
      }}>
        Works in Safari only — not Chrome or Firefox on iPhone.
      </div>
    </div>
  );
}

function AndroidSteps({ onInstall }) {
  if (onInstall) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--moss)',
          fontFamily: 'var(--font-sans)', marginBottom: 10,
        }}>
          Add to your home screen
        </div>
        <button
          onClick={onInstall}
          className="btn ghost"
          style={{ width: '100%', height: 48, marginBottom: 6 }}
        >
          Install Waterline
        </button>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--moss)',
        fontFamily: 'var(--font-sans)', marginBottom: 10,
      }}>
        Add to your home screen
      </div>
      {[
        { icon: '⋮', text: 'Tap the menu in the top-right corner of Chrome' },
        { icon: '➕', text: 'Tap "Add to Home Screen"' },
        { icon: '✓', text: 'Tap "Add" — done!' },
      ].map(({ icon, text }, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginBottom: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--moss-soft)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0, fontWeight: 700,
            color: 'var(--moss)',
          }}>
            {icon}
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.5, color: 'var(--silt)',
            fontFamily: 'var(--font-sans)', paddingTop: 4,
          }}>
            {text}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WelcomeCarousel({ onDismiss }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const nav = useNavigate();

  const device = detectDevice();
  const alreadyInstalled = isStandaloneMode();

  useEffect(() => {
    // Capture any install prompt that fired before this component mounted
    if (window.__pwaInstallPrompt) {
      setInstallPrompt(window.__pwaInstallPrompt);
    }
    const handler = (e) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isCta = CARDS[index]?.cta;
  const isLast = index === CARDS.length - 1;

  const goTo = (next, direction = 1) => {
    if (animating || next < 0 || next >= CARDS.length) return;
    setDir(direction);
    setAnimating(true);
    setTimeout(() => {
      setIndex(next);
      setAnimating(false);
    }, 240);
  };

  const next = () => goTo(index + 1, 1);
  const prev = () => goTo(index - 1, -1);

  const dismiss = (toAuth = false) => {
    localStorage.setItem('wl_welcomed', '1');
    setExiting(true);
    setTimeout(() => {
      onDismiss();
      if (toAuth) nav('/auth');
      else nav('/map');
    }, 380);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      window.__pwaInstallPrompt = null;
    }
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    touchStartX.current = null;
    if (Math.abs(dx) < 48 || dy > Math.abs(dx)) return;
    dx > 0 ? next() : prev();
  };

  const card = CARDS[index];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        background: 'var(--paper)',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.38s ease' : 'none',
        maxWidth: 480, margin: '0 auto',
        left: '50%', transform: 'translateX(-50%)',
        width: '100%',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Green bar that fills the iPhone notch / status bar area */}
      <div style={{
        height: 'env(safe-area-inset-top)',
        background: 'var(--moss)',
        flexShrink: 0,
      }} />

      {/* Skip button — top right, below safe area */}
      {!isLast && (
        <button
          onClick={() => dismiss(false)}
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top) + 18px)',
            right: 18, zIndex: 10,
            background: 'rgba(244,239,229,0.92)', border: 'none',
            borderRadius: 20, padding: '6px 16px',
            fontSize: 13, fontWeight: 600, color: 'var(--silt)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            backdropFilter: 'blur(6px)',
            boxShadow: 'var(--sh-1)',
          }}
        >
          Skip
        </button>
      )}

      {/* ── Feature cards (0–4): illustration + text ── */}
      {!isCta && (
        <>
          {/* Illustration — top 52% */}
          <div style={{
            flex: '0 0 52%', overflow: 'hidden', position: 'relative',
            background: 'var(--linen)',
          }}>
            {CARDS.filter(c => !c.cta).map((c, i) => (
              <img
                key={c.img}
                src={c.img}
                alt=""
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  opacity: i === index ? (animating ? 0 : 1) : 0,
                  transition: 'opacity 0.24s ease',
                }}
              />
            ))}
          </div>

          {/* Text area */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            padding: '24px 24px 32px',
            background: 'linear-gradient(to bottom, var(--linen) 0%, var(--paper) 60px)',
          }}>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              opacity: animating ? 0 : 1,
              transform: animating ? `translateX(${dir * -24}px)` : 'translateX(0)',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--moss)',
                fontFamily: 'var(--font-sans)', marginBottom: 8,
              }}>
                {card.subtitle}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                fontSize: 26, fontWeight: 700, lineHeight: 1.2,
                color: 'var(--ink)', margin: '0 0 14px',
              }}>
                {card.title}
              </h2>
              <p style={{
                fontSize: 15, lineHeight: 1.65, color: 'var(--silt)',
                fontFamily: 'var(--font-sans)', margin: 0, flex: 1,
              }}>
                {card.body}
              </p>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '20px 0 18px' }}>
              {CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  style={{
                    width: i === index ? 22 : 8, height: 8,
                    borderRadius: 4, border: 'none', padding: 0,
                    background: i === index ? 'var(--moss)' : 'var(--reed)',
                    cursor: 'pointer',
                    transition: 'width 0.22s ease, background 0.22s ease',
                  }}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>

            <button onClick={next} className="btn primary" style={{ width: '100%', height: 52 }}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ── CTA card (final, index 5) ── */}
      {isCta && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Branded top panel */}
          <div style={{
            flex: '0 0 38%',
            background: 'linear-gradient(160deg, var(--moss) 0%, var(--depth) 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6,
          }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 38, fontWeight: 700, color: 'white',
              letterSpacing: '-0.01em',
            }}>
              Waterline
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-sans)',
            }}>
              The app built for life on the cut
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '24px 24px 32px',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
              {CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  style={{
                    width: i === index ? 22 : 8, height: 8,
                    borderRadius: 4, border: 'none', padding: 0,
                    background: i === index ? 'var(--moss)' : 'var(--reed)',
                    cursor: 'pointer',
                    transition: 'width 0.22s ease, background 0.22s ease',
                  }}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>

            {/* Install section — only if not already installed */}
            {!alreadyInstalled && device === 'ios' && <IOSSteps />}
            {!alreadyInstalled && device === 'android' && (
              <AndroidSteps onInstall={installPrompt ? handleInstall : null} />
            )}

            {/* Divider */}
            <div style={{
              borderTop: '1px solid var(--reed)',
              marginBottom: 20,
            }} />

            {/* Account CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => dismiss(true)} className="btn primary" style={{ width: '100%', height: 52 }}>
                Create an account
              </button>
              <button onClick={() => dismiss(false)} className="btn ghost" style={{ width: '100%', height: 52 }}>
                Log in
              </button>
              <button
                onClick={() => dismiss(false)}
                style={{
                  background: 'none', border: 'none', fontSize: 13,
                  color: 'var(--silt)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', padding: '6px 0',
                }}
              >
                Browse without an account →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

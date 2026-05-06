// Onboarding screens — splash, auth, guest-gate, profile, add boat, verify, done.

const SplashScreen = ({ goto }) => (
  <div className="wl-screen" style={{ background: 'var(--paper)', justifyContent: 'space-between' }}>
    <StatusBar/>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative' }}>
      {/* Soft watercolour wash */}
      <svg viewBox="0 0 360 600" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.45 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="splashbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCF9F3"/>
            <stop offset="100%" stopColor="#E0EDE8"/>
          </linearGradient>
        </defs>
        <rect width="360" height="600" fill="url(#splashbg)"/>
        <path d="M -20 410 Q 90 390 180 410 Q 270 430 380 410 L 380 600 L -20 600 Z" fill="#C9DDE0" opacity="0.5"/>
        <path d="M -20 470 Q 90 450 180 470 Q 270 490 380 470 L 380 600 L -20 600 Z" fill="#1A6B5A" opacity="0.18"/>
      </svg>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <img src="assets/waterline-logo.png" alt="" style={{ width: 200, height: 'auto', display: 'block', margin: '0 auto 8px' }}/>
        <h1 className="wl-serif" style={{ fontSize: 56, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.025em', margin: '12px 0 14px', lineHeight: 1, color: 'var(--ink)' }}>Waterline</h1>
        <p style={{ fontSize: 17, color: 'var(--silt)', maxWidth: 300, margin: '0 auto', lineHeight: 1.5 }}>The map, market &amp; messaging app for the UK&rsquo;s inland waterways.</p>
      </div>
    </div>
    <div style={{ padding: '0 24px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={() => goto('auth')} className="wl-btn is-primary is-block">Get started</button>
      <button onClick={() => goto('marketGuest')} className="wl-btn is-text" style={{ fontSize: 15 }}>Browse as a guest</button>
    </div>
    <GestureBar/>
  </div>
);

const AuthScreen = ({ goto }) => {
  const [tab, setTab] = React.useState('login');
  return (
    <div className="wl-screen">
      <StatusBar/>
      <div className="wl-scroll" style={{ padding: '24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="assets/waterline-logo.png" alt="" style={{ height: 28, width: 'auto' }}/>
          <span className="wl-serif" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.015em' }}>Waterline</span>
        </div>
        <h1 className="wl-serif" style={{ fontSize: 38, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.05 }}>
          Welcome aboard.
        </h1>
        <p style={{ color: 'var(--silt)', fontSize: 15, margin: '0 0 26px', lineHeight: 1.5 }}>Sign in to your account, or create one in under a minute.</p>

        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--linen)', borderRadius: 12, marginBottom: 24 }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, height: 40, border: 0, borderRadius: 9, cursor: 'pointer',
              background: tab === t ? 'var(--paper)' : 'transparent',
              color: tab === t ? 'var(--ink)' : 'var(--silt)',
              fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-sans)',
              boxShadow: tab === t ? 'var(--sh-1)' : 'none',
            }}>{t === 'login' ? 'Log in' : 'Create account'}</button>
          ))}
        </div>

        <div className="wl-stack" style={{ '--gap': '16px' }}>
          <div>
            <label className="wl-label">Email</label>
            <input className="wl-field" defaultValue="hannah@narrowboat.co.uk"/>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label className="wl-label" style={{ marginBottom: 0 }}>Password</label>
              {tab === 'login' && <a style={{ fontSize: 13, color: 'var(--moss)', fontWeight: 600 }}>Forgot?</a>}
            </div>
            <input className="wl-field" type="password" defaultValue="••••••••••••"/>
          </div>
          <button onClick={() => goto('welcome')} className="wl-btn is-primary is-block" style={{ marginTop: 8 }}>
            {tab === 'login' ? 'Log in' : 'Continue'}
          </button>
        </div>
      </div>
      <GestureBar/>
    </div>
  );
};

// Login wall — shown when guests try to access gated tabs
const LoginWall = ({ goto, onTab, tab = 'logbook' }) => {
  const copy = {
    logbook: { title: 'Your logbook is private.', body: 'Log in to track your stays, miles cruised and locks worked. Browse the network, hazards and marketplace as a guest.', icon: 'logbook' },
    inbox: { title: 'Inbox is for members.', body: 'Hails, marketplace messages and CRT updates are tied to your account. Log in to send and receive them.', icon: 'inbox' },
    me: { title: 'You haven\'t made an account yet.', body: 'Profiles, friends and verification are all part of being a member. Set yours up — it takes a minute.', icon: 'me' },
  }[tab] || { title: 'Log in to continue', body: '', icon: 'me' };
  return (
    <div className="wl-screen">
      <StatusBar/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: 18, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name={copy.icon} size={36} color="var(--moss)" stroke={1.6}/>
        </div>
        <h2 className="wl-serif" style={{ fontSize: 28, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.015em', margin: '0 0 12px', lineHeight: 1.15 }}>{copy.title}</h2>
        <p style={{ color: 'var(--silt)', fontSize: 15, lineHeight: 1.55, maxWidth: 320, margin: 0 }}>{copy.body}</p>
        <button onClick={() => goto('auth')} className="wl-btn is-primary" style={{ marginTop: 28, minWidth: 200 }}>Log in or sign up</button>
        <button onClick={() => onTab('map')} className="wl-btn is-text" style={{ marginTop: 4, fontSize: 14 }}>Back to the map</button>
      </div>
      <TabBar active={tab} onChange={onTab}/>
      <GestureBar/>
    </div>
  );
};

// Step header for onboarding flow
const StepHeader = ({ step, total = 4, title, subtitle, onBack }) => (
  <>
    <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      {onBack && <button onClick={onBack} style={{ background: 'none', border: 0, padding: 4, marginLeft: -4, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="back"/></button>}
      <div className="wl-mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>Step {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
    </div>
    <div style={{ display: 'flex', gap: 4, padding: '14px 22px 0' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? 'var(--moss)' : 'var(--reed)' }}/>
      ))}
    </div>
    <div style={{ padding: '26px 22px 8px' }}>
      <h1 className="wl-serif" style={{ fontSize: 34, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.018em', margin: 0, lineHeight: 1.1 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--silt)', fontSize: 15, margin: '12px 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  </>
);

const WelcomeScreen = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <StepHeader step={1} title="What should we call you?" subtitle="Use your real first name — Waterline is a small community where trust matters."/>
    <div className="wl-scroll" style={{ padding: '20px 22px 0' }}>
      <div className="wl-stack" style={{ '--gap': '16px' }}>
        <div>
          <label className="wl-label">First name</label>
          <input className="wl-field" defaultValue="Hannah"/>
        </div>
        <div>
          <label className="wl-label">Last name</label>
          <input className="wl-field" defaultValue="Whitaker"/>
        </div>
      </div>
      <div style={{ marginTop: 24, padding: 16, background: 'var(--moss-soft)', borderRadius: 12, display: 'flex', gap: 12 }}>
        <Icon name="shield" color="var(--moss)" stroke={1.7}/>
        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
          Only your first name and the first initial of your surname are shown to other boaters by default.
        </div>
      </div>
    </div>
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={() => goto('onbProfile')} className="wl-btn is-primary is-block">Continue</button>
    </div>
    <GestureBar/>
  </div>
);

// Username availability check (animated check)
const UsernameField = ({ value, onChange }) => {
  const taken = ['hannah', 'admin', 'mike', 'crt'];
  const v = (value || '').toLowerCase();
  const isTaken = v && taken.includes(v);
  const isAvailable = v && v.length >= 3 && !isTaken;
  return (
    <div>
      <label className="wl-label">Username</label>
      <div style={{ position: 'relative' }}>
        <input className="wl-field" value={value} onChange={e => onChange(e.target.value)} placeholder="hannah_w" style={{ paddingRight: 110 }}/>
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
          {isAvailable && <><Icon name="check" size={14} color="var(--moss)" stroke={2.5}/><span style={{ color: 'var(--moss)' }}>Available</span></>}
          {isTaken && <><Icon name="close" size={14} color="var(--rust)" stroke={2.5}/><span style={{ color: 'var(--rust)' }}>Taken</span></>}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>Letters, numbers and underscores. Visible to anyone you message.</div>
    </div>
  );
};

const OnbProfile = ({ goto }) => {
  const [u, setU] = React.useState('hannah_w');
  const [role, setRole] = React.useState('cc');
  const roles = [
    { id: 'cc', label: 'Continuous cruiser' },
    { id: 'fixed', label: 'Live aboard at a fixed mooring' },
    { id: 'hobby', label: 'Use a boat as a hobby' },
    { id: 'land', label: 'Live near or interested in the waterways' },
  ];
  return (
    <div className="wl-screen">
      <StatusBar/>
      <StepHeader step={2} onBack={() => goto('welcome')} title="A bit about you" subtitle="Help others know who they're chatting to."/>
      <div className="wl-scroll" style={{ padding: '20px 22px 0' }}>
        <div className="wl-stack" style={{ '--gap': '18px' }}>
          <UsernameField value={u} onChange={setU}/>
          <div>
            <label className="wl-label">Profile photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name="Hannah Whitaker" size={60} hue={150}/>
              <button className="wl-btn is-ghost" style={{ height: 44, fontSize: 14.5 }}><Icon name="camera" size={16}/> Add photo</button>
            </div>
          </div>
          <div>
            <label className="wl-label">Where do you live?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roles.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)} style={{
                  textAlign: 'left', padding: '14px 16px', border: '1.5px solid', borderRadius: 12,
                  borderColor: role === r.id ? 'var(--moss)' : 'var(--reed)',
                  background: role === r.id ? 'var(--moss-soft)' : 'var(--paper)',
                  cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
                  fontFamily: 'var(--font-sans)',
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid',
                    borderColor: role === r.id ? 'var(--moss)' : 'var(--reed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {role === r.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--moss)' }}/>}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={() => goto('onbBoat')} className="wl-btn is-primary is-block">Continue</button>
        <button onClick={() => goto('onbBoat')} className="wl-btn is-text" style={{ fontSize: 14.5 }}>Skip for now</button>
      </div>
      <GestureBar/>
    </div>
  );
};

const OnbBoat = ({ goto }) => {
  const [hasBoat, setHasBoat] = React.useState(true);
  return (
    <div className="wl-screen">
      <StatusBar/>
      <StepHeader step={3} onBack={() => goto('onbProfile')} title="Do you have a boat?" subtitle="If you do, you'll unlock messaging, hazards, the logbook and the ability to be hailed by index."/>
      <div className="wl-scroll" style={{ padding: '20px 22px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { id: true, title: 'Yes, I have a boat', sub: 'I own or live aboard a vessel on the UK waterways' },
            { id: false, title: 'Not yet — I\'m towpath-side', sub: 'Browse the map, market and community as a member' },
          ].map(opt => (
            <button key={String(opt.id)} onClick={() => setHasBoat(opt.id)} style={{
              textAlign: 'left', padding: 18, border: '1.5px solid', borderRadius: 12,
              borderColor: hasBoat === opt.id ? 'var(--moss)' : 'var(--reed)',
              background: hasBoat === opt.id ? 'var(--moss-soft)' : 'var(--paper)',
              cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
              fontFamily: 'var(--font-sans)',
            }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid',
                borderColor: hasBoat === opt.id ? 'var(--moss)' : 'var(--reed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                {hasBoat === opt.id && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--moss)' }}/>}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{opt.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 4, lineHeight: 1.4 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {hasBoat && (
          <div className="wl-stack" style={{ '--gap': '16px' }}>
            <div>
              <label className="wl-label">Boat index number</label>
              <input className="wl-field is-mono" placeholder="E.G. ABC123" maxLength={7} defaultValue="LST557"/>
              <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>Found on your CRT or other authority licence plate. 7 characters max.</div>
            </div>
            <div>
              <label className="wl-label">Boat name</label>
              <input className="wl-field" placeholder="e.g. Kingfisher" defaultValue="Tilly Mint"/>
            </div>
            <div>
              <label className="wl-label">Boat type</label>
              <select className="wl-field" defaultValue="narrowboat">
                <option value="narrowboat">Narrowboat</option>
                <option value="widebeam">Widebeam</option>
                <option value="cruiser">Cruiser</option>
                <option value="dutch">Dutch barge</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={() => goto(hasBoat ? 'onbVerify' : 'onbDone')} className="wl-btn is-primary is-block">Continue</button>
        <button onClick={() => goto(hasBoat ? 'onbVerify' : 'onbDone')} className="wl-btn is-text" style={{ fontSize: 14.5 }}>I&rsquo;ll add later</button>
      </div>
      <GestureBar/>
    </div>
  );
};

const OnbVerify = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <StepHeader step={4} onBack={() => goto('onbBoat')} title="Verify your boat" subtitle="Upload your CRT or other authority licence to receive a verified badge — optional but it builds trust on the marketplace."/>
    <div className="wl-scroll" style={{ padding: '20px 22px 0' }}>
      <div style={{
        border: '1.5px dashed var(--reed)', borderRadius: 14,
        padding: '36px 22px', textAlign: 'center', background: 'var(--linen)',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--paper)', border: '1px solid var(--reed)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="image" size={24} color="var(--silt)"/>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 16 }}>Upload your licence</div>
        <div style={{ fontSize: 13.5, color: 'var(--silt)', marginBottom: 16 }}>PDF, JPG or PNG &middot; up to 10 MB</div>
        <button className="wl-btn is-ghost" style={{ height: 42 }}>Choose file</button>
      </div>

      <div className="wl-card" style={{ marginTop: 18, padding: 18 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
            <Icon name="lock" size={18} color="var(--moss)"/>
            <div style={{ width: 1, flex: 1, background: 'var(--reed)' }}/>
            <Icon name="check" size={18} color="var(--moss)"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Encrypted storage</div>
              <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>Your document is stored encrypted and never shared.</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Reviewed in 24 hours</div>
              <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>A real person checks every licence — usually overnight.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <button onClick={() => goto('onbDone')} className="wl-btn is-primary is-block">Submit &amp; finish</button>
      <button onClick={() => goto('onbDone')} className="wl-btn is-text" style={{ fontSize: 14.5 }}>Skip for now</button>
    </div>
    <GestureBar/>
  </div>
);

const OnbDone = ({ goto }) => (
  <div className="wl-screen" style={{ background: 'var(--moss-soft)' }}>
    <StatusBar/>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
      <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
        <Icon name="check" size={38} color="var(--paper)" stroke={2.5}/>
      </div>
      <h1 className="wl-serif" style={{ fontSize: 40, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em', margin: '0 0 14px' }}>You&rsquo;re aboard.</h1>
      <p style={{ color: 'var(--ink)', maxWidth: 320, lineHeight: 1.55, fontSize: 15.5 }}>Your licence is being reviewed. While you wait, the rest of Waterline is open to you.</p>

      <div className="wl-card" style={{ marginTop: 32, width: '100%', textAlign: 'left' }}>
        <div className="wl-row" style={{ borderBottom: 0 }}>
          <Icon name="map" size={22} color="var(--moss)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Find your way to the map</div>
            <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>See hazards, friends and services nearby</div>
          </div>
          <Icon name="chevron" size={16} color="var(--silt)"/>
        </div>
      </div>
    </div>
    <div style={{ padding: 22 }}>
      <button onClick={() => goto('map')} className="wl-btn is-primary is-block">Open the map</button>
    </div>
    <GestureBar/>
  </div>
);

Object.assign(window, { SplashScreen, AuthScreen, LoginWall, WelcomeScreen, OnbProfile, OnbBoat, OnbVerify, OnbDone });

// Shared primitives: icons, nav, status bar, etc.

const Icon = ({ name, size = 22, stroke = 1.6, color = 'currentColor' }) => {
  const s = { width: size, height: size, fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'map':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v16M15 6v16"/></svg>;
    case 'logbook':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6M9 11h4"/></svg>;
    case 'market':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 8h16l-1 4H5L4 8z"/><path d="M4 8l1-3h14l1 3"/><path d="M6 12v8h12v-8"/><path d="M10 16h4"/></svg>;
    case 'inbox':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H9l-4 3v-3a2 2 0 0 1-1-2V6z"/></svg>;
    case 'me':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="9" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>;
    case 'back':
      return <svg viewBox="0 0 24 24" {...s}><path d="M14 6l-6 6 6 6"/></svg>;
    case 'close':
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 6l12 12M18 6l-12 12"/></svg>;
    case 'plus':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>;
    case 'filter':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
    case 'pin':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'check':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 12l5 5L20 7"/></svg>;
    case 'chevron':
      return <svg viewBox="0 0 24 24" {...s}><path d="M9 6l6 6-6 6"/></svg>;
    case 'camera':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/><circle cx="12" cy="13" r="4"/></svg>;
    case 'image':
      return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 18l5-5 5 5 3-3 5 5"/></svg>;
    case 'send':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 12l16-8-6 18-3-7-7-3z"/></svg>;
    case 'warning':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 4l10 17H2L12 4z"/><path d="M12 11v4M12 18v.5"/></svg>;
    case 'shield':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></svg>;
    case 'compass':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 0 2-6 4 0z"/></svg>;
    case 'boat':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 17c2 1 3 1 5 0s3-1 5 0 3 1 5 0 3-1 5 0"/><path d="M5 14h14l-2-4H7l-2 4z"/><path d="M12 10V4l5 6"/></svg>;
    case 'fuel':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><path d="M5 20h10"/><path d="M15 9h2a2 2 0 0 1 2 2v6a1 1 0 0 0 2 0V8l-3-3"/></svg>;
    case 'cafe':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 4l-1 2M11 4l-1 2M14 4l-1 2"/></svg>;
    case 'wrench':
      return <svg viewBox="0 0 24 24" {...s}><path d="M14 7a4 4 0 1 1 4 4l-9 9-3-3 9-9a4 4 0 0 1-1-1z"/></svg>;
    case 'friend':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.5"/><path d="M3 19a6 6 0 0 1 12 0M15 16a4 4 0 0 1 6.5 1.5"/></svg>;
    case 'bell':
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'settings':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2l-.4-2.4h-4l-.4 2.4a7 7 0 0 0-2.1 1.2L5.3 6 3.3 9.3l2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .2 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2l.4 2.4h4l.4-2.4a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.2-.8.2-1.2z"/></svg>;
    case 'logout':
      return <svg viewBox="0 0 24 24" {...s}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 8l4 4-4 4M20 12H10"/></svg>;
    case 'lock':
      return <svg viewBox="0 0 24 24" {...s}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'verified':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 3l2 2h3v3l2 2-2 2v3h-3l-2 2-2-2H7v-3l-2-2 2-2V5h3l2-2z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'archive':
      return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 13h4"/></svg>;
    case 'trash':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 7h14M9 7V4h6v3M7 7l1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"/></svg>;
    case 'heart':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 20s-8-5-8-11a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 6-8 11-8 11z"/></svg>;
    case 'water':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M3 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"/></svg>;
    case 'lock-open':
      return <svg viewBox="0 0 24 24" {...s}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7-2.5"/></svg>;
    case 'service':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></svg>;
    case 'more':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>;
    case 'star':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 4l2.5 5 5.5.8-4 4 1 5.5L12 16.8 7 19.3l1-5.5-4-4 5.5-.8L12 4z"/></svg>;
    case 'clock':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'eye':
      return <svg viewBox="0 0 24 24" {...s}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3 3.5"/><path d="M6.6 6.6A17 17 0 0 0 2 12s4 6 10 6a10 10 0 0 0 4.5-1.1"/><path d="M9.5 9.5a3 3 0 0 0 4 4"/></svg>;
    case 'info':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/></svg>;
    case 'flag':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 21V4M5 4l13 1-2 5 2 5-13-1"/></svg>;
    default: return null;
  }
};

// Status bar (Android style, minimal)
const StatusBar = ({ time = '14:08', dark = false }) => (
  <div style={{
    height: 28, background: 'var(--paper)', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', fontSize: 12, fontWeight: 600, color: 'var(--ink)',
    fontFamily: 'var(--font-sans)', flexShrink: 0,
  }}>
    <span style={{ letterSpacing: '-0.01em' }}>{time}</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
      <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 9h2V6H1zM5 9h2V4H5zM9 9h2V2H9z" fill="currentColor"/></svg>
      <svg width="14" height="10" viewBox="0 0 14 10"><path d="M7 1c2 0 4 1 5 2l-1 1c-1-1-2-1.5-4-1.5S4 3 3 4L2 3c1-1 3-2 5-2zm0 3c1 0 2 .3 3 1l-1 1c-.5-.5-1-.7-2-.7s-1.5.3-2 .7L4 5c1-.7 2-1 3-1zm0 3 1.5 2H5.5L7 7z" fill="currentColor"/></svg>
      <svg width="20" height="10" viewBox="0 0 20 10"><rect x="1" y="2" width="16" height="6" rx="1.5" fill="none" stroke="currentColor"/><rect x="2.5" y="3.5" width="12" height="3" rx="0.5" fill="currentColor"/><rect x="17.5" y="4" width="1.5" height="2" fill="currentColor"/></svg>
    </div>
  </div>
);

const GestureBar = () => (
  <div style={{ height: 16, background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <div style={{ width: 108, height: 4, borderRadius: 2, background: 'var(--ink)', opacity: 0.6 }} />
  </div>
);

// Top app bar
const AppBar = ({ title, leading, trailing, onBack, large = false, subtitle }) => (
  <div className="wl-appbar" style={large ? { height: 'auto', padding: '12px 20px 16px', flexDirection: 'column', alignItems: 'flex-start', gap: 4 } : {}}>
    {large ? (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {onBack ? (
            <button onClick={onBack} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer' }}>
              <Icon name="back" />
            </button>
          ) : <div style={{ width: 6 }} />}
          {trailing}
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 4 }}>{subtitle}</div>}
        </div>
      </>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer', display: 'flex' }}>
              <Icon name="back" />
            </button>
          )}
          {leading}
          <h1>{title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>{trailing}</div>
      </>
    )}
  </div>
);

const TabBar = ({ active = 'map', onChange = () => {} }) => {
  const tabs = [
    { id: 'map', label: 'Map' },
    { id: 'logbook', label: 'Logbook' },
    { id: 'market', label: 'Market' },
    { id: 'inbox', label: 'Inbox' },
    { id: 'me', label: 'Me' },
  ];
  return (
    <div className="wl-tabbar">
      {tabs.map(t => (
        <div key={t.id}
          className={'wl-tab' + (active === t.id ? ' is-active' : '')}
          onClick={() => onChange(t.id)}>
          <Icon name={t.id} />
          <span>{t.label}</span>
        </div>
      ))}
    </div>
  );
};

// Avatar with initials
const Avatar = ({ name = '', size = 40, hue = 165, plate, online = false }) => {
  const initials = name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const bg = `oklch(0.92 0.025 ${hue})`;
  const fg = `oklch(0.32 0.07 ${hue})`;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div className="wl-avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}>
        {initials || '·'}
      </div>
      {online && (
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: 'var(--moss)', border: '2px solid var(--paper)' }} />
      )}
    </div>
  );
};

const Plate = ({ children, large = false }) => (
  <span className={'wl-plate' + (large ? ' is-large' : '')}>{children}</span>
);

// Logo mark — uses the actual brand logo asset
const LogoMark = ({ size = 28 }) => (
  <img src="assets/waterline-logo.png" alt="Waterline"
    style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}/>
);

// Wordmark — Fraunces serif italic per brand
const Wordmark = ({ size = 22 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={size * 1.1} />
    <span className="wl-serif" style={{ fontSize: size, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ink)', fontStyle: 'italic' }}>Waterline</span>
  </div>
);

// Chip
const Chip = ({ children, active, tone, outline, onClick, icon }) => {
  const cls = ['wl-chip'];
  if (active) cls.push('is-active');
  if (tone) cls.push('is-' + tone);
  if (outline) cls.push('is-outline');
  return <span className={cls.join(' ')} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    {icon && <Icon name={icon} size={14} stroke={1.8} />}{children}
  </span>;
};

// Severity badge
const SeverityBadge = ({ level }) => {
  const map = { low: { tone: 'moss', label: 'Low' }, med: { tone: 'amber', label: 'Medium' }, high: { tone: 'rust', label: 'High' } };
  const m = map[level] || map.low;
  return <Chip tone={m.tone}><span className={'wl-sev ' + level} />{m.label} severity</Chip>;
};

// Section header inside scroll
const SectionHeader = ({ children, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 8px' }}>
    <div className="wl-sect" style={{ padding: 0 }}>{children}</div>
    {action}
  </div>
);

// Image placeholder — striped, with monospace label
const ImgPH = ({ label, hue = 165, h = 160, ratio }) => {
  const stripe = `oklch(0.92 0.02 ${hue})`;
  const bg = `oklch(0.95 0.012 ${hue})`;
  return (
    <div style={{
      width: '100%',
      aspectRatio: ratio,
      height: ratio ? undefined : h,
      background: `repeating-linear-gradient(135deg, ${bg} 0 12px, ${stripe} 12px 13px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: `oklch(0.45 0.06 ${hue})`,
      flexShrink: 0,
    }}>{label}</div>
  );
};

Object.assign(window, {
  Icon, StatusBar, GestureBar, AppBar, TabBar, Avatar, Plate,
  LogoMark, Wordmark, Chip, SeverityBadge, SectionHeader, ImgPH,
});

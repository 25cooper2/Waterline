import Icon from './Icon';

export default function AppBar({ title, leading, trailing, onBack, large = false, subtitle }) {
  if (large) {
    return (
      <div className="appbar" style={{ height: 'auto', padding: '12px 20px 16px', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {onBack ? (
            <button onClick={onBack} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, color: 'var(--ink)', cursor: 'pointer' }}>
              <Icon name="back" />
            </button>
          ) : <div style={{ width: 6 }} />}
          <div style={{ display: 'flex', gap: 4 }}>{trailing}</div>
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 4 }}>{subtitle}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="appbar">
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
    </div>
  );
}

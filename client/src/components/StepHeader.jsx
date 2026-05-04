import Icon from './Icon';

export default function StepHeader({ step, total = 4, title, subtitle, onBack }) {
  return (
    <>
      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 0, padding: 4, marginLeft: -4, cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="back" />
          </button>
        )}
        <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
          Step {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '14px 22px 0' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? 'var(--moss)' : 'var(--reed)' }} />
        ))}
      </div>
      <div style={{ padding: '26px 22px 8px' }}>
        <h1 className="serif" style={{ fontSize: 34, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.018em', margin: 0, lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--silt)', fontSize: 15, margin: '12px 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
    </>
  );
}

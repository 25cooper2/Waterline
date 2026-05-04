function initials(name = '') {
  return name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·';
}

function hueFromName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function Avatar({ name = '', src, size = 40, hue, online = false }) {
  const h = hue ?? hueFromName(name);
  const bg = `oklch(0.92 0.025 ${h})`;
  const fg = `oklch(0.32 0.07 ${h})`;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        className="avatar"
        style={{
          width: size,
          height: size,
          background: src ? 'transparent' : bg,
          color: fg,
          fontSize: size * 0.36,
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials(name)
        )}
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: 'var(--moss)',
          border: '2px solid var(--paper)',
        }} />
      )}
    </div>
  );
}

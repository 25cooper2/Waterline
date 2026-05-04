const COLORS = ['#1A6B5A', '#114A52', '#C28A2C', '#B5462E', '#6B4F8A', '#2D6A8A'];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function Avatar({ name, src, size = 40 }) {
  const hue = name ? COLORS[name.charCodeAt(0) % COLORS.length] : COLORS[0];
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: src ? 'transparent' : hue,
        color: 'white',
        fontSize: size * 0.35,
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials(name)
      )}
    </div>
  );
}

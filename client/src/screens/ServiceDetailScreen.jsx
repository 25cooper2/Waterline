import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

export default function ServiceDetailScreen() {
  const nav = useNavigate();
  const { state } = useLocation();

  // Service data from navigation state or fallback
  const service = state?.service || {
    title: 'Service details',
    category: 'Service',
    price: 'POA',
    provider: { displayName: 'Provider', plate: 'ABC123' },
    description: 'No description available.',
    tags: [],
    reviews: [],
  };

  return (
    <div className="screen">
      {/* App bar */}
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="back" />
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Service</span>
        </div>
        <button style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)' }}>
          <Icon name="heart" size={20} />
        </button>
      </div>

      <div className="scroll">
        {/* Hero image placeholder */}
        <div style={{
          height: 220, background: 'var(--linen)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pebble)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}>
          SERVICE PHOTO
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Category */}
          <div className="mono" style={{
            fontSize: 11.5, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--silt)',
          }}>
            {service.category || 'Service'} {service.mobile && '· Mobile'}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
            margin: '6px 0 10px', lineHeight: 1.15,
          }}>
            {service.title}
          </h1>

          {/* Price + meta */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {service.price || 'POA'}
            </div>
            {service.duration && (
              <span className="chip" style={{ border: '1px solid var(--reed)', background: 'var(--paper)' }}>
                {service.duration}
              </span>
            )}
            {service.distance && (
              <span className="chip" style={{ border: '1px solid var(--reed)', background: 'var(--paper)' }}>
                {service.distance}
              </span>
            )}
          </div>

          {/* Provider card */}
          <div className="card" style={{ padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <Avatar name={service.provider?.displayName || 'P'} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{service.provider?.displayName}</span>
                {service.provider?.plate && <Plate>{service.provider.plate}</Plate>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>
                <Icon name="verified" size={11} color="var(--moss)" stroke={2} /> Verified boat · Trade
              </div>
              {service.rating && (
                <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', fontSize: 12.5 }}>
                  <Icon name="star" size={12} color="var(--amber)" stroke={2} />
                  <span style={{ fontWeight: 600 }}>{service.rating}</span>
                  <span style={{ color: 'var(--silt)' }}>· {service.reviewCount || 0} reviews</span>
                </div>
              )}
            </div>
            <Icon name="chevron" size={16} color="var(--pebble)" />
          </div>

          {/* Description */}
          <div className="label">What's included</div>
          <p style={{ fontSize: 15, lineHeight: 1.6, margin: '4px 0 16px' }}>
            {service.description}
          </p>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <>
              <div className="label">Service tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 16 }}>
                {service.tags.map(t => (
                  <span key={t} className="chip" style={{ border: '1px solid var(--reed)', background: 'var(--paper)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Reviews */}
          {service.reviews && service.reviews.length > 0 && (
            <>
              <div className="label">Recent reviews</div>
              {service.reviews.map((r, i) => (
                <div key={i} style={{
                  padding: '12px 0',
                  borderBottom: i < service.reviews.length - 1 ? '1px solid var(--reed)' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Avatar name={r.name} size={28} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                    {r.plate && <Plate>{r.plate}</Plate>}
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                      {Array.from({ length: r.stars || 5 }).map((_, j) => (
                        <Icon key={j} name="star" size={12} color="var(--amber)" stroke={2} />
                      ))}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{r.text}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: 16, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8 }}>
        <button className="btn ghost" style={{ flex: 0, padding: '0 16px' }}>
          <Icon name="heart" size={18} />
        </button>
        <button
          onClick={() => nav('/inbox')}
          className="btn primary"
          style={{ flex: 1 }}
        >
          Request a quote
        </button>
      </div>
    </div>
  );
}

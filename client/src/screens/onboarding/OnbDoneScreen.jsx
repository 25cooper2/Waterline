import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';

export default function OnbDoneScreen() {
  const nav = useNavigate();

  return (
    <div className="screen" style={{ background: 'var(--moss-soft)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
        <div style={{
          width: 78, height: 78, borderRadius: '50%',
          background: 'var(--moss)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 26
        }}>
          <Icon name="check" size={38} color="var(--paper)" stroke={2.5} />
        </div>
        <h1 className="serif" style={{ fontSize: 40, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em', margin: '0 0 14px' }}>
          You're aboard.
        </h1>
        <p style={{ color: 'var(--ink)', maxWidth: 320, lineHeight: 1.55, fontSize: 15.5 }}>
          Your licence is being reviewed. While you wait, the rest of Waterline is open to you.
        </p>

        <div className="card" style={{ marginTop: 32, width: '100%', textAlign: 'left' }}>
          <div className="row" style={{ borderBottom: 0 }}>
            <Icon name="map" size={22} color="var(--moss)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Find your way to the map</div>
              <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>See hazards, friends and services nearby</div>
            </div>
            <Icon name="chevron" size={16} color="var(--silt)" />
          </div>
        </div>
      </div>
      <div style={{ padding: 22 }}>
        <button onClick={() => nav('/map')} className="btn primary block">Open the map</button>
      </div>
    </div>
  );
}

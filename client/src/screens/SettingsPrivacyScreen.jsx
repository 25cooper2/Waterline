import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`toggle${on ? ' on' : ''}`}
      aria-pressed={on}
    />
  );
}

export default function SettingsPrivacyScreen() {
  const nav = useNavigate();
  const [loc, setLoc] = useState('friends');
  const [hails, setHails] = useState(true);
  const [verified, setVerified] = useState(true);
  const [logbook, setLogbook] = useState(false);
  const [showName, setShowName] = useState(true);
  const [showBoat, setShowBoat] = useState(true);
  const [showNearby, setShowNearby] = useState(true);

  return (
    <div className="screen">
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav('/settings')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="back" />
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Privacy &amp; visibility</span>
        </div>
      </div>

      <div className="scroll">
        {/* Location sharing */}
        <div style={{ padding: '16px 20px 0' }}>
          <div className="label">Location sharing</div>
        </div>
        <div style={{ padding: '4px 20px 16px', fontSize: 13, color: 'var(--silt)', lineHeight: 1.5 }}>
          When can other boaters see where you're moored?
        </div>
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
          {[
            { id: 'public', label: 'Anyone on Waterline', sub: 'Verified members can see your last check-in' },
            { id: 'friends', label: 'Only friends', sub: 'People you follow back can see your location' },
            { id: 'private', label: 'Off — never share', sub: 'Your location stays private to you' },
          ].map(o => (
            <div
              key={o.id}
              onClick={() => setLoc(o.id)}
              className="row"
              style={{ cursor: 'pointer', alignItems: 'flex-start' }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: '2px solid',
                borderColor: loc === o.id ? 'var(--moss)' : 'var(--reed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>
                {loc === o.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--moss)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{o.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>{o.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label">Who can contact you</div>
        </div>
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
          {[
            { label: 'Allow hails by boat index', sub: 'Strangers can message you using your plate', val: hails, set: setHails },
            { label: 'Verified boats only', sub: 'Hide hails from unverified accounts', val: verified, set: setVerified },
            { label: 'Show logbook to friends', sub: 'Friends can see where you\'ve been', val: logbook, set: setLogbook },
          ].map(t => (
            <div key={t.label} className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>{t.sub}</div>
              </div>
              <Toggle on={t.val} onClick={() => t.set(!t.val)} />
            </div>
          ))}
        </div>

        {/* Profile visibility */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label">Profile visibility</div>
        </div>
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
          <div className="row">
            <div style={{ flex: 1, fontSize: 14.5 }}>Show real name (full) on profile</div>
            <Toggle on={showName} onClick={() => setShowName(!showName)} />
          </div>
          <div className="row">
            <div style={{ flex: 1, fontSize: 14.5 }}>Show boat make &amp; length</div>
            <Toggle on={showBoat} onClick={() => setShowBoat(!showBoat)} />
          </div>
          <div className="row">
            <div style={{ flex: 1, fontSize: 14.5 }}>Allow appearing in nearby search</div>
            <Toggle on={showNearby} onClick={() => setShowNearby(!showNearby)} />
          </div>
        </div>

        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}

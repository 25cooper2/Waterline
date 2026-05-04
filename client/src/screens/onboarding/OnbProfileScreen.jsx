import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepHeader from '../../components/StepHeader';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';

const TAKEN = ['hannah', 'admin', 'mike', 'crt'];

const ROLES = [
  { id: 'cc', label: 'Continuous cruiser' },
  { id: 'fixed', label: 'Live aboard at a fixed mooring' },
  { id: 'hobby', label: 'Use a boat as a hobby' },
  { id: 'land', label: 'Live near or interested in the waterways' },
];

function UsernameField({ value, onChange }) {
  const v = (value || '').toLowerCase();
  const isTaken = v && TAKEN.includes(v);
  const isAvailable = v && v.length >= 3 && !isTaken;
  return (
    <div>
      <label className="label">Username</label>
      <div style={{ position: 'relative' }}>
        <input
          className="field"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^a-z0-9_]/gi, ''))}
          placeholder="hannah_w"
          style={{ paddingRight: 110 }}
        />
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
          {isAvailable && (
            <>
              <Icon name="check" size={14} color="var(--moss)" stroke={2.5} />
              <span style={{ color: 'var(--moss)' }}>Available</span>
            </>
          )}
          {isTaken && (
            <>
              <Icon name="close" size={14} color="var(--rust)" stroke={2.5} />
              <span style={{ color: 'var(--rust)' }}>Taken</span>
            </>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>
        Letters, numbers and underscores. Visible to anyone you message.
      </div>
    </div>
  );
}

export default function OnbProfileScreen() {
  const nav = useNavigate();
  const firstName = sessionStorage.getItem('onb_firstName') || '';
  const lastName = sessionStorage.getItem('onb_lastName') || '';
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cc');

  const next = () => {
    sessionStorage.setItem('onb_username', username);
    sessionStorage.setItem('onb_role', role);
    nav('/onboarding/boat');
  };

  return (
    <div className="screen">
      <StepHeader step={2} onBack={() => nav('/onboarding/welcome')} title="A bit about you" subtitle="Help others know who they're chatting to." />
      <div className="scroll" style={{ padding: '20px 22px 0' }}>
        <div className="stack" style={{ gap: 18 }}>
          <UsernameField value={username} onChange={setUsername} />
          <div>
            <label className="label">Profile photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={`${firstName} ${lastName}`.trim() || 'A'} size={60} hue={150} />
              <button className="btn ghost" style={{ height: 44, fontSize: 14.5 }}>
                <Icon name="camera" size={16} /> Add photo
              </button>
            </div>
          </div>
          <div>
            <label className="label">Where do you live?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    border: '1.5px solid',
                    borderRadius: 12,
                    borderColor: role === r.id ? 'var(--moss)' : 'var(--reed)',
                    background: role === r.id ? 'var(--moss-soft)' : 'var(--paper)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', border: '2px solid',
                    borderColor: role === r.id ? 'var(--moss)' : 'var(--reed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {role === r.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--moss)' }} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={next} className="btn primary block">Continue</button>
        <button onClick={next} className="btn text" style={{ fontSize: 14.5 }}>Skip for now</button>
      </div>
    </div>
  );
}

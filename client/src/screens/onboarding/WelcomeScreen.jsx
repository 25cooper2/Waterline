import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepHeader from '../../components/StepHeader';
import Icon from '../../components/Icon';

export default function WelcomeScreen() {
  const nav = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const next = () => {
    if (!firstName) return;
    sessionStorage.setItem('onb_firstName', firstName);
    sessionStorage.setItem('onb_lastName', lastName);
    nav('/onboarding/profile');
  };

  return (
    <div className="screen">
      <StepHeader step={1} title="What should we call you?" subtitle="Use your real first name — Waterline is a small community where trust matters." />
      <div className="scroll" style={{ padding: '20px 22px 0' }}>
        <div className="stack">
          <div>
            <label className="label">First name</label>
            <input className="field" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Hannah" autoFocus />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="field" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Whitaker" />
          </div>
        </div>
        <div style={{ marginTop: 24, padding: 16, background: 'var(--moss-soft)', borderRadius: 12, display: 'flex', gap: 12 }}>
          <Icon name="shield" color="var(--moss)" stroke={1.7} />
          <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
            Only your first name and the first initial of your surname are shown to other boaters by default.
          </div>
        </div>
      </div>
      <div style={{ padding: 22 }}>
        <button onClick={next} disabled={!firstName} className="btn primary block">Continue</button>
      </div>
    </div>
  );
}

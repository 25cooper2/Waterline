import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepHeader from '../../components/StepHeader';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';

const OPTIONS = [
  { id: true, title: 'Yes, I have a boat', sub: 'I own or live aboard a vessel on the UK waterways' },
  { id: false, title: "Not yet — I'm towpath-side", sub: 'Browse the map, market and community as a member' },
];

export default function OnbBoatScreen() {
  const nav = useNavigate();
  const { refreshUser } = useAuth();
  const [hasBoat, setHasBoat] = useState(true);
  const [boatIndex, setBoatIndex] = useState('');
  const [boatName, setBoatName] = useState('');
  const [boatType, setBoatType] = useState('narrowboat');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = async () => {
    setError('');
    if (!hasBoat) {
      nav('/onboarding/done');
      return;
    }
    if (!boatIndex || !boatName) {
      nav('/onboarding/done');
      return;
    }
    setLoading(true);
    try {
      await api.createBoat({ boatIndexNumber: boatIndex.toUpperCase(), boatName, boatType });
      await refreshUser();
      nav('/onboarding/verify');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <StepHeader
        step={3}
        onBack={() => nav('/onboarding/profile')}
        title="Do you have a boat?"
        subtitle="If you do, you'll unlock messaging, hazards, the logbook and the ability to be hailed by index."
      />
      <div className="scroll" style={{ padding: '20px 22px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {OPTIONS.map(opt => (
            <button
              key={String(opt.id)}
              onClick={() => setHasBoat(opt.id)}
              style={{
                textAlign: 'left',
                padding: 18,
                border: '1.5px solid',
                borderRadius: 12,
                borderColor: hasBoat === opt.id ? 'var(--moss)' : 'var(--reed)',
                background: hasBoat === opt.id ? 'var(--moss-soft)' : 'var(--paper)',
                cursor: 'pointer',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', border: '2px solid',
                borderColor: hasBoat === opt.id ? 'var(--moss)' : 'var(--reed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2
              }}>
                {hasBoat === opt.id && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--moss)' }} />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{opt.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 4, lineHeight: 1.4 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {hasBoat && (
          <div className="stack">
            <div>
              <label className="label">Boat index number</label>
              <input
                className="field mono"
                value={boatIndex}
                onChange={e => setBoatIndex(e.target.value.toUpperCase())}
                placeholder="E.G. ABC1234"
                maxLength={7}
              />
              <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>
                Found on your CRT or other authority licence plate. 7 characters max.
              </div>
            </div>
            <div>
              <label className="label">Boat name</label>
              <input className="field" value={boatName} onChange={e => setBoatName(e.target.value)} placeholder="e.g. Kingfisher" />
            </div>
            <div>
              <label className="label">Boat type</label>
              <select className="field" value={boatType} onChange={e => setBoatType(e.target.value)}>
                <option value="narrowboat">Narrowboat</option>
                <option value="widebeam">Widebeam</option>
                <option value="cruiser">Cruiser</option>
                <option value="dutch">Dutch barge</option>
                <option value="other">Other</option>
              </select>
            </div>
            {error && <div className="error-msg">{error}</div>}
          </div>
        )}
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={next} disabled={loading} className="btn primary block">
          {loading ? 'Saving…' : 'Continue'}
        </button>
        <button onClick={() => nav('/onboarding/done')} className="btn text" style={{ fontSize: 14.5 }}>I'll add later</button>
      </div>
    </div>
  );
}

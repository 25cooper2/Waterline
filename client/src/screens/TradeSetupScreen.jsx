import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

const ALL_TAGS = [
  'Electrical', 'Engineering', 'Paint & sign', 'Heating',
  'Survey', 'Cleaning', 'Tuition', 'Carpentry', 'Welding',
];

export default function TradeSetupScreen() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState([]);
  const [coverage, setCoverage] = useState('');

  const toggleTag = (t) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  // Step 0: Intro
  if (step === 0) {
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => nav('/me')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
              <Icon name="back" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Set up trade</span>
          </div>
        </div>
        <div className="scroll" style={{ padding: '20px 22px' }}>
          <h1 className="serif" style={{
            fontSize: 32, fontWeight: 500, fontStyle: 'italic',
            letterSpacing: '-0.018em', margin: '0 0 12px', lineHeight: 1.15,
          }}>
            Get hired by boaters.
          </h1>
          <p style={{ color: 'var(--silt)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            Trade profiles appear in the Services tab of the Marketplace, with reviews, contact and direct quotes. We take 5% of completed jobs to keep the lights on.
          </p>

          <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
            {[
              { icon: 'check', t: 'Verified status', s: 'A trade-verified badge after we check your insurance and trading history' },
              { icon: 'star', t: 'Real reviews', s: 'Boaters can only review you after a completed job' },
              { icon: 'send', t: 'Quotes & bookings', s: 'Send formal quotes and accept payment inside the app' },
            ].map(b => (
              <div key={b.t} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: 14, background: 'var(--linen)', borderRadius: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'var(--moss)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={b.icon} size={18} color="var(--paper)" stroke={2} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>{b.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setStep(1)} className="btn primary block">Get started</button>
          <button onClick={() => nav('/me')} className="btn text" style={{ fontSize: 14.5 }}>Maybe later</button>
        </div>
      </div>
    );
  }

  // Step 1: Categories
  if (step === 1) {
    return (
      <div className="screen">
        <div className="appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setStep(0)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
              <Icon name="back" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Trade categories</span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, padding: '0 22px', marginTop: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 0 ? 'var(--moss)' : 'var(--reed)' }} />
          ))}
        </div>
        <div className="scroll" style={{ padding: '20px 22px' }}>
          <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
            Step 01 / 03
          </div>
          <h2 className="serif" style={{
            fontSize: 28, fontWeight: 500, fontStyle: 'italic',
            letterSpacing: '-0.018em', margin: '12px 0 6px',
          }}>
            What do you offer?
          </h2>
          <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
            Pick all that apply. You can write specific service listings next.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_TAGS.map(t => {
              const on = picked.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)} style={{
                  padding: '10px 16px', borderRadius: 100,
                  border: '1.5px solid',
                  borderColor: on ? 'var(--moss)' : 'var(--reed)',
                  background: on ? 'var(--moss-soft)' : 'var(--paper)',
                  color: 'var(--ink)', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {on && <Icon name="check" size={14} color="var(--moss)" stroke={2.5} />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <button onClick={() => setStep(2)} className="btn primary block" disabled={picked.length === 0}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Coverage & insurance
  return (
    <div className="screen">
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="back" />
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Coverage &amp; insurance</span>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 22px', marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--moss)' }} />
        ))}
      </div>
      <div className="scroll" style={{ padding: '20px 22px' }}>
        <div className="mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>
          Step 03 / 03
        </div>
        <h2 className="serif" style={{
          fontSize: 28, fontWeight: 500, fontStyle: 'italic',
          letterSpacing: '-0.018em', margin: '12px 0 6px',
        }}>
          Verify your trade
        </h2>
        <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
          Upload public liability insurance and any relevant trade certificates. Reviewed in 48 hours.
        </p>

        <div className="stack">
          <div>
            <label className="label">Where do you operate?</label>
            <input
              className="field"
              value={coverage}
              onChange={e => setCoverage(e.target.value)}
              placeholder="e.g. Grand Union, Oxford, K&A canals"
            />
          </div>
          <div>
            <label className="label">Public liability insurance</label>
            <div style={{
              border: '1.5px dashed var(--reed)', borderRadius: 12,
              padding: '24px 18px', textAlign: 'center',
              background: 'var(--linen)',
            }}>
              <Icon name="image" size={22} color="var(--silt)" />
              <div style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>Upload certificate</div>
              <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>PDF or image · up to 10 MB</div>
            </div>
          </div>
          <div>
            <label className="label">Trade certificates (optional)</label>
            <button className="btn ghost block">
              <Icon name="plus" size={16} /> Add certificate
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={() => { alert('Trade profile submitted for review!'); nav('/me'); }} className="btn primary block">
          Submit for review
        </button>
        <button onClick={() => nav('/me')} className="btn text" style={{ fontSize: 14.5 }}>
          Skip — set up listings first
        </button>
      </div>
    </div>
  );
}

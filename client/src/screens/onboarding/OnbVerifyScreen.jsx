import { useNavigate } from 'react-router-dom';
import StepHeader from '../../components/StepHeader';
import Icon from '../../components/Icon';

export default function OnbVerifyScreen() {
  const nav = useNavigate();

  return (
    <div className="screen">
      <StepHeader
        step={4}
        onBack={() => nav('/onboarding/boat')}
        title="Verify your boat"
        subtitle="Upload your CRT or other authority licence to receive a verified badge — optional but it builds trust on the marketplace."
      />
      <div className="scroll" style={{ padding: '20px 22px 0' }}>
        <div style={{
          border: '1.5px dashed var(--reed)',
          borderRadius: 14,
          padding: '36px 22px',
          textAlign: 'center',
          background: 'var(--linen)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: 'var(--paper)',
            border: '1px solid var(--reed)', margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="image" size={24} color="var(--silt)" />
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 16 }}>Upload your licence</div>
          <div style={{ fontSize: 13.5, color: 'var(--silt)', marginBottom: 16 }}>PDF, JPG or PNG · up to 10 MB</div>
          <button className="btn ghost" style={{ height: 42 }}>Choose file</button>
        </div>

        <div className="card" style={{ marginTop: 18, padding: 18 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
              <Icon name="lock" size={18} color="var(--moss)" />
              <div style={{ width: 1, flex: 1, background: 'var(--reed)' }} />
              <Icon name="check" size={18} color="var(--moss)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Encrypted storage</div>
                <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>
                  Your document is stored encrypted and never shared.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Reviewed in 24 hours</div>
                <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>
                  A real person checks every licence — usually overnight.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={() => nav('/onboarding/done')} className="btn primary block">Submit & finish</button>
        <button onClick={() => nav('/onboarding/done')} className="btn text" style={{ fontSize: 14.5 }}>Skip for now</button>
      </div>
    </div>
  );
}

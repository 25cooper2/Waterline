import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StepHeader from '../../components/StepHeader';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import { compressImage } from '../../utils/imageCompress';

const ROLES = [
  { id: 'cc', label: 'Continuous cruiser' },
  { id: 'fixed', label: 'Live aboard at a fixed mooring' },
  { id: 'hobby', label: 'Use a boat as a hobby' },
  { id: 'land', label: 'Live near or interested in the waterways' },
];

export default function OnbProfileScreen() {
  const nav = useNavigate();
  const { refreshUser } = useAuth();
  const firstName = sessionStorage.getItem('onb_firstName') || '';
  const lastName = sessionStorage.getItem('onb_lastName') || '';
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cc');
  const [photoUrl, setPhotoUrl] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const checkUsername = useCallback((val) => {
    clearTimeout(debounceRef.current);
    if (!val || val.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await api.checkUsername(val);
        setUsernameAvailable(available);
      } catch { setUsernameAvailable(null); }
      finally { setCheckingUsername(false); }
    }, 400);
  }, []);

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    checkUsername(clean);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, { maxDim: 600, quality: 0.85 });
      setPhotoUrl(dataUrl);
    } catch {
      setError('Could not read that image — try a different one.');
    }
  };

  const next = async () => {
    setSaving(true);
    setError('');
    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;
      await api.updateMe({
        firstName: firstName || null,
        surname: lastName || null,
        displayName,
        ...(username ? { username } : {}),
        ...(photoUrl ? { profilePhotoUrl: photoUrl } : {}),
      });
      await refreshUser();
    } catch (e) {
      // Non-fatal — let user continue even if save fails
      console.warn('Profile save failed:', e.message);
    } finally {
      setSaving(false);
    }
    sessionStorage.setItem('onb_username', username);
    sessionStorage.setItem('onb_role', role);
    nav('/onboarding/boat');
  };

  const skip = () => {
    sessionStorage.setItem('onb_role', role);
    nav('/onboarding/boat');
  };

  const isUsernameTaken = usernameAvailable === false;

  return (
    <div className="screen">
      <StepHeader step={2} onBack={() => nav('/onboarding/welcome')} title="A bit about you" subtitle="Help others know who they're chatting to." />
      <div className="scroll" style={{ padding: '20px 22px 0' }}>
        <div className="stack" style={{ gap: 18 }}>

          {/* Username */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label className="label" style={{ marginBottom: 0 }}>Username</label>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {checkingUsername && <span style={{ color: 'var(--silt)' }}>Checking…</span>}
                {!checkingUsername && usernameAvailable === true && (
                  <span style={{ color: 'var(--moss)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="check" size={13} color="var(--moss)" stroke={2.5} /> Available
                  </span>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <span style={{ color: 'var(--rust)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="close" size={13} color="var(--rust)" stroke={2.5} /> Taken
                  </span>
                )}
              </span>
            </div>
            <input
              className="field"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              placeholder="hannah_w"
            />
            <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>
              Letters, numbers and underscores. Visible to anyone you message.
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="label">Profile photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {photoUrl ? (
                <img src={photoUrl} alt="profile"
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--reed)' }} />
              ) : (
                <Avatar name={`${firstName} ${lastName}`.trim() || 'A'} size={60} hue={150} />
              )}
              <button className="btn ghost" style={{ height: 44, fontSize: 14.5 }}
                onClick={() => fileInputRef.current?.click()}>
                <Icon name="camera" size={16} /> {photoUrl ? 'Change photo' : 'Add photo'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="label">Where do you live?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{
                    textAlign: 'left', padding: '14px 16px', border: '1.5px solid', borderRadius: 12,
                    borderColor: role === r.id ? 'var(--moss)' : 'var(--reed)',
                    background: role === r.id ? 'var(--moss-soft)' : 'var(--paper)',
                    cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
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

          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={next} disabled={saving || isUsernameTaken} className="btn primary block">
          {saving ? 'Saving…' : 'Continue'}
        </button>
        <button onClick={skip} className="btn text" style={{ fontSize: 14.5 }}>Skip for now</button>
      </div>
    </div>
  );
}

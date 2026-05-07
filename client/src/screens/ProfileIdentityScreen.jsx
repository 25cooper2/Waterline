import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { compressImage } from '../utils/imageCompress';

function UsernameStatus({ username, checking, available }) {
  if (!username || username.length < 3) return null;
  if (checking) return <span style={{ color: 'var(--silt)', fontSize: 12.5 }}>Checking…</span>;
  if (available === true) return (
    <span style={{ color: 'var(--moss)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon name="check" size={13} color="var(--moss)" stroke={2.5} /> Available
    </span>
  );
  if (available === false) return (
    <span style={{ color: 'var(--rust)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon name="close" size={13} color="var(--rust)" stroke={2.5} /> Taken
    </span>
  );
  return null;
}

export default function ProfileIdentityScreen() {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    surname: user?.surname || '',
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    profilePhotoUrl: user?.profilePhotoUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const checkUsername = useCallback((val) => {
    clearTimeout(debounceRef.current);
    if (!val || val.length < 3) { setUsernameAvailable(null); return; }
    if (val === user?.username) { setUsernameAvailable(true); return; }
    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await api.checkUsername(val);
        setUsernameAvailable(available);
      } catch { setUsernameAvailable(null); }
      finally { setCheckingUsername(false); }
    }, 400);
  }, [user?.username]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    set('username', clean);
    checkUsername(clean);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await compressImage(file, { maxDim: 600, quality: 0.85 });
      set('profilePhotoUrl', dataUrl);
    } catch {
      setError('Could not read that image — try a different one.');
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.updateMe(form);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav('/settings')} style={{ background: 'none', border: 0, cursor: 'pointer', display: 'flex', padding: 0 }}>
          <Icon name="back" size={24} />
        </button>
        <h1>Profile &amp; identity</h1>
        <div style={{ width: 24 }} />
      </div>

      <div className="scroll" style={{ padding: '20px 20px 100px' }}>
        {/* Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
            {form.profilePhotoUrl ? (
              <img src={form.profilePhotoUrl} alt="profile"
                style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--reed)' }} />
            ) : (
              <Avatar name={form.displayName || form.firstName || 'You'} size={110} />
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 36, height: 36,
              borderRadius: '50%', background: 'var(--moss)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--paper)',
            }}>
              <Icon name="camera" size={16} color="#fff" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--silt)' }}>Tap to change photo</div>
        </div>

        {/* Name */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="label">First name</label>
            <input className="field" value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              placeholder="Hannah" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Surname</label>
            <input className="field" value={form.surname}
              onChange={e => set('surname', e.target.value)}
              placeholder="Whitaker" />
          </div>
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Display name</label>
          <input className="field" value={form.displayName}
            onChange={e => set('displayName', e.target.value)}
            placeholder="What others will see" />
        </div>

        {/* Username */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <label className="label" style={{ marginBottom: 0 }}>Username</label>
            <UsernameStatus username={form.username} checking={checkingUsername} available={usernameAvailable} />
          </div>
          <input className="field" value={form.username}
            onChange={e => handleUsernameChange(e.target.value)}
            placeholder="unique handle, e.g. nb_otter" />
          <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 4 }}>
            Lowercase letters, numbers and underscores only.
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Bio</label>
          <textarea className="field" rows={3} maxLength={200}
            value={form.bio} onChange={e => set('bio', e.target.value)}
            placeholder="A short line about you and your boat"
            style={{ resize: 'none' }} />
          <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 4, textAlign: 'right' }}>
            {form.bio.length}/200
          </div>
        </div>

        {/* Email (readonly) */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Email</label>
          <input className="field" value={user?.email || ''} disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
        {success && (
          <div style={{ background: 'var(--moss-soft)', color: 'var(--moss-dark)', padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 12, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
            ✓ Saved
          </div>
        )}

        <button onClick={save} className="btn primary block" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

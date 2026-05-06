import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';

export default function ProfileIdentityScreen() {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    profilePhotoUrl: user?.profilePhotoUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB');
      return;
    }
    const r = new FileReader();
    r.onload = () => set('profilePhotoUrl', r.result);
    r.readAsDataURL(file);
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
        <h1>Profile & identity</h1>
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
              <Avatar name={form.displayName || 'You'} size={110} />
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 36, height: 36,
              borderRadius: '50%', background: 'var(--moss)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--paper)', cursor: 'pointer',
            }}>
              <Icon name="camera" size={16} color="#fff" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--silt)' }}>Tap to change photo</div>
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
          <label className="label">Username</label>
          <input className="field" value={form.username}
            onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
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

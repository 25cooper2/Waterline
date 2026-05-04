import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const nav = useNavigate();
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [boatForm, setBoatForm] = useState({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
  const [boatError, setBoatError] = useState('');
  const [boatLoading, setBoatLoading] = useState(false);

  const submitBoat = async () => {
    setBoatError('');
    setBoatLoading(true);
    try {
      await api.createBoat(boatForm);
      await refreshUser();
      setShowAddBoat(false);
      setBoatForm({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
    } catch (e) {
      setBoatError(e.message);
    } finally {
      setBoatLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="screen">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="me" size={34} color="var(--moss)" />
          </div>
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 400, fontStyle: 'italic', margin: '0 0 12px' }}>You haven't made an account yet.</h2>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 300, margin: 0 }}>
            Profiles, friends and verification are all part of being a member.
          </p>
          <button onClick={() => nav('/auth')} className="btn primary" style={{ marginTop: 28, minWidth: 200 }}>Log in or sign up</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="appbar">
        <h1>Me</h1>
        <button className="btn text" style={{ padding: '8px 0' }}>
          <Icon name="settings" size={22} color="var(--ink)" />
        </button>
      </div>

      <div className="scroll">
        {/* Profile header */}
        <div style={{ padding: '24px 20px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--reed)' }}>
          <Avatar name={user.displayName} src={user.profilePhotoUrl} size={68} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>{user.displayName || 'Boater'}</span>
              {user.isVerified && (
                <span className="chip moss" style={{ cursor: 'default', height: 22, fontSize: 11, padding: '0 8px' }}>
                  <Icon name="check" size={11} color="var(--moss)" stroke={2.5} /> Verified
                </span>
              )}
            </div>
            {user.username && <div className="muted" style={{ fontSize: 14 }}>@{user.username}</div>}
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{user.email}</div>
          </div>
        </div>

        {/* Boat section */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label" style={{ marginBottom: 12 }}>My boat</div>
          {user.boatId ? (
            <div className="card">
              <div className="row">
                <Icon name="boat" size={22} color="var(--moss)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Boat registered</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {user.isVerified ? 'Verified boater' : 'Pending verification'}
                  </div>
                </div>
                <span className={`chip ${user.isVerified ? 'moss' : 'amber'}`} style={{ cursor: 'default' }}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <Icon name="boat" size={32} color="var(--pebble)" />
              <p style={{ margin: '10px 0 14px', color: 'var(--silt)', fontSize: 14 }}>No boat registered yet.</p>
              <button onClick={() => setShowAddBoat(true)} className="btn primary" style={{ height: 42, fontSize: 14 }}>
                Add my boat
              </button>
            </div>
          )}
        </div>

        {/* Account section */}
        <div style={{ padding: '24px 20px 0' }}>
          <div className="label" style={{ marginBottom: 12 }}>Account</div>
          <div className="card">
            <div className="row" style={{ cursor: 'pointer' }}>
              <Icon name="shield" size={20} color="var(--silt)" />
              <span style={{ flex: 1, fontWeight: 500 }}>Verification</span>
              <Icon name="chevron" size={16} color="var(--silt)" />
            </div>
            <div className="row" style={{ cursor: 'pointer' }}>
              <Icon name="settings" size={20} color="var(--silt)" />
              <span style={{ flex: 1, fontWeight: 500 }}>Settings</span>
              <Icon name="chevron" size={16} color="var(--silt)" />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 20px 40px' }}>
          <button
            onClick={() => { logout(); nav('/'); }}
            className="btn ghost block"
            style={{ color: 'var(--rust)', borderColor: 'var(--rust-soft)' }}
          >
            Log out
          </button>
        </div>
      </div>

      {showAddBoat && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div className="sheet" style={{ width: '100%', padding: '0 0 40px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>Register your boat</h3>
              <div className="stack">
                <div>
                  <label className="label">Boat index number (CRT)</label>
                  <input
                    className="field mono"
                    value={boatForm.boatIndexNumber}
                    onChange={e => setBoatForm(f => ({ ...f, boatIndexNumber: e.target.value.toUpperCase() }))}
                    placeholder="E.G. ABC1234"
                    maxLength={7}
                  />
                  <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>Found on your CRT or authority licence.</div>
                </div>
                <div>
                  <label className="label">Boat name</label>
                  <input
                    className="field"
                    value={boatForm.boatName}
                    onChange={e => setBoatForm(f => ({ ...f, boatName: e.target.value }))}
                    placeholder="e.g. Kingfisher"
                  />
                </div>
                <div>
                  <label className="label">Boat type</label>
                  <select className="field" value={boatForm.boatType} onChange={e => setBoatForm(f => ({ ...f, boatType: e.target.value }))}>
                    <option value="narrowboat">Narrowboat</option>
                    <option value="widebeam">Widebeam</option>
                    <option value="cruiser">Cruiser</option>
                    <option value="dutch">Dutch barge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {boatError && <div className="error-msg">{boatError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowAddBoat(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitBoat} disabled={!boatForm.boatIndexNumber || !boatForm.boatName || boatLoading} className="btn primary" style={{ flex: 1 }}>
                    {boatLoading ? 'Adding…' : 'Register boat'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Icon from '../components/Icon';
import Plate from '../components/Plate';

export default function SettingsBoatsScreen() {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [boatForm, setBoatForm] = useState({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
  const [boatError, setBoatError] = useState('');
  const [boatLoading, setBoatLoading] = useState(false);

  const submitBoat = async () => {
    setBoatError('');
    setBoatLoading(true);
    try {
      await api.createBoat(boatForm);
      await refreshUser();
      setShowAdd(false);
      setBoatForm({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
    } catch (e) {
      setBoatError(e.message);
    } finally {
      setBoatLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => nav('/settings')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="back" />
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Boats &amp; verification</span>
        </div>
      </div>

      <div className="scroll">
        <div style={{ padding: '12px 20px 0', fontSize: 13.5, color: 'var(--silt)', lineHeight: 1.5 }}>
          Add up to 3 boats to your account. Verification builds trust on the marketplace and unlocks the verified badge.
        </div>

        {/* Current boat */}
        {user?.boatId ? (
          <div className="card" style={{ margin: '14px 20px', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 10,
                background: 'var(--linen)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="boat" size={28} color="var(--pebble)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {user.boatName || 'My boat'}
                  </span>
                  <span className="chip" style={{ height: 24, fontSize: 11, padding: '0 8px' }}>Primary</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Plate>{user.boatIndexNumber}</Plate>
                  <span style={{ fontSize: 12.5, color: 'var(--silt)' }}>
                    {user.boatType || 'Narrowboat'}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: user.isVerified ? 'var(--moss-soft)' : 'var(--linen)',
              borderRadius: 10,
            }}>
              <Icon
                name={user.isVerified ? 'verified' : 'clock'}
                size={18}
                color={user.isVerified ? 'var(--moss)' : 'var(--silt)'}
                stroke={2}
              />
              <div style={{ flex: 1, fontSize: 13.5 }}>
                {user.isVerified ? (
                  <>
                    <strong>Verified boat</strong>
                    <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>CRT licence confirmed</div>
                  </>
                ) : (
                  <>
                    <strong>Verification pending</strong>
                    <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>Upload your CRT licence to verify</div>
                  </>
                )}
              </div>
              {!user.isVerified && (
                <button
                  className="btn ghost"
                  style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}
                  onClick={() => alert('Certificate upload coming soon. Email your CRT licence to verify@waterline.app')}
                >
                  Upload
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn ghost" style={{ flex: 1, height: 38, fontSize: 13 }}>
                Edit details
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="boat" size={40} color="var(--pebble)" />
            <p style={{ margin: '10px 0' }}>No boats registered yet.</p>
          </div>
        )}

        {/* Add another boat */}
        <div style={{ padding: '0 20px 24px' }}>
          <button onClick={() => setShowAdd(true)} className="btn ghost block">
            <Icon name="plus" size={18} /> Add another boat
          </button>
        </div>
      </div>

      {/* Add boat modal */}
      {showAdd && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2000,
          background: 'rgba(31,42,38,0.5)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div className="sheet" style={{ width: '100%', padding: '0 0 40px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>Register a boat</h3>
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
                  <button onClick={() => setShowAdd(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button
                    onClick={submitBoat}
                    disabled={!boatForm.boatIndexNumber || !boatForm.boatName || boatLoading}
                    className="btn primary"
                    style={{ flex: 1 }}
                  >
                    {boatLoading ? 'Adding...' : 'Register boat'}
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

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Icon from '../components/Icon';
import Plate from '../components/Plate';
import { compressImage } from '../utils/imageCompress';

export default function SettingsBoatsScreen() {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [boatForm, setBoatForm] = useState({ boatIndexNumber: '', boatName: '', boatType: 'narrowboat' });
  const [editForm, setEditForm] = useState({ boatName: '', boatType: 'narrowboat', boatLength: '', boatYear: '', boatPhotoUrl: '' });
  const [boat, setBoat] = useState(null);
  const [boatError, setBoatError] = useState('');
  const [boatLoading, setBoatLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const licenseInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Fetch full boat record (for fields not on the user object)
  useEffect(() => {
    if (!user?.boatId) { setBoat(null); return; }
    api.getBoat(user.boatId).then(setBoat).catch(() => {});
  }, [user?.boatId]);

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

  const openEdit = () => {
    setEditForm({
      boatName: boat?.boatName || user.boatName || '',
      boatType: boat?.boatType || user.boatType || 'narrowboat',
      boatLength: boat?.boatLength || '',
      boatYear: boat?.boatYear || '',
      boatPhotoUrl: boat?.boatPhotoUrl || '',
    });
    setShowEdit(true);
  };

  const submitEdit = async () => {
    setBoatLoading(true);
    try {
      const updated = await api.updateBoat(user.boatId, {
        boatName: editForm.boatName,
        boatType: editForm.boatType,
        boatLength: editForm.boatLength ? Number(editForm.boatLength) : null,
        boatYear: editForm.boatYear ? Number(editForm.boatYear) : null,
        boatPhotoUrl: editForm.boatPhotoUrl || null,
      });
      setBoat(updated);
      await refreshUser();
      setShowEdit(false);
    } catch (e) { alert('Update failed: ' + e.message); }
    setBoatLoading(false);
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await compressImage(file, { maxDim: 1200, quality: 0.78 });
    setEditForm(f => ({ ...f, boatPhotoUrl: url }));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleLicenseUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const url = await compressImage(file, { maxDim: 1800, quality: 0.85 });
      await api.uploadCertificate(user.boatId, { licenseDocUrl: url });
      const fresh = await api.getBoat(user.boatId);
      setBoat(fresh);
      await refreshUser();
      setUploadMsg('Submitted for review.');
    } catch (err) {
      setUploadMsg('Upload failed: ' + err.message);
    }
    setUploading(false);
    if (licenseInputRef.current) licenseInputRef.current.value = '';
  };

  const deleteBoat = async () => {
    if (!confirm(`Permanently delete ${boat?.boatName || 'this boat'}? This cannot be undone.`)) return;
    setBoatLoading(true);
    try {
      await api.deleteBoat(user.boatId);
      await refreshUser();
      setBoat(null);
    } catch (e) { alert('Delete failed: ' + e.message); }
    setBoatLoading(false);
  };

  const status = boat?.verificationStatus || (user?.isVerified ? 'verified' : 'unverified');
  const statusLabel = {
    verified: 'Verified boat',
    pending_approval: 'Verification pending review',
    rejected: 'Verification rejected',
    unverified: 'Not yet verified',
  }[status];

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
          One registered boat per account. Verification builds trust on the marketplace and unlocks the verified badge.
        </div>

        {user?.boatId ? (
          <div className="card" style={{ margin: '14px 20px', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                background: boat?.boatPhotoUrl ? `url(${boat.boatPhotoUrl}) center/cover` : 'var(--linen)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!boat?.boatPhotoUrl && <Icon name="boat" size={28} color="var(--pebble)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{boat?.boatName || user.boatName || 'My boat'}</span>
                  {status === 'verified' && <Icon name="verified" size={16} color="var(--moss)" stroke={2} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Plate>{user.boatIndexNumber}</Plate>
                  <span style={{ fontSize: 12.5, color: 'var(--silt)' }}>
                    {boat?.boatType || user.boatType || 'Narrowboat'}
                    {boat?.boatLength ? ` · ${boat.boatLength}ft` : ''}
                    {boat?.boatYear ? ` · ${boat.boatYear}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: status === 'verified' ? 'var(--moss-soft)' : status === 'rejected' ? 'rgba(192,57,43,0.08)' : 'var(--linen)',
              borderRadius: 10,
            }}>
              <Icon
                name={status === 'verified' ? 'verified' : status === 'rejected' ? 'warning' : 'clock'}
                size={18}
                color={status === 'verified' ? 'var(--moss)' : status === 'rejected' ? 'var(--rust)' : 'var(--silt)'}
                stroke={2}
              />
              <div style={{ flex: 1, fontSize: 13.5 }}>
                <strong>{statusLabel}</strong>
                {status === 'rejected' && boat?.verificationNotes && (
                  <div style={{ fontSize: 12.5, color: 'var(--rust)', marginTop: 2 }}>{boat.verificationNotes}</div>
                )}
                {status === 'unverified' && (
                  <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>Upload your CRT or river-authority licence to verify</div>
                )}
                {status === 'pending_approval' && (
                  <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>Admin will review shortly</div>
                )}
              </div>
              {(status === 'unverified' || status === 'rejected') && (
                <>
                  <input ref={licenseInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleLicenseUpload} />
                  <button
                    className="btn ghost"
                    style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}
                    onClick={() => licenseInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </>
              )}
            </div>
            {uploadMsg && <div style={{ fontSize: 12.5, color: 'var(--moss)', marginTop: 8 }}>{uploadMsg}</div>}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={openEdit} className="btn ghost" style={{ flex: 1, height: 38, fontSize: 13 }}>
                Edit details
              </button>
              <button onClick={deleteBoat} className="btn ghost" style={{ flex: 1, height: 38, fontSize: 13, color: 'var(--rust)' }} disabled={boatLoading}>
                <Icon name="trash" size={14} color="var(--rust)" /> Delete boat
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="boat" size={40} color="var(--pebble)" />
            <p style={{ margin: '10px 0' }}>No boat registered yet.</p>
            <button onClick={() => setShowAdd(true)} className="btn primary">
              <Icon name="plus" size={16} color="var(--paper)" /> Register a boat
            </button>
          </div>
        )}
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
                  <label className="label">Boat index number (CRT or other authority)</label>
                  <input
                    className="field mono"
                    value={boatForm.boatIndexNumber}
                    onChange={e => setBoatForm(f => ({ ...f, boatIndexNumber: e.target.value.toUpperCase() }))}
                    placeholder="E.G. ABC1234"
                    maxLength={7}
                  />
                  <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>Found on your CRT or river-authority licence.</div>
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
                  <label className="label">Boat type (optional)</label>
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

      {/* Edit boat modal */}
      {showEdit && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2000,
          background: 'rgba(31,42,38,0.5)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div className="sheet" style={{ width: '100%', padding: '0 0 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>Edit boat details</h3>
              <div className="stack">
                <div>
                  <label className="label">Boat name</label>
                  <input className="field" value={editForm.boatName}
                    onChange={e => setEditForm(f => ({ ...f, boatName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Boat type</label>
                  <select className="field" value={editForm.boatType}
                    onChange={e => setEditForm(f => ({ ...f, boatType: e.target.value }))}>
                    <option value="narrowboat">Narrowboat</option>
                    <option value="widebeam">Widebeam</option>
                    <option value="cruiser">Cruiser</option>
                    <option value="dutch">Dutch barge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="label">Length (ft, optional)</label>
                    <input className="field" type="number" value={editForm.boatLength}
                      onChange={e => setEditForm(f => ({ ...f, boatLength: e.target.value }))} placeholder="e.g. 57" />
                  </div>
                  <div>
                    <label className="label">Year (optional)</label>
                    <input className="field" type="number" value={editForm.boatYear}
                      onChange={e => setEditForm(f => ({ ...f, boatYear: e.target.value }))} placeholder="e.g. 1998" />
                  </div>
                </div>
                <div>
                  <label className="label">Boat photo (optional)</label>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoPick} />
                  {editForm.boatPhotoUrl ? (
                    <div style={{ position: 'relative', width: 120, height: 90, borderRadius: 8, background: `url(${editForm.boatPhotoUrl}) center/cover`, border: '1px solid var(--reed)' }}>
                      <button onClick={() => setEditForm(f => ({ ...f, boatPhotoUrl: '' }))}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 0, cursor: 'pointer', fontSize: 12 }}>×</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="btn ghost" style={{ height: 38, fontSize: 13 }}>
                      <Icon name="camera" size={14} /> Add photo
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowEdit(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitEdit} disabled={!editForm.boatName || boatLoading} className="btn primary" style={{ flex: 1 }}>
                    {boatLoading ? 'Saving…' : 'Save changes'}
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

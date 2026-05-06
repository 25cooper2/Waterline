import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';

function SettingsRow({ icon, label, meta, onClick }) {
  return (
    <div className="row" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <Icon name={icon} size={20} color="var(--silt)" />
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      {meta && <span className="muted" style={{ fontSize: 13 }}>{meta}</span>}
      {onClick && <Icon name="chevron" size={16} color="var(--silt)" />}
    </div>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'recently';

  return (
    <div className="screen">
      <div className="appbar">
        <button className="btn text" style={{ padding: '8px 0' }} onClick={() => nav('/me')}>
          <Icon name="back" size={22} color="var(--ink)" />
        </button>
        <h1 style={{ flex: 1 }}>Settings</h1>
      </div>

      <div className="scroll">
        {/* Profile summary */}
        <div style={{ padding: '20px 20px', display: 'flex', gap: 14, alignItems: 'center', borderBottom: '1px solid var(--reed)' }}>
          <Avatar name={user?.displayName} src={user?.profilePhotoUrl} size={50} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.displayName || 'Boater'}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Member since {memberSince}</div>
          </div>
        </div>

        {/* Account section */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label" style={{ marginBottom: 10 }}>Account</div>
          <div className="card">
            <SettingsRow icon="me" label="Profile & identity" onClick={() => nav('/settings/profile')} />
            <SettingsRow icon="boat" label="Boats & verification" meta={user?.boatId ? '1 boat' : '0 boats'} onClick={() => nav('/settings/boats')} />
            <SettingsRow icon="wrench" label="My services" meta="Trade off" onClick={() => {}} />
            <SettingsRow icon="shield" label="Privacy & visibility" onClick={() => nav('/settings/privacy')} />
            <SettingsRow icon="bell" label="Notifications" onClick={() => {}} />
          </div>
        </div>

        {/* Hidden section */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label" style={{ marginBottom: 10 }}>Hidden</div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <span className="muted" style={{ fontSize: 14 }}>No hidden users</span>
          </div>
        </div>

        {/* Support section */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="label" style={{ marginBottom: 10 }}>Support</div>
          <div className="card">
            <SettingsRow icon="info" label="Help centre" onClick={() => {}} />
            <SettingsRow icon="shield" label="Boater's Guarantee" onClick={() => {}} />
            <SettingsRow icon="flag" label="Community guidelines" onClick={() => {}} />
            <SettingsRow icon="send" label="Contact support" onClick={() => {}} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '24px 20px 0' }}>
          <button
            onClick={() => { logout(); nav('/'); }}
            className="btn ghost block"
            style={{ color: 'var(--rust)', borderColor: 'var(--rust)' }}
          >
            <Icon name="logout" size={18} color="var(--rust)" />
            Log out
          </button>
        </div>

        <div style={{ padding: '12px 20px 0', textAlign: 'center' }}>
          <button
            onClick={() => {}}
            className="btn text"
            style={{ color: 'var(--rust)', fontSize: 14 }}
          >
            Delete account
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: '32px 20px 40px', textAlign: 'center' }}>
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            WATERLINE 1.0.0 &middot; BUILT FOR THE WATERWAYS
          </span>
        </div>
      </div>
    </div>
  );
}

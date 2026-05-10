import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const tabs = [
  { to: '/map', icon: 'map', label: 'Map' },
  { to: '/market', icon: 'market', label: 'Market' },
  { to: '/inbox', icon: 'inbox', label: 'Hub' },
  { to: '/logbook', icon: 'logbook', label: 'Logbook' },
  { to: '/me', icon: 'me', label: 'Me' },
];

export default function TabBar() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetchUnread = () => {
      api.inbox({ unreadOnly: 'true' })
        .then(res => setUnread(Array.isArray(res) ? res.length : 0))
        .catch(() => {});
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <nav className="tabbar">
      {tabs.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon name={icon} size={24} />
            {label === 'Me' && unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -6,
                background: 'var(--moss)', color: '#fff',
                borderRadius: '50%', minWidth: 16, height: 16,
                fontSize: 10, fontWeight: 700, lineHeight: '16px',
                textAlign: 'center', padding: '0 3px',
              }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

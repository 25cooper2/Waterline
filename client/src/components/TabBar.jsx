import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const tabs = [
  { to: '/map', icon: 'map', label: 'Map' },
  { to: '/market', icon: 'market', label: 'Market' },
  { to: '/inbox', icon: 'inbox', label: 'Chats' },
  { to: '/logbook', icon: 'logbook', label: 'Logbook' },
  { to: '/me', icon: 'me', label: 'Me' },
];

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
        >
          <Icon name={icon} size={24} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

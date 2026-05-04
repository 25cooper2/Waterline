import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

const COPY = {
  logbook: {
    title: 'Your logbook is private.',
    body: 'Log in to track your stays, miles cruised and locks worked. Browse the network, hazards and marketplace as a guest.',
    icon: 'logbook',
  },
  inbox: {
    title: 'Inbox is for members.',
    body: 'Hails, marketplace messages and CRT updates are tied to your account. Log in to send and receive them.',
    icon: 'inbox',
  },
  me: {
    title: "You haven't made an account yet.",
    body: 'Profiles, friends and verification are all part of being a member. Set yours up — it takes a minute.',
    icon: 'me',
  },
};

export default function LoginWall({ tab = 'me' }) {
  const nav = useNavigate();
  const copy = COPY[tab] || COPY.me;

  return (
    <div className="screen">
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 36, textAlign: 'center'
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: 18,
          background: 'var(--moss-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20
        }}>
          <Icon name={copy.icon} size={36} color="var(--moss)" stroke={1.6} />
        </div>
        <h2 className="serif" style={{
          fontSize: 28, fontWeight: 400, fontStyle: 'italic',
          letterSpacing: '-0.015em', margin: '0 0 12px', lineHeight: 1.15
        }}>{copy.title}</h2>
        <p style={{ color: 'var(--silt)', fontSize: 15, lineHeight: 1.55, maxWidth: 320, margin: 0 }}>
          {copy.body}
        </p>
        <button onClick={() => nav('/auth')} className="btn primary" style={{ marginTop: 28, minWidth: 200 }}>
          Log in or sign up
        </button>
        <button onClick={() => nav('/map')} className="btn text" style={{ marginTop: 4, fontSize: 14 }}>
          Back to the map
        </button>
      </div>
    </div>
  );
}

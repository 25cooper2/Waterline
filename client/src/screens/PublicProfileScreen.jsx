import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';
import LoginWall from '../components/LoginWall';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function PublicProfileScreen() {
  const { userId } = useParams();
  const nav = useNavigate();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Self-profile shortcut
  useEffect(() => {
    if (me && userId === me._id) { nav('/me', { replace: true }); }
  }, [me, userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.getPublicProfile(userId).catch(() => null),
      api.listPosts({ authorId: userId, limit: 30 }).catch(() => []),
      me ? api.isFollowing(userId).catch(() => ({ following: false })) : Promise.resolve({ following: false }),
    ]).then(([p, ps, f]) => {
      setProfile(p);
      setPosts(ps || []);
      setIsFollowing(!!f?.following);
    }).finally(() => setLoading(false));
  }, [userId, me]);

  if (!me) return <LoginWall tab="me" />;

  const toggleFollow = async () => {
    setBusy(true);
    try {
      if (isFollowing) { await api.unfollow(userId); setIsFollowing(false); }
      else { await api.follow(userId); setIsFollowing(true); }
    } catch (e) { alert(e.message); }
    setBusy(false);
  };

  const messageUser = () => {
    nav(`/inbox/${userId}`);
  };

  return (
    <div className="screen">
      <div className="appbar">
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}>
          <Icon name="back" />
        </button>
        <h1>Profile</h1>
      </div>

      <div className="scroll">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : !profile ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="me" size={36} color="var(--pebble)" />
            <p style={{ marginTop: 10 }}>Profile not found.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '24px 20px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Avatar name={profile.displayName} src={profile.profilePhotoUrl} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{profile.displayName || 'Boater'}</div>
                {profile.username && <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>@{profile.username}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {profile.boatIndexNumber && <Plate>{profile.boatIndexNumber}</Plate>}
                  {profile.boatName && <span className="muted" style={{ fontSize: 13 }}>{profile.boatName}</span>}
                  {profile.isVerified && <Icon name="verified" size={16} color="var(--moss)" stroke={2} />}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
              <button onClick={toggleFollow} disabled={busy} className={`btn ${isFollowing ? 'ghost' : 'primary'}`} style={{ flex: 1 }}>
                {busy ? '…' : isFollowing ? 'Following' : 'Follow'}
              </button>
              <button onClick={messageUser} className="btn ghost" style={{ flex: 1 }}>
                <Icon name="send" size={16} /> Message
              </button>
            </div>

            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.followerCount ?? 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--silt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Followers</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: 14, borderLeft: '1px solid var(--reed)' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.followingCount ?? 0}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--silt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Following</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: 14, borderLeft: '1px solid var(--reed)' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{posts.length}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--silt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Posts</div>
              </div>
            </div>

            {profile.bio && (
              <div style={{ padding: '16px 20px', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{profile.bio}</div>
            )}

            <div style={{ padding: '16px 20px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--silt)' }}>
              Recent posts
            </div>
            {posts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--silt)', fontSize: 14 }}>No posts yet.</div>
            ) : (
              posts.map(p => (
                <div key={p._id} style={{ padding: '12px 20px', borderTop: '1px solid var(--linen)' }}>
                  <div style={{ fontSize: 12, color: 'var(--silt)', marginBottom: 4 }}>{timeAgo(p.createdAt)}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{p.body}</div>
                  {p.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {p.tags.map(t => (
                        <span key={t} style={{ fontSize: 12, color: 'var(--moss)', fontWeight: 600 }}>#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

function UserRow({ person, isFollowing, onToggle, loading }) {
  return (
    <div className="row" style={{ padding: '12px 20px', gap: 12 }}>
      <Avatar name={person.displayName} src={person.profilePhotoUrl} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="truncate" style={{ fontWeight: 600, fontSize: 15 }}>{person.displayName || 'Boater'}</span>
          {person.boatName && <Plate>{person.boatName}</Plate>}
        </div>
        {person.location && (
          <div className="muted truncate" style={{ fontSize: 13, marginTop: 2 }}>{person.location}</div>
        )}
      </div>
      <button
        className={`btn ${isFollowing ? 'ghost' : 'primary'}`}
        style={{ height: 34, fontSize: 13, padding: '0 14px', flexShrink: 0 }}
        onClick={() => onToggle(person._id)}
        disabled={loading}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('following');
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [toggling, setToggling] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [fing, fers] = await Promise.all([
        api.following(user._id),
        api.followers(user._id),
      ]);
      const followingArr = Array.isArray(fing) ? fing : fing.users || [];
      const followersArr = Array.isArray(fers) ? fers : fers.users || [];
      setFollowingList(followingArr);
      setFollowersList(followersArr);
      setFollowingIds(new Set(followingArr.map(u => u._id)));
    } catch (e) {
      console.error('Failed to load friends', e);
    }
  }, [user?._id]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFollow = async (targetId) => {
    setToggling(targetId);
    try {
      if (followingIds.has(targetId)) {
        await api.unfollow(targetId);
        setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
        setFollowingList(prev => prev.filter(u => u._id !== targetId));
      } else {
        await api.follow(targetId);
        setFollowingIds(prev => new Set(prev).add(targetId));
        await loadData();
      }
    } catch (e) {
      console.error('Follow toggle failed', e);
    } finally {
      setToggling(null);
    }
  };

  const filteredFollowers = followersList.filter(p =>
    !searchQuery || p.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = followingList.filter(p =>
    !searchQuery || p.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestions = followersList.filter(p => !followingIds.has(p._id));

  return (
    <div className="screen">
      <div className="appbar">
        <button className="btn text" style={{ padding: '8px 0' }} onClick={() => nav('/me')}>
          <Icon name="back" size={22} color="var(--ink)" />
        </button>
        <h1 style={{ flex: 1 }}>Friends</h1>
        <button className="btn text" style={{ padding: '8px 0' }} onClick={() => nav('/settings/privacy')}>
          <Icon name="settings" size={22} color="var(--ink)" />
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--reed)' }}>
        <button
          className={`chip${tab === 'following' ? ' active' : ''}`}
          onClick={() => setTab('following')}
        >
          Following &middot; {followingList.length}
        </button>
        <button
          className={`chip${tab === 'followers' ? ' active' : ''}`}
          onClick={() => setTab('followers')}
        >
          Followers &middot; {followersList.length}
        </button>
        <button
          className={`chip${tab === 'find' ? ' active' : ''}`}
          onClick={() => setTab('find')}
        >
          Find
        </button>
      </div>

      <div className="scroll">
        {/* Find tab: search input */}
        {tab === 'find' && (
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ position: 'relative' }}>
              <input
                className="field"
                placeholder="Search boaters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Icon name="search" size={18} color="var(--silt)" />
              </div>
            </div>
          </div>
        )}

        {/* Following tab */}
        {tab === 'following' && (
          followingList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Icon name="friend" size={36} color="var(--pebble)" />
              <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>Not following anyone yet.</p>
            </div>
          ) : (
            <div>
              {filteredFollowing.map(person => (
                <UserRow
                  key={person._id}
                  person={person}
                  isFollowing={true}
                  onToggle={toggleFollow}
                  loading={toggling === person._id}
                />
              ))}
            </div>
          )
        )}

        {/* Followers tab */}
        {tab === 'followers' && (
          followersList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Icon name="friend" size={36} color="var(--pebble)" />
              <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>No followers yet.</p>
            </div>
          ) : (
            <div>
              {filteredFollowers.map(person => (
                <UserRow
                  key={person._id}
                  person={person}
                  isFollowing={followingIds.has(person._id)}
                  onToggle={toggleFollow}
                  loading={toggling === person._id}
                />
              ))}
            </div>
          )
        )}

        {/* Find tab */}
        {tab === 'find' && (
          <div>
            <div className="label" style={{ padding: '16px 20px 8px' }}>Suggestions &mdash; moored nearby</div>
            {suggestions.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                <p className="muted" style={{ fontSize: 14 }}>No suggestions right now.</p>
              </div>
            ) : (
              suggestions.map(person => (
                <UserRow
                  key={person._id}
                  person={person}
                  isFollowing={followingIds.has(person._id)}
                  onToggle={toggleFollow}
                  loading={toggling === person._id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

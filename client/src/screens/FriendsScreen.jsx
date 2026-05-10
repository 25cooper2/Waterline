import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

function UserRow({ person, actionLabel, onAction, loading, onClick }) {
  return (
    <div
      className="row"
      style={{ padding: '12px 20px', gap: 12, cursor: 'pointer' }}
      onClick={onClick}
    >
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
      {actionLabel && (
        <button
          className="btn ghost"
          style={{ height: 34, fontSize: 13, padding: '0 14px', flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); onAction(person._id); }}
          disabled={loading}
        >
          {loading ? '…' : actionLabel}
        </button>
      )}
    </div>
  );
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('friends');
  const [friendsList, setFriendsList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [toggling, setToggling] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [friends, fing, fers, reqs] = await Promise.all([
        api.myFriends().catch(() => []),
        api.following(user._id).catch(() => []),
        api.followers(user._id).catch(() => []),
        api.myFriendRequests().catch(() => []),
      ]);
      setFriendsList(Array.isArray(friends) ? friends : []);
      const followingArr = Array.isArray(fing) ? fing : fing.users || [];
      const followersArr = Array.isArray(fers) ? fers : fers.users || [];
      setFollowingList(followingArr);
      setFollowersList(followersArr);
      setFollowingIds(new Set(followingArr.map(u => u._id)));
      setPendingRequests(Array.isArray(reqs) ? reqs : []);
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }, [user?._id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Live search when on Find tab
  useEffect(() => {
    if (tab !== 'find') return;
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchUsers(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, tab]);

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

  const acceptRequest = async (senderId) => {
    setToggling(senderId);
    try {
      await api.acceptFriendRequest(senderId);
      await loadData();
    } catch (e) {
      console.error('Accept failed', e);
    } finally {
      setToggling(null);
    }
  };

  const declineRequest = async (senderId) => {
    setToggling(senderId);
    try {
      await api.declineFriendRequest(senderId);
      setPendingRequests(prev => prev.filter(r => r.sender._id !== senderId));
    } catch (e) {
      console.error('Decline failed', e);
    } finally {
      setToggling(null);
    }
  };

  const suggestions = followersList.filter(p => !followingIds.has(p._id));

  const goToProfile = (id) => { if (id) nav(`/profile/${id}`); };

  return (
    <div className="screen">
      <div className="appbar">
        <button className="btn text" style={{ padding: '8px 0' }} onClick={() => nav('/me')}>
          <Icon name="back" size={22} color="var(--ink)" />
        </button>
        <h1 style={{ flex: 1 }}>Friends &amp; Following</h1>
        <button className="btn text" style={{ padding: '8px 0' }} onClick={() => nav('/settings/privacy')}>
          <Icon name="settings" size={22} color="var(--ink)" />
        </button>
      </div>

      {/* Pending friend requests banner */}
      {pendingRequests.length > 0 && (
        <div style={{ padding: '12px 20px', background: 'var(--moss-soft)', borderBottom: '1px solid rgba(26,107,90,0.15)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--moss-dark)', marginBottom: 8 }}>
            Friend requests ({pendingRequests.length})
          </div>
          {pendingRequests.map(req => (
            <div key={req._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Avatar name={req.sender.displayName} src={req.sender.profilePhotoUrl} size={36} />
              <div
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => goToProfile(req.sender._id)}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{req.sender.displayName || 'Boater'}</div>
                <div style={{ fontSize: 12, color: 'var(--silt)' }}>wants to be your friend</div>
              </div>
              <button
                className="btn primary"
                style={{ height: 30, padding: '0 12px', fontSize: 12, flexShrink: 0 }}
                onClick={() => acceptRequest(req.sender._id)}
                disabled={toggling === req.sender._id}
              >
                Accept
              </button>
              <button
                className="btn ghost"
                style={{ height: 30, padding: '0 10px', fontSize: 12, flexShrink: 0 }}
                onClick={() => declineRequest(req.sender._id)}
                disabled={toggling === req.sender._id}
              >
                Decline
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--reed)', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        <button className={`chip${tab === 'friends' ? ' active' : ''}`} onClick={() => setTab('friends')}>
          Friends &middot; {friendsList.length}
        </button>
        <button className={`chip${tab === 'following' ? ' active' : ''}`} onClick={() => setTab('following')}>
          Following &middot; {followingList.length}
        </button>
        <button className={`chip${tab === 'followers' ? ' active' : ''}`} onClick={() => setTab('followers')}>
          Followers &middot; {followersList.length}
        </button>
        <button className={`chip${tab === 'find' ? ' active' : ''}`} onClick={() => setTab('find')}>
          Find
        </button>
      </div>

      <div className="scroll" style={{ background: 'var(--paper)' }}>
        {/* Find tab: search input */}
        {tab === 'find' && (
          <div style={{ padding: '16px 20px 12px' }}>
            <div style={{ position: 'relative' }}>
              <input
                className="field"
                placeholder="Search by name or boat..."
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

        {/* Friends tab */}
        {tab === 'friends' && (
          friendsList.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Icon name="friend" size={36} color="var(--pebble)" />
              <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>No friends yet. Visit someone's profile and tap Add as Friend.</p>
            </div>
          ) : (
            <div>
              {friendsList.map(person => (
                <UserRow
                  key={person._id}
                  person={person}
                  actionLabel={null}
                  onClick={() => goToProfile(person._id)}
                />
              ))}
            </div>
          )
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
              {followingList.map(person => (
                <UserRow
                  key={person._id}
                  person={person}
                  actionLabel="Unfollow"
                  onAction={toggleFollow}
                  loading={toggling === person._id}
                  onClick={() => goToProfile(person._id)}
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
              {followersList.map(person => (
                <UserRow
                  key={person._id}
                  person={person}
                  actionLabel={followingIds.has(person._id) ? 'Unfollow' : 'Follow'}
                  onAction={toggleFollow}
                  loading={toggling === person._id}
                  onClick={() => goToProfile(person._id)}
                />
              ))}
            </div>
          )
        )}

        {/* Find tab results */}
        {tab === 'find' && (
          searchQuery.length >= 2 ? (
            searching ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--silt)' }}>Searching…</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                <p className="muted" style={{ fontSize: 14 }}>No boaters found for "{searchQuery}".</p>
              </div>
            ) : (
              <div>
                {searchResults.map(person => (
                  <UserRow
                    key={person._id}
                    person={person}
                    actionLabel={followingIds.has(person._id) ? 'Unfollow' : 'Follow'}
                    onAction={toggleFollow}
                    loading={toggling === person._id}
                    onClick={() => goToProfile(person._id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="label" style={{ padding: '16px 20px 8px' }}>Suggestions — people who follow you</div>
              {suggestions.length === 0 ? (
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                  <p className="muted" style={{ fontSize: 14 }}>No suggestions yet. Type a name above to search all boaters.</p>
                </div>
              ) : (
                suggestions.map(person => (
                  <UserRow
                    key={person._id}
                    person={person}
                    actionLabel="Follow"
                    onAction={toggleFollow}
                    loading={toggling === person._id}
                    onClick={() => goToProfile(person._id)}
                  />
                ))
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

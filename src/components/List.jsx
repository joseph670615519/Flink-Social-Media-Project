import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import avatarImg from '../assets/FlinkAva.png';

const List = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendSearchTerm, setFriendSearchTerm] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);

  // 🔄 Real-time friend updates
  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const userRef = doc(db, 'users', uid);

    const unsub = onSnapshot(userRef, async (snap) => {
      const data = snap.data();
      const friendIds = data?.friends || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const friendDocs = await Promise.all(
        friendIds.map(async (fid) => {
          const fSnap = await getDoc(doc(db, 'users', fid));
          if (fSnap.exists()) {
            const fData = fSnap.data();
            return {
              id: fid,
              displayName: fData.displayName || 'Unknown',
              photoURL: fData.photoURL || avatarImg,
            };
          }
          return null;
        })
      );

      setFriends(friendDocs.filter(Boolean));
    });

    return () => unsub();
  }, []);

  // 🧭 Load all users + friend requests once on mount
  useEffect(() => {
    if (user) {
      loadAllUsers();
      loadFriendRequests();
    }
  }, [user]);

  const loadAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((u) => u.id !== user.uid);

      setAllUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFriendRequests(data.friendRequests || []);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  // ➕ Send request
  const sendFriendRequest = async (targetUserId) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        friendRequests: arrayUnion(user.uid),
      });
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request: ' + error.message);
    }
  };

  // ✅ Accept request
  const acceptFriendRequest = async (requesterId) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequests: arrayRemove(requesterId),
        friends: arrayUnion(requesterId),
      });

      await updateDoc(doc(db, 'users', requesterId), {
        friends: arrayUnion(user.uid),
      });

      loadFriendRequests();
      alert('Friend added!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  // 🔍 Filter people not yet friends
  const filteredNonFriends = allUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(friendSearchTerm.toLowerCase()) &&
      !friends.some((f) => f.id === u.id)
  );

  return (
    <div className="list-container">
      <h2 style={{ marginBottom: '1rem' }}>Friends ({friends.length})</h2>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f8fff4',
            borderRadius: '8px',
            border: '1px solid #86c76b',
          }}
        >
          <h4>Friend Requests ({friendRequests.length})</h4>
          {friendRequests.map((requesterId) => (
            <div
              key={requesterId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <span>User ID: {requesterId}</span>
              <button
                onClick={() => acceptFriendRequest(requesterId)}
                style={{
                  background: '#86c76b',
                  color: 'white',
                  border: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search People */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={friendSearchTerm}
          onChange={(e) => setFriendSearchTerm(e.target.value)}
          placeholder="Find people to add as friends..."
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid #b2e6a0',
            background: '#f8fff4',
            width: '100%',
          }}
        />
      </div>

      {/* People to Add */}
      {friendSearchTerm && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>People to Add</h4>
          {filteredNonFriends.length === 0 ? (
            <div
              style={{
                padding: '1rem',
                textAlign: 'center',
                color: '#666',
              }}
            >
              No users found matching "{friendSearchTerm}"
            </div>
          ) : (
            filteredNonFriends.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <img
                    src={u.photoURL || avatarImg}
                    alt={u.displayName}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                    }}
                  />
                  <span>{u.displayName}</span>
                </div>
                <button
                  onClick={() => sendFriendRequest(u.id)}
                  style={{
                    background: '#86c76b',
                    color: 'white',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Add Friend
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Current Friends */}
      <div style={{ marginTop: '1rem' }}>
        <h4>Your Friends</h4>
        {friends.length === 0 ? (
          <div
            style={{
              padding: '1rem',
              textAlign: 'center',
              color: '#666',
            }}
          >
            No friends yet. Search above to find people!
          </div>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li key={friend.id} className="friend-item">
                <Link
                  to={`/profile/${friend.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                  }}
                >
                  <img
                    src={friend.photoURL || avatarImg}
                    alt={friend.displayName}
                    className="friend-avatar"
                  />
                  <span className="friend-name">{friend.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default List;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import avatarImg from '../assets/FlinkAva.png';

const List = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendSearchTerm, setFriendSearchTerm] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadAllUsers();
      loadFriendRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendsIds = userData.friends || [];
        
        const friendsPromises = friendsIds.map(async (friendId) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            return {
              id: friendId,
              ...friendDoc.data()
            };
          }
          return null;
        });
        
        const friendsList = (await Promise.all(friendsPromises)).filter(friend => friend !== null);
        setFriends(friendsList);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(userDoc => userDoc.id !== user.uid);
      
      setAllUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFriendRequests(userData.friendRequests || []);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        friendRequests: arrayUnion(user.uid)
      });
      
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request: ' + error.message);
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {

      await updateDoc(doc(db, 'users', user.uid), {
        friendRequests: arrayRemove(requesterId)
      });
      
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayUnion(requesterId)
      });
      
      await updateDoc(doc(db, 'users', requesterId), {
        friends: arrayUnion(user.uid)
      });
      
      loadFriends();
      loadFriendRequests();
      alert('Friend added!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const filteredNonFriends = allUsers.filter(userDoc => 
    userDoc.displayName?.toLowerCase().includes(friendSearchTerm.toLowerCase()) &&
    !friends.some(friend => friend.id === userDoc.id) 
  );

  return (
    <div className="list-container">
      <h2 style={{ marginBottom: '1rem' }}>Friends ({friends.length})</h2>
      
      {friendRequests.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fff4', borderRadius: '8px', border: '1px solid #86c76b' }}>
          <h4>Friend Requests ({friendRequests.length})</h4>
          {friendRequests.map(requesterId => (
            <div key={requesterId} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.5rem',
              borderBottom: '1px solid #eee'
            }}>
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
                  fontSize: '12px'
                }}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={friendSearchTerm}
          onChange={e => setFriendSearchTerm(e.target.value)}
          placeholder="Find people to add as friends..."
          style={{ 
            padding: '0.5rem', 
            borderRadius: '8px', 
            border: '1px solid #b2e6a0',
            background: '#f8fff4',
            width: '100%'
          }}
        />
      </div>

      {friendSearchTerm && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>People to Add</h4>
          {filteredNonFriends.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
              No users found matching "{friendSearchTerm}"
            </div>
          ) : (
            filteredNonFriends.map(userDoc => (
              <div key={userDoc.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.5rem',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={userDoc.photoURL || avatarImg} alt={userDoc.displayName} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                  <span>{userDoc.displayName}</span>
                </div>
                <button 
                  onClick={() => sendFriendRequest(userDoc.id)}
                  style={{
                    background: '#86c76b',
                    color: 'white',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Add Friend
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <h4>Your Friends</h4>
        {friends.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
            No friends yet. Search above to find people!
          </div>
        ) : (
          <ul className="friends-list">
            {friends.map(friend => (
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
                    transition: 'background 0.2s'
                  }}
                >
                  <img src={friend.photoURL || avatarImg} alt={friend.displayName} className="friend-avatar" />
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
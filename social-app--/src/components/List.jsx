import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase';
import avatarImg from '../assets/FlinkAva.png';

const List = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadFriends();
      loadAllUsers();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendsIds = userData.friends || [];
        
        // Fetch friend details
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
        .filter(userDoc => userDoc.id !== user.uid); // Exclude current user
      
      setAllUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      await setDoc(doc(db, 'users', targetUserId), {
        friendRequests: arrayUnion(user.uid)
      }, { merge: true });
      
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const filteredUsers = allUsers.filter(userDoc => 
    userDoc.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="list-container">
      <h2 style={{ marginBottom: '1rem' }}>Friends ({friends.length})</h2>
      
      {/* Search for new friends */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search for friends..."
          style={{ 
            padding: '0.5rem', 
            borderRadius: '8px', 
            border: '1px solid #b2e6a0',
            background: '#f8fff4',
            width: '100%'
          }}
        />
      </div>

      {/* Search results */}
      {searchTerm && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>Search Results</h4>
          {filteredUsers.map(userDoc => (
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
          ))}
        </div>
      )}

      {/* Friends list */}
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
    </div>
  );
};

export default List;
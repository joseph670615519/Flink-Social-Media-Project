import { useState, useEffect } from 'react';
import { db, auth } from '../firebase.js';
import { collection, doc, getDoc } from "firebase/firestore";

function Sidebar({ selectedFriend, setSelectedFriend, setShowProfile }) {
  const [searchText, setSearchText] = useState('');
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!auth.currentUser) return;

      // 1️⃣ Get current user document
      const currentUserRef = doc(db, "users", auth.currentUser.uid);
      const currentUserSnap = await getDoc(currentUserRef);
      if (!currentUserSnap.exists()) return;

      const currentUserData = currentUserSnap.data();
      const friendsUids = currentUserData.friends || [];
      if (friendsUids.length === 0) {
        setFriends([]);
        return;
      }

      // 2️⃣ Fetch only friend documents
      const friendsList = [];
      for (let uid of friendsUids) {
        const friendSnap = await getDoc(doc(db, "users", uid));
        if (friendSnap.exists()) {
          friendsList.push({ uid: friendSnap.id, ...friendSnap.data() });
        }
      }

      setFriends(friendsList);
    };

    // Run after login
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) fetchFriends();
    });

    return () => unsubscribe();
  }, []);

  const filteredFriends = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setShowProfile(false);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Messenger</h2>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Messenger"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="friends-list">
        {filteredFriends.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            No friends found
          </div>
        ) : (
          filteredFriends.map(friend => (
            <div
              key={friend.uid}
              className={`friend-item ${selectedFriend?.uid === friend.uid ? 'active' : ''}`}
              onClick={() => handleFriendClick(friend)}
            >
              <div className="friend-avatar">
                <span className="avatar-emoji">{friend.profilePic || '👤'}</span>
                {friend.status === 'online' && <span className="online-indicator"></span>}
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.name || 'Unknown'}</div>
                <div className="friend-last-message">{friend.lastMessage || ''}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Sidebar;

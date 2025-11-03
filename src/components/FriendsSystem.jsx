import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeFriend, 
  rejectFriendRequest 
} from './Friends.js';
import { createNotification } from './Notification';
import avatarImg from '../assets/FlinkAva.png';

const FriendsSystem = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load user data and set up real-time listeners
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      if (!userData?.friends) {
        setFriends([]);
        return;
      }

      try {
        const friendsData = await Promise.all(
          userData.friends.map(async (friendId) => {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              return { id: friendId, ...friendDoc.data() };
            }
            return null;
          })
        );

        setFriends(friendsData.filter(Boolean));
      } catch (error) {
        console.error('Error loading friends:', error);
      }
    };

    loadFriends();
  }, [userData?.friends]);

  // Load friend requests
  useEffect(() => {
    const loadFriendRequests = async () => {
      if (!userData?.requestsReceived) {
        setFriendRequests([]);
        return;
      }

      try {
        const requestsData = await Promise.all(
          userData.requestsReceived.map(async (requesterId) => {
            const requesterDoc = await getDoc(doc(db, 'users', requesterId));
            if (requesterDoc.exists()) {
              return { id: requesterId, ...requesterDoc.data() };
            }
            return null;
          })
        );

        setFriendRequests(requestsData.filter(Boolean));
      } catch (error) {
        console.error('Error loading friend requests:', error);
      }
    };

    loadFriendRequests();
  }, [userData?.requestsReceived]);

  // Search users
  const searchForUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchUsers([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          const searchLower = searchTerm.toLowerCase();
          const displayName = (user.displayName || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          
          return user.id !== currentUser.uid && 
                 (displayName.includes(searchLower) || email.includes(searchLower));
        })
        .slice(0, 10); // Limit results

      setSearchUsers(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(searchForUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSendFriendRequest = async (targetUserId, targetUserName) => {
    try {
      await sendFriendRequest(currentUser.uid, targetUserId);
      
      // Create notification
      await createNotification(
        targetUserId,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        'friend_request',
        'sent you a friend request'
      );

      // Update search results to reflect the request was sent
      setSearchUsers(prev => prev.map(user => 
        user.id === targetUserId 
          ? { ...user, requestSent: true }
          : user
      ));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptFriendRequest = async (requesterId, requesterName) => {
    try {
      await acceptFriendRequest(currentUser.uid, requesterId);
      
      // Create notification
      await createNotification(
        requesterId,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        'friend_request',
        'accepted your friend request'
      );
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requesterId) => {
    try {
      await rejectFriendRequest(currentUser.uid, requesterId);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend(currentUser.uid, friendId);
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  const getRelationshipStatus = (user) => {
    if (userData?.friends?.includes(user.id)) return 'friends';
    if (userData?.requestsSent?.includes(user.id)) return 'requestSent';
    if (userData?.requestsReceived?.includes(user.id)) return 'requestReceived';
    return 'none';
  };

  const renderUserCard = (user, showActionButton = true) => (
    <div key={user.id} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      margin: '8px 0'
    }}>
      <img
        src={user.photoURL || avatarImg}
        alt={user.displayName || user.email}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
          {user.displayName || user.email}
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          {user.email}
        </p>
      </div>
      {showActionButton && renderActionButton(user)}
    </div>
  );

  const renderActionButton = (user) => {
    const status = getRelationshipStatus(user);
    
    switch (status) {
      case 'friends':
        return (
          <button
            onClick={() => handleRemoveFriend(user.id)}
            style={{
              padding: '8px 16px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Remove
          </button>
        );
        
      case 'requestSent':
        return (
          <button
            disabled
            style={{
              padding: '8px 16px',
              background: '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            Request Sent
          </button>
        );
        
      case 'requestReceived':
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleAcceptFriendRequest(user.id, user.displayName)}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Accept
            </button>
            <button
              onClick={() => handleRejectFriendRequest(user.id)}
              style={{
                padding: '8px 16px',
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reject
            </button>
          </div>
        );
        
      default:
        return (
          <button
            onClick={() => handleSendFriendRequest(user.id, user.displayName)}
            style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Add Friend
          </button>
        );
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Friends</h2>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '20px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '20px'
        }}>
          {['friends', 'requests', 'search'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 0',
                fontSize: '16px',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                color: activeTab === tab ? '#2196F3' : '#666',
                borderBottom: activeTab === tab ? '2px solid #2196F3' : 'none',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab} {tab === 'requests' && friendRequests.length > 0 && `(${friendRequests.length})`}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search for people by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minHeight: '400px'
      }}>
        {activeTab === 'friends' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0' }}>
              Your Friends ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <p>You haven't added any friends yet.</p>
                <p>Use the search tab to find and add friends!</p>
              </div>
            ) : (
              friends.map(friend => renderUserCard(friend, true))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0' }}>
              Friend Requests ({friendRequests.length})
            </h3>
            {friendRequests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📥</div>
                <p>No pending friend requests</p>
              </div>
            ) : (
              friendRequests.map(request => renderUserCard(request, true))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                Searching...
              </div>
            ) : searchTerm.trim() === '' ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                <p>Search for people to add as friends</p>
              </div>
            ) : searchUsers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px'
              }}>
                <p>No users found matching "{searchTerm}"</p>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 20px 0' }}>
                  Search Results ({searchUsers.length})
                </h3>
                {searchUsers.map(user => renderUserCard(user, true))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSystem;
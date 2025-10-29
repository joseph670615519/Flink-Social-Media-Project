import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserPlus, MessageCircle, Users, Search } from 'lucide-react';
import { createNotification } from '../services/notificationService';
import Chat from './Chat';
import './Friends.css';

const Friends = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchUsers();
  }, [user]);

  const fetchFriends = async () => {
    try {
      const friendsRef = collection(db, 'friendships');
      const q1 = query(friendsRef, where('userId', '==', user.uid), where('status', '==', 'accepted'));
      const q2 = query(friendsRef, where('friendId', '==', user.uid), where('status', '==', 'accepted'));
      
      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const friendsData = [];
      snapshot1.forEach(doc => {
        friendsData.push({ id: doc.data().friendId, ...doc.data().friendData });
      });
      snapshot2.forEach(doc => {
        friendsData.push({ id: doc.data().userId, ...doc.data().userData });
      });
      
      setFriends(friendsData);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const requestsRef = collection(db, 'friendships');
      const q = query(requestsRef, where('friendId', '==', user.uid), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      const requestsData = [];
      snapshot.forEach(doc => {
        requestsData.push({ 
          id: doc.id, 
          fromUserId: doc.data().userId,
          ...doc.data().userData 
        });
      });
      
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = [];
      
      snapshot.forEach(doc => {
        if (doc.id !== user.uid) {
          usersData.push({ id: doc.id, ...doc.data() });
        }
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const sendFriendRequest = async (friendId, friendData) => {
    try {
      await addDoc(collection(db, 'friendships'), {
        userId: user.uid,
        friendId: friendId,
        userData: {
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || '',
          email: user.email
        },
        friendData: friendData,
        status: 'pending',
        timestamp: new Date()
      });
      
      // สร้าง notification เมื่อส่งคำขอเป็นเพื่อน
      try {
        await createNotification(friendId, 'follow', {
          senderId: user.uid,
          senderName: user.displayName || user.email,
          senderAvatar: user.photoURL || '',
          message: 'ส่งคำขอเป็นเพื่อน'
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
      
      alert('ส่งคำขอเป็นเพื่อนแล้ว!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำขอ');
    }
  };

  const acceptFriendRequest = async (requestId, fromUserId) => {
    try {
      const requestRef = doc(db, 'friendships', requestId);
      await deleteDoc(requestRef);
      
      await addDoc(collection(db, 'friendships'), {
        userId: user.uid,
        friendId: fromUserId,
        userData: {
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || '',
          email: user.email
        },
        friendData: friendRequests.find(req => req.fromUserId === fromUserId),
        status: 'accepted',
        timestamp: new Date()
      });
      
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeChat) {
    return (
      <Chat 
        user={user} 
        friend={activeChat} 
        onBack={() => setActiveChat(null)} 
      />
    );
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h1>Flink Friends</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            <Users size={20} />
            เพื่อน ({friends.length})
          </button>
          <button 
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus size={20} />
            คำขอ ({friendRequests.length})
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            <Search size={20} />
            ค้นหา
          </button>
        </div>
      </div>

      {activeTab === 'friends' && (
        <div className="friends-list">
          <h2>เพื่อนของคุณ</h2>
          {friends.length === 0 ? (
            <p className="no-friends">ยังไม่มีเพื่อน ไปหาเพื่อนกันเถอะ!</p>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <img 
                  src={friend.photoURL || '/default-avatar.png'} 
                  alt={friend.displayName}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <h3>{friend.displayName}</h3>
                  <p>{friend.email}</p>
                </div>
                <button 
                  className="chat-button"
                  onClick={() => setActiveChat(friend)}
                >
                  <MessageCircle size={20} />
                  แชท
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="friend-requests">
          <h2>คำขอเป็นเพื่อน</h2>
          {friendRequests.length === 0 ? (
            <p className="no-requests">ไม่มีคำขอเป็นเพื่อน</p>
          ) : (
            friendRequests.map(request => (
              <div key={request.id} className="request-card">
                <img 
                  src={request.photoURL || '/default-avatar.png'} 
                  alt={request.displayName}
                  className="request-avatar"
                />
                <div className="request-info">
                  <h3>{request.displayName}</h3>
                  <p>{request.email}</p>
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-button"
                    onClick={() => acceptFriendRequest(request.id, request.fromUserId)}
                  >
                    ยอมรับ
                  </button>
                  <button className="decline-button">
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="user-search">
          <h2>ค้นหาเพื่อนใหม่</h2>
          <div className="search-input">
            <input
              type="text"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="users-list">
            {filteredUsers.map(userItem => (
              <div key={userItem.id} className="user-card">
                <img 
                  src={userItem.photoURL || '/default-avatar.png'} 
                  alt={userItem.displayName}
                  className="user-avatar"
                />
                <div className="user-info">
                  <h3>{userItem.displayName || userItem.email}</h3>
                  <p>{userItem.email}</p>
                </div>
                <button 
                  className="add-friend-button"
                  onClick={() => sendFriendRequest(userItem.id, userItem)}
                >
                  <UserPlus size={20} />
                  เพิ่มเพื่อน
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
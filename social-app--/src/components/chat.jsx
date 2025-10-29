import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import avatarImg from '../assets/FlinkAva.png';

function chat() {
  const [friends, setFriends] = useState([]);
  const [showChatList, setShowChatList] = useState(false);
  const chatRef = useRef(null);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const friendsIds = userData.friends || [];
          
          const friendsPromises = friendsIds.map(async (friendId) => {
            try {
              const friendDoc = await getDoc(doc(db, 'users', friendId));
              if (friendDoc.exists()) {
                return {
                  id: friendId,
                  ...friendDoc.data(),
                  isOnline: Math.random() > 0.5
                };
              }
              return null;
            } catch (error) {
              console.error('Error loading friend:', error);
              return null;
            }
          });
          
          const friendsList = (await Promise.all(friendsPromises)).filter(friend => friend !== null);
          setFriends(friendsList);
          setOnlineFriends(friendsList.filter(friend => friend.isOnline));
        }
      } catch (error) {
        console.error('Error loading friends for chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setShowChatList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const startChat = (friendId, friendName) => {
    console.log(`Starting chat with ${friendName} (${friendId})`);
    setShowChatList(false);
    alert(`Chat with ${friendName} would start here!`);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }} ref={chatRef}>
      {/* Chat Button */}
      <button 
        style={{
          background: '#f0f2f5',
          border: 'none',
          padding: '8px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '18px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          marginLeft: '10px'
        }}
        onClick={() => setShowChatList(!showChatList)}
        onMouseOver={(e) => e.target.style.background = '#e4e6eb'}
        onMouseOut={(e) => e.target.style.background = '#f0f2f5'}
        title="Chat with friends"
      >
        💬
        {onlineFriends.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#86c76b',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {onlineFriends.length}
          </span>
        )}
      </button>

      {/* Chat Friends List Dropdown */}
      {showChatList && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '300px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #ddd',
          zIndex: '1000',
          marginTop: '5px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #eee'
          }}>
            <h4 style={{ margin: '0', color: '#333', fontSize: '16px' }}>Chat with Friends</h4>
            <span style={{ 
              fontSize: '12px', 
              color: '#86c76b',
              fontWeight: '500'
            }}>
              {onlineFriends.length} online
            </span>
          </div>
          
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px 0'
          }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '20px',
                margin: '0',
                fontSize: '14px'
              }}>
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px 20px',
                margin: '0',
                fontSize: '14px'
              }}>
                No friends yet
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  Add friends to start chatting
                </div>
              </div>
            ) : (
              friends.map(friend => (
                <div 
                  key={friend.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '0',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => startChat(friend.id, friend.displayName)}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={friend.photoURL || avatarImg} 
                      alt={friend.displayName} 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} 
                    />
                    {/* Online status indicator */}
                    {friend.isOnline && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#86c76b',
                        border: '2px solid white'
                      }}></div>
                    )}
                  </div>
                  
                  <div style={{ flex: '1', fontSize: '14px', lineHeight: '1.4' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '2px'
                    }}>
                      <strong>{friend.displayName}</strong>
                      {friend.isOnline && (
                        <span style={{
                          fontSize: '10px',
                          color: '#86c76b',
                          fontWeight: 'bold'
                        }}>
                          ● online
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      Click to start chatting
                    </div>
                  </div>
                  
                  {/* Message icon */}
                  <div style={{
                    padding: '6px',
                    borderRadius: '50%',
                    background: '#f0f2f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '14px', opacity: '0.7' }}>✉️</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer with quick action */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #eee',
            background: '#f8fff4'
          }}>
            <button 
              style={{
                width: '100%',
                padding: '8px 16px',
                background: '#86c76b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onClick={() => {
                console.log('Open full chat interface');
                setShowChatList(false);
              }}
            >
              Open Full Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default chat;
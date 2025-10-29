import React, { useState, useRef, useEffect, useContext } from 'react';
import { TweetContext } from './TweetContext';
import { auth } from '../firebase';

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [tweets] = useContext(TweetContext) || [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateRealisticNotifications = () => {
    if (!tweets.length) return [];

    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const recentTweets = tweets
      .filter(tweet => tweet.userId !== currentUser.uid) 
      .slice(0, 5); 

    const notificationTypes = [
      { text: 'liked your post', emoji: '❤️' },
      { text: 'commented on your post', emoji: '💬' },
      { text: 'shared your post', emoji: '↪️' },
      { text: 'mentioned you in a post', emoji: '📍' },
    ];

    return recentTweets.map((tweet, index) => {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const times = ['Just now', '5 min ago', '10 min ago', '1 hour ago'];
      const time = times[Math.floor(Math.random() * times.length)];
      
      return {
        id: `notif-${tweet.id}-${index}`,
        person: tweet.userName || 'User',
        userId: tweet.userId,
        action: type.text,
        emoji: type.emoji,
        time: time,
        read: false,
        tweetId: tweet.id,
        type: 'interaction'
      };
    });
  };

  useEffect(() => {
    if (tweets.length > 0) {
      const realisticNotifications = generateRealisticNotifications();
      setNotifications(realisticNotifications);
    }
  }, [tweets.length]); 
  
  const markAsRead = (id) => {
    setNotifications(old => 
      old.map(item => 
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const readAll = () => {
    setNotifications(old => old.map(item => ({ ...item, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(item => !item.read).length;

  return (
    <div style={{ position: 'relative' }} ref={notificationRef}>
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
          transition: 'background-color 0.2s'
        }}
        onClick={() => setShowNotifications(!showNotifications)}
        onMouseOver={(e) => e.target.style.background = '#e4e6eb'}
        onMouseOut={(e) => e.target.style.background = '#f0f2f5'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ff4444',
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
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '360px',
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
            <h4 style={{ margin: '0', color: '#333', fontSize: '16px' }}>Notifications</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#86c76b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f0f2f5'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                  onClick={readAll}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b6b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f0f2f5'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                  onClick={clearAll}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px 0'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px 20px',
                margin: '0',
                fontSize: '14px'
              }}>
                No notifications yet
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  Interactions with your posts will appear here
                </div>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '0',
                    cursor: 'pointer',
                    background: notif.read ? 'transparent' : '#f8fff4',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => markAsRead(notif.id)}
                  onMouseOver={(e) => e.currentTarget.style.background = notif.read ? '#f8f9fa' : '#f0f8ff'}
                  onMouseOut={(e) => e.currentTarget.style.background = notif.read ? 'transparent' : '#f8fff4'}
                >
                  <span style={{ fontSize: '16px', marginTop: '2px' }}>{notif.emoji}</span>
                  <div style={{ flex: '1', fontSize: '14px', lineHeight: '1.4' }}>
                    <strong>{notif.person}</strong> {notif.action}
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      {notif.time}
                    </div>
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#86c76b',
                      marginTop: '8px',
                      flexShrink: 0
                    }}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notification;
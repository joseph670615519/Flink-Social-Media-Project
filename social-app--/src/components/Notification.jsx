import React, { useState } from 'react';

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const people = ['Anakin', 'Baton', 'Donut', 'Joe', 'Nine'];
  
  const notificationTypes = [
    { text: 'liked your post', emoji: '❤️' },
    { text: 'commented: "Nice!"', emoji: '💬' },
    { text: 'sent friend request', emoji: '👋' },
    { text: 'mentioned you', emoji: '📍' },
    { text: 'shared your post', emoji: '↪️' },
    { text: 'has birthday today', emoji: '🎂' },
    { text: 'started following', emoji: '⭐' },
    { text: 'sent a message', emoji: '✉️' }
  ];

  const addNotification = () => {
    const person = people[Math.floor(Math.random() * people.length)];
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const times = ['Just now', '1 min ago', '2 min ago'];
    const time = times[Math.floor(Math.random() * times.length)];
    
    const newNotif = {
      id: Date.now(),
      person: person,
      action: type.text,
      emoji: type.emoji,
      time: time,
      read: false
    };
    
    setNotifications(old => [newNotif, ...old]);
  };

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
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      marginLeft: 'auto', // This pushes it to the right
      marginRight: '20px' // Adds some space from the right edge
    }}>
      {/* Button to add notification */}
      <button 
        style={{
          background: '#86c76b',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '15px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
        onClick={addNotification}
        onMouseOver={(e) => e.target.style.background = '#6bbf4e'}
        onMouseOut={(e) => e.target.style.background = '#86c76b'}
      >
        + Notification
      </button>

      {/* Bell icon to show notifications */}
      <div style={{ position: 'relative' }}>
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
            justifyContent: 'center'
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

        {/* Notifications dropdown */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            width: '300px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #ddd',
            zIndex: '1000',
            marginTop: '5px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              borderBottom: '1px solid #eee'
            }}>
              <h4 style={{ margin: '0', color: '#333' }}>Notifications</h4>
              <div style={{ display: 'flex', gap: '5px' }}>
                {unreadCount > 0 && (
                  <button 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#86c76b',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#f0f2f5'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                    onClick={readAll}
                  >
                    Read All
                  </button>
                )}
                <button 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#86c76b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f0f2f5'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                  onClick={clearAll}
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '5px'
            }}>
              {notifications.length === 0 ? (
                <p style={{
                  textAlign: 'center',
                  color: '#666',
                  padding: '20px',
                  margin: '0',
                  fontSize: '14px'
                }}>
                  No notifications
                </p>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      background: notif.read ? 'transparent' : '#f0f8ff'
                    }}
                    onClick={() => markAsRead(notif.id)}
                    onMouseOver={(e) => e.target.style.background = '#f8fff4'}
                    onMouseOut={(e) => e.target.style.background = notif.read ? 'transparent' : '#f0f8ff'}
                  >
                    <span>{notif.emoji}</span>
                    <div style={{ flex: '1', fontSize: '14px' }}>
                      <strong>{notif.person}</strong> {notif.action}
                      <span style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '2px'
                      }}>
                        {notif.time}
                      </span>
                    </div>
                    {!notif.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#86c76b',
                        marginTop: '5px'
                      }}></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification;
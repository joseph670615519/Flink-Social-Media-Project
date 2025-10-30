import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Helper functions
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getNotificationIcon = (type) => {
  switch(type) {
    case 'like': return '❤️';
    case 'comment': return '💬';
    case 'follow': return '👤';
    case 'friend_request': return '🤝';
    case 'message': return '📩';
    case 'video_call': return '📹';
    default: return '🔔';
  }
};

// Helper function to create notifications (export for use in other components)  
export const createNotification = async (recipientId, senderId, senderName, type, message, relatedId = null) => {
  console.log('Creating notification:', { recipientId, senderId, senderName, type, message, relatedId });
  
  try {
    const notificationData = {
      recipientId: recipientId,
      senderId: senderId,
      senderName: senderName,
      type: type,
      message: message,
      relatedId: relatedId,
      read: false,
      deleted: false,
      createdAt: serverTimestamp()
    };
    
    console.log('Notification data to be created:', notificationData);
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification created with ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const notificationRef = useRef(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  // Real-time notifications listener
  useEffect(() => {
    if (!currentUser) {
      console.log('No user logged in, skipping notifications');
      return;
    }

    console.log('Setting up notifications listener for user:', currentUser.uid);

    // Try simple query first (without orderBy to avoid index issues)
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      console.log('Notifications snapshot received, count:', snapshot.docs.length);
      
      const notificationList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Notification data:', data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        };
      });
      
      console.log('Processed notifications:', notificationList);
      setNotifications(notificationList);
    });

    return () => unsubscribe();
  }, [currentUser]); 
  
  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const readAll = async () => {
    try {
      const batch = notifications.filter(n => !n.read);
      const promises = batch.map(notif => 
        updateDoc(doc(db, 'notifications', notif.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      const promises = notifications.map(notif => 
        updateDoc(doc(db, 'notifications', notif.id), { deleted: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
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
                  <span style={{ fontSize: '16px', marginTop: '2px' }}>{getNotificationIcon(notif.type)}</span>
                  <div style={{ flex: '1', fontSize: '14px', lineHeight: '1.4' }}>
                    <strong>{notif.senderName}</strong> {notif.message}
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      {notif.createdAt ? formatTimeAgo(notif.createdAt) : 'Just now'}
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
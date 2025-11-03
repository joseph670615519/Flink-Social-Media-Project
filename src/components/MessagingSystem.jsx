import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createNotification } from './Notification';
import avatarImg from '../assets/FlinkAva.png';

const MessagingSystem = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const messagingRef = useRef(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for external messaging requests
  useEffect(() => {
    const handleOpenMessaging = (event) => {
      const { userId } = event.detail;
      setShowMessaging(true);
      if (userId) {
        startNewConversation(userId);
      }
    };

    window.addEventListener('openMessaging', handleOpenMessaging);
    return () => window.removeEventListener('openMessaging', handleOpenMessaging);
  }, []);

  // Load all users for messaging (not just friends)
  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser) return;
      
      try {
        // Load both friends and all users for messaging
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUser.uid) // Exclude current user
          .slice(0, 20); // Limit for performance
        
        setFriends(allUsers);
      } catch (error) {
        console.error('Error loading users for messaging:', error);
      }
    };

    loadUsers();
  }, [currentUser]);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      const conversationList = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const otherParticipant = data.participants.find(id => id !== currentUser.uid);
          
          // Get other participant info
          const userDoc = await getDoc(doc(db, 'users', otherParticipant));
          const participantData = userDoc.exists() ? userDoc.data() : {};
          
          return {
            id: docSnapshot.id,
            ...data,
            otherParticipant: {
              id: otherParticipant,
              name: participantData.displayName || participantData.email || 'Unknown',
              avatar: participantData.photoURL || avatarImg
            },
            lastMessageTime: data.lastMessageTime?.toDate()
          };
        })
      );
      
      // Sort by last message time
      conversationList.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      setConversations(conversationList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'conversations', activeConversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [activeConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messagingRef.current && !messagingRef.current.contains(event.target)) {
        setShowMessaging(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startNewConversation = async (friendId) => {
    try {
      setLoading(true);
      
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participants.includes(friendId)
      );
      
      if (existingConv) {
        setActiveConversation(existingConv);
        return;
      }

      // Create new conversation
      const conversationData = {
        participants: [currentUser.uid, friendId],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      
      // The conversation will be automatically added through the listener
      // Just wait a moment for it to appear
      setTimeout(() => {
        const newConv = conversations.find(conv => conv.id === docRef.id);
        if (newConv) setActiveConversation(newConv);
      }, 500);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser) {
      console.log('Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasConversation: !!activeConversation, 
        hasUser: !!currentUser 
      });
      return;
    }

    try {
      console.log('Sending message:', newMessage.trim(), 'to conversation:', activeConversation.id);
      
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp()
      };

      // Add message to conversation
      await addDoc(
        collection(db, 'conversations', activeConversation.id, 'messages'),
        messageData
      );

      console.log('Message sent successfully!');

      // Update conversation's last message
      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp()
      });

      // Create notification for recipient
      await createNotification(
        activeConversation.otherParticipant.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        'message',
        'sent you a message',
        activeConversation.id
      );

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(messageDate);
    }
    return messageDate.toLocaleDateString();
  };

  const startVideoCall = async (participantId) => {
    try {
      // Create a video call notification
      await createNotification(
        participantId,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        'video_call',
        'started a video call'
      );

      // Open custom video call interface
      const callLink = 'https://tuyet-presystolic-jillian.ngrok-free.dev/';
      const callWindow = window.open(
        callLink,
        'videoCall',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (callWindow) {
        // Send the call link via message
        const messageData = {
          text: `📹 Video Call: ${callLink}`,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email,
          createdAt: serverTimestamp(),
          type: 'video_call'
        };

        await addDoc(
          collection(db, 'conversations', activeConversation.id, 'messages'),
          messageData
        );

        await updateDoc(doc(db, 'conversations', activeConversation.id), {
          lastMessage: 'Video call started',
          lastMessageTime: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={messagingRef}>
      <button
        onClick={() => setShowMessaging(!showMessaging)}
        onMouseOver={(e) => e.target.style.background = '#e4e6eb'}
        onMouseOut={(e) => e.target.style.background = '#f0f2f5'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          background: '#f0f2f5',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          transition: 'background-color 0.2s'
        }}
      >
        <img 
          src="https://cdn-icons-png.flaticon.com/512/134/134718.png" 
          alt="Messages"
          style={{ 
            width: '20px', 
            height: '20px'
          }}
        />
      </button>

      {showMessaging && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '400px',
          height: '500px',
          background: '#f8f9fa',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          border: '2px solid #e9ecef',
          zIndex: 1000,
          marginTop: '5px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '2px solid #dee2e6',
            fontWeight: 'bold',
            fontSize: '16px',
            background: 'white',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px'
          }}>
            {activeConversation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setActiveConversation(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ←
                </button>
                <img
                  src={activeConversation.otherParticipant.avatar}
                  alt={activeConversation.otherParticipant.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%'
                  }}
                />
                <span>{activeConversation.otherParticipant.name}</span>
                <button
                  onClick={() => startVideoCall(activeConversation.otherParticipant.id)}
                  style={{
                    marginLeft: 'auto',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  title="Start video call"
                >
                  📹
                </button>
              </div>
            ) : (
              'Messages'
            )}
          </div>

          {/* Content */}
          {!activeConversation ? (
            /* Conversation List */
            <div style={{ flex: 1, overflow: 'auto' }}>
              {/* New Conversation Section */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  Start New Chat
                </h5>
                
                {/* Search Users */}
                <div style={{ marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Search users to chat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '20px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {/* Users List */}
                {friends.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {friends
                      .filter(friend => 
                        !searchTerm || 
                        (friend.displayName && friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (friend.email && friend.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .slice(0, 8).map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => startNewConversation(friend.id)}
                        disabled={loading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          background: '#f0f2f5',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <img
                          src={friend.photoURL || avatarImg}
                          alt={friend.displayName}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%'
                          }}
                        />
                        {friend.displayName || friend.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing Conversations */}
              {conversations.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                  <h3 style={{ margin: '0 0 8px 0' }}>No messages yet</h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Start a conversation with your friends
                  </p>
                </div>
              ) : (
                conversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e9ecef',
                      transition: 'background-color 0.2s',
                      background: 'white',
                      margin: '2px 8px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <img
                      src={conversation.otherParticipant.avatar}
                      alt={conversation.otherParticipant.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginBottom: '4px',
                        color: '#000'
                      }}>
                        {conversation.otherParticipant.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conversation.lastMessage || 'Start chatting...'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#999'
                    }}>
                      {formatDate(conversation.lastMessageTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Messages */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.senderId === currentUser.uid ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: '18px',
                      background: message.senderId === currentUser.uid ? '#0084ff' : '#f0f2f5',
                      color: message.senderId === currentUser.uid ? 'white' : 'black',
                      fontSize: '14px',
                      wordWrap: 'break-word'
                    }}>
                      <div>{message.text}</div>
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        marginTop: '4px'
                      }}>
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #eee',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    background: '#0084ff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: newMessage.trim() ? 1 : 0.5
                  }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;
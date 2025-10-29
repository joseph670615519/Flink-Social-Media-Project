import React, { useState, useEffect, useRef } from 'react';
import { 
    getOrCreateConversation, 
    sendMessage,
    subscribeToConversationMessages 
} from '../services/messagesService';
import { createNotification } from '../services/notificationService';
import { Phone, Send, ArrowLeft } from 'lucide-react';
import './Chat.css';

const Chat = ({ user, friend, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && friend) {
      const initChat = async () => {
        try {
          const convId = await getOrCreateConversation(user.uid, friend.id || friend.uid);
          setConversationId(convId);
        } catch (error) {
          console.error('Error creating conversation:', error);
        }
      };
      initChat();
    }
  }, [user, friend]);

  useEffect(() => {
    if (conversationId) {
      const unsubscribe = subscribeToConversationMessages(conversationId, setMessages);
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    setLoading(true);
    try {
      await sendMessage(
        conversationId,
        user.uid,
        user.displayName || user.email,
        user.photoURL || '',
        newMessage
      );
      
      // สร้าง notification เมื่อมีข้อความใหม่
      if (friend && friend.id) {
        try {
          await createNotification(friend.id, 'message', {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: user.photoURL || '',
            message: newMessage,
            conversationId: conversationId
          });
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    window.open('https://tuyet-presystolic-jillian.ngrok-free.dev', '_blank');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="friend-info">
          <img 
            src={friend.photoURL || '/default-avatar.png'} 
            alt={friend.displayName}
            className="friend-avatar"
          />
          <span className="friend-name">{friend.displayName || friend.name}</span>
        </div>
        <button className="call-button" onClick={handleCall}>
          <Phone size={20} />
        </button>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.senderId === user.uid ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">
                  {message.createdAt?.toDate?.()?.toLocaleTimeString() || 'just now'}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          className="message-input"
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={loading || !newMessage.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
import React, { useState, useEffect } from 'react';
import { 
    getOrCreateConversation, 
    getConversationMessages, 
    sendMessage,
    subscribeToConversationMessages 
} from '../services/messagesService';
import './Chat.css';

const Chat = ({ user, targetUserId, targetUserName, targetUserAvatar }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);

    useEffect(() => {
        if (user && targetUserId) {
            const initChat = async () => {
                try {
                    // Get or create conversation
                    const convId = await getOrCreateConversation(user.uid, targetUserId);
                    setConversationId(convId);

                    // Subscribe to real-time messages
                    const unsubscribe = subscribeToConversationMessages(convId, setMessages);
                    return unsubscribe;
                } catch (error) {
                    console.error('Error initializing chat:', error);
                }
            };

            const unsubscribe = initChat();
            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        }
    }, [user, targetUserId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!messageText.trim() || !conversationId) return;

        setLoading(true);
        try {
            await sendMessage(
                conversationId,
                user.uid,
                user.displayName || user.email,
                user.photoURL || '',
                messageText
            );
            setMessageText('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <img src={targetUserAvatar} alt={targetUserName} className="chat-avatar" />
                <div className="chat-header-info">
                    <h3>{targetUserName}</h3>
                    <span className="online-status">Online</span>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                        >
                            <img src={msg.senderAvatar} alt={msg.senderName} className="message-avatar" />
                            <div className="message-content">
                                <span className="message-sender">{msg.senderName}</span>
                                <div className="message-text">{msg.text}</div>
                                <span className="message-time">
                                    {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={loading}
                    className="message-input"
                />
                <button 
                    type="submit" 
                    disabled={loading || !messageText.trim()}
                    className="send-button"
                >
                    {loading ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default Chat;

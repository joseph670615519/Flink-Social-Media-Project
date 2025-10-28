import { useState, useEffect } from 'react';

function ChatWindow({ selectedFriend, setShowProfile, showProfile }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sendingStatus, setSendingStatus] = useState('');

  useEffect(() => {
    if (selectedFriend) {
      setMessages([
        { id: 1, text: 'Hey! How are you doing?', from: 'them', timestamp: new Date(Date.now() - 3600000), status: 'read' },
        { id: 2, text: 'I am good! Thanks for asking 😊', from: 'me', timestamp: new Date(Date.now() - 3500000), status: 'read' },
        { id: 3, text: 'Want to grab lunch today?', from: 'them', timestamp: new Date(Date.now() - 3400000), status: 'read' },
        { id: 4, text: 'Sure! What time works for you?', from: 'me', timestamp: new Date(Date.now() - 300000), status: 'sent' },
      ]);
    }
  }, [selectedFriend]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = { id: messages.length + 1, text: inputText, from: 'me', timestamp: new Date(), status: 'sending' };
    setMessages([...messages, newMessage]);
    setInputText('');
    setSendingStatus('sending');

    setTimeout(() => {
      setMessages(prev => prev.map(msg => msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg));
      setSendingStatus('sent');
      setTimeout(() => setSendingStatus(''), 2000);
    }, 1000);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') sendMessage(); };

  const shouldShowTimestamp = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    return currentMsg.timestamp - previousMsg.timestamp > 10 * 60 * 1000;
  };

  const formatTimestamp = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (!selectedFriend) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h2>Select a conversation</h2>
          <p>Choose a friend from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            <span>{selectedFriend.profilePic}</span>
            {selectedFriend.online && <span className="online-dot"></span>}
          </div>
          <div>
            <div className="header-name">{selectedFriend.name}</div>
            <div className="header-status">{selectedFriend.online ? 'Active now' : 'Offline'}</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-button" title="Voice Call">📞</button>
          <button className="icon-button" title="Video Call">📹</button>
          <button className="icon-button" title="Conversation Information" onClick={() => setShowProfile(!showProfile)}>ℹ️</button>
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={msg.id}>
            {shouldShowTimestamp(msg, messages[index - 1]) && <div className="timestamp-divider">{formatTimestamp(msg.timestamp)}</div>}
            <div className={`message-wrapper ${msg.from}`}>
              <div className={`message ${msg.from}`}>{msg.text}</div>
              {msg.from === 'me' && msg.status && <div className="message-status">{msg.status === 'sending' ? '⏳ Sending...' : msg.status === 'sent' ? '✓ Sent' : '✓✓ Read'}</div>}
            </div>
          </div>
        ))}
        {sendingStatus && <div className="sending-indicator">{sendingStatus === 'sending' ? 'Sending...' : 'Sent!'}</div>}
      </div>
      <div className="chat-input">
        <button className="icon-button">➕</button>
        <button className="icon-button">📷</button>
        <input type="text" placeholder="Aa" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} />
        <button className="icon-button">😊</button>
        <button className="send-button" onClick={sendMessage} disabled={!inputText.trim()}>➤</button>
      </div>
    </div>
  );
}

export default ChatWindow;

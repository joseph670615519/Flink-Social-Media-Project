import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase.js';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, updateDoc
} from "firebase/firestore";

function ChatWindow({ selectedFriend, setShowProfile, showProfile }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // ===== Load messages from Firestore =====
  useEffect(() => {
    if (!selectedFriend || !auth.currentUser) return;

    const chatId = [auth.currentUser.uid, selectedFriend.uid].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    // 🔄 Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedFriend]);

  // ===== Auto-scroll when new messages come =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== Mark messages as READ when user views chat =====
  useEffect(() => {
    if (!selectedFriend || !auth.currentUser) return;
    const chatId = [auth.currentUser.uid, selectedFriend.uid].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");

    const markAsRead = async () => {
      const unreadMsgs = messages.filter(
        msg => msg.sender === selectedFriend.uid && msg.status !== 'read'
      );

      // 🔁 Update each unread message to "read"
      for (const msg of unreadMsgs) {
        const msgRef = doc(messagesRef, msg.id);
        await updateDoc(msgRef, { status: 'read' });
      }
    };

    markAsRead();
  }, [messages, selectedFriend]);

  // ===== Send message =====
  const sendMessage = async () => {
    if (!inputText.trim() || !selectedFriend || !auth.currentUser) return;

    const chatId = [auth.currentUser.uid, selectedFriend.uid].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");

    // 🕓 Temporary message (local display)
    const tempMessage = {
      id: Date.now().toString(),
      sender: auth.currentUser.uid,
      text: inputText,
      timestamp: new Date(),
      status: 'sending'
    };
    setMessages(prev => [...prev, tempMessage]);
    setInputText('');

    // ✅ Ensure chat document exists
    const chatDocRef = doc(db, "chats", chatId);
    await setDoc(chatDocRef, {
      participants: [auth.currentUser.uid, selectedFriend.uid],
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 🚀 Add real message to Firestore
    const docRef = await addDoc(messagesRef, {
      sender: auth.currentUser.uid,
      text: tempMessage.text,
      timestamp: serverTimestamp(),
      status: 'sent'
    });

    // ✅ Replace temp message with Firestore one
    setMessages(prev =>
      prev.map(msg =>
        msg.id === tempMessage.id ? { ...msg, id: docRef.id, status: 'sent' } : msg
      )
    );
  };

  // ===== Enter to send =====
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const shouldShowTimestamp = (currentMsg, previousMsg) => {
    if (!previousMsg || !currentMsg.timestamp) return true;
    const currentTime = currentMsg.timestamp.toDate ? currentMsg.timestamp.toDate() : currentMsg.timestamp;
    const prevTime = previousMsg.timestamp.toDate ? previousMsg.timestamp.toDate() : previousMsg.timestamp;
    return currentTime - prevTime > 10 * 60 * 1000;
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

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
      {/* ===== Header ===== */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            <span>{selectedFriend.profilePic}</span>
            {selectedFriend.online && <span className="online-dot"></span>}
          </div>
          <div>
            <div className="header-name">{selectedFriend.name}</div>
            <div className="header-status">
              {selectedFriend.online ? 'Active now' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-button" title="Voice Call">📞</button>
          <button className="icon-button" title="Video Call">📹</button>
          <button
            className="icon-button"
            title="Conversation Information"
            onClick={() => setShowProfile(!showProfile)}
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* ===== Messages ===== */}
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={msg.id}>
            {shouldShowTimestamp(msg, messages[index - 1]) && msg.timestamp && (
              <div className="timestamp-divider">{formatTimestamp(msg.timestamp)}</div>
            )}
            <div className={`message-wrapper ${msg.sender === auth.currentUser.uid ? 'me' : 'them'}`}>
              <div className={`message ${msg.sender === auth.currentUser.uid ? 'me' : 'them'}`}>
                {msg.text}
              </div>

              {/* 👇 Status below the bubble */}
              {msg.sender === auth.currentUser.uid && (
                <div className="message-status">
                  {msg.status === 'sending' && '⏳ Sending...'}
                  {msg.status === 'sent' && '✓ Sent'}
                  {msg.status === 'read' && '✓✓ Read'}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* ===== Input ===== */}
      <div className="chat-input">
        <button className="icon-button">➕</button>
        <button className="icon-button">📷</button>
        <input
          type="text"
          placeholder="Aa"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="icon-button">😊</button>
        <button className="send-button" onClick={sendMessage} disabled={!inputText.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;

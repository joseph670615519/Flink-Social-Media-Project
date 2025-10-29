import { useState, useEffect } from 'react';
import Sidebar from './Components/Sidebar';
import ChatWindow from './Components/ChatWindow';
import ProfilePanel from './Components/ProfilePanel';
import './index.css';
import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "firebase/auth";


signInWithEmailAndPassword(auth, "friendstesting1@gmail.com", "123456")
  .then(() => {
    console.log("✅ Logged in as Tester1");
  })
  .catch(err => console.error("❌ Login failed:", err));


function App() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="messenger">
      <Sidebar 
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
        setShowProfile={setShowProfile}
      />
      <ChatWindow 
        selectedFriend={selectedFriend}
        setShowProfile={setShowProfile}
        showProfile={showProfile}
      />
      {(windowWidth > 768 || showProfile) && selectedFriend && (
        <ProfilePanel 
          friend={selectedFriend}
          setShowProfile={setShowProfile}
          windowWidth={windowWidth}
        />
      )}
    </div>
  );
}

export default App;

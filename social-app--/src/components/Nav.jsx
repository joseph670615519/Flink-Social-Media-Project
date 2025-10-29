import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import { Home, Users, MessageCircle, Phone } from 'lucide-react';
import avatarImg from '../assets/FlinkAva.png';
import NotificationCenter from './NotificationCenter';
import './Nav.css';

const Nav = ({ user }) => {
  const [tweets] = useContext(TweetContext);

  const handleCall = () => {
    // เปิดหน้าต่างใหม่ไปยัง ngrok URL ของคุณ
    window.open('https://tuyet-presystolic-jillian.ngrok-free.dev', '_blank');
  };

  return (
    <div className="nav-container">
      <div className="nav-header">
        <h2 className="app-title">Flink</h2>
        {user && <NotificationCenter userId={user.uid} />}
      </div>
      
      {/* Profile Section */}
      <Link to="/me" className="profile-section">
        <img src={user?.photoURL || avatarImg} alt="Profile" className="avatar" />
        <div className="profile-info">
          <h3>{user?.displayName || (user ? user.email : 'Profile')}</h3>
          <p>{tweets?.length ?? 0} โพสต์</p>
        </div>
      </Link>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        <Link to="/" className="nav-item">
          <Home size={24} />
          <span>หน้าหลัก</span>
        </Link>
        
        <Link to="/posts" className="nav-item">
          <MessageCircle size={24} />
          <span>โพสต์</span>
        </Link>
        
        <Link to="/friends" className="nav-item">
          <Users size={24} />
          <span>เพื่อน</span>
        </Link>
        
        <button className="nav-item call-item" onClick={handleCall}>
          <Phone size={24} />
          <span>Video Call</span>
        </button>
      </nav>
    </div>
  );
};

export default Nav;
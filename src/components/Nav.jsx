import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import { auth, ADMIN_EMAILS } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import avatarImg from '../assets/FlinkAva.png';

const Nav = ({ user }) => {
  const { tweets } = useContext(TweetContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    checkAdminRole();
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData) {
        console.log('📸 Loading Nav profile photo from Firestore');
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error loading user profile for nav:', error);
    }
  };

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Check if user is admin
      const isUserAdmin = 
        userData?.role === 'admin' || 
        userData?.isAdmin === true || 
        ADMIN_EMAILS.includes(user.email);
      
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  return (
    <div className="nav-container"> 
      <Link to="/me" className="profile-section" style={{ textDecoration: 'none', color: 'inherit' }}>
        <img 
          src={userProfile?.photoURL || user?.photoURL || avatarImg} 
          alt="Profile" 
          className="avatar" 
        />
        <h3>{userProfile?.displayName || user?.displayName || (user ? user.email : 'Profile')}</h3>
      </Link>

      <div className="nav-menu">
        <Link to="/feed" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/friends" className="nav-item">
          <span className="nav-icon">👥</span>
          <span>Friends</span>
        </Link>
      </div>
      <p>Number of posts: {tweets?.length ?? 0}</p>
    </div>
  );
};

export default Nav;
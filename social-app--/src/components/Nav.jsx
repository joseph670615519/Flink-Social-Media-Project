import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva.png';

const Nav = ({ user }) => {
  const { tweets } = useContext(TweetContext);

  return (
    <div className="nav-container"> 
      <Link to="/me" className="profile-section" style={{ textDecoration: 'none', color: 'inherit' }}>
        <img src={user?.photoURL || avatarImg} alt="Profile" className="avatar" />
        <h3>{user?.displayName || (user ? user.email : 'Profile')}</h3>
      </Link>

      <p>Number of tweets: {tweets?.length ?? 0}</p>
    </div>
  );
};

export default Nav;
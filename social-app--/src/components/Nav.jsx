import React, { useContext } from 'react';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva_.png';

const Nav = () => {
    const [tweets] = useContext(TweetContext);
    return (
        <div className="nav-container">
            <div className="profile-section">
                <img
                    src={avatarImg}
                    alt="Profile"
                    className="avatar"
                />
                <h3>Profile: Unknown</h3>
            </div>
            <p>Number of tweets: {tweets.length}</p>
        </div>
    );
}

export default Nav;
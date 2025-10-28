import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva.png';

export default function UserProfile() {
  const { userId } = useParams();
  const [tweets = []] = useContext(TweetContext) || [];
  const [userData, setUserData] = useState(null);

  useEffect(() => {
   
    const user = {
      id: userId,
      displayName: `User ${userId?.substring(0, 8)}` || 'User',
      email: `${userId}@example.com` || '',
      photoURL: avatarImg,
      bio: 'This user prefers to keep an air of mystery about them.',
      joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
    
    setUserData(user);
  }, [userId]);

  if (!userData) {
    return <div className="main-content">Loading profile...</div>;
  }

  const userTweets = tweets.filter(t => t.userId === userId);
  const friendsCount = 0; 

  return (
    <div className="profile-page">
      <div className="profile-header">
        {/* Simple cover for other users */}
        <div className="cover-photo-container" style={{ 
          background: 'linear-gradient(135deg, #86c76b, #6bbf4e)',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          <span>{userData.displayName}'s Profile</span>
        </div>
        
        <div className="profile-info-section">
          <img 
            src={userData.photoURL || avatarImg} 
            alt={userData.displayName} 
            className="profile-picture" 
          />
          <div className="profile-details">
            <h1>{userData.displayName}</h1>
            {userData.email && <p className="profile-email">{userData.email}</p>}
            <p className="profile-bio" style={{ marginBottom: '1rem', color: '#666' }}>
              {userData.bio}
            </p>
            <div className="profile-actions">
              <button className="primary-btn">Add Friend</button>
              <button className="secondary-btn">Message</button>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat">
            <strong>{userTweets.length}</strong>
            <span>Posts</span>
          </div>
          <div className="stat">
            <strong>{friendsCount}</strong>
            <span>Friends</span>
          </div>
          <div className="stat">
            <strong>0</strong>
            <span>Photos</span>
          </div>
        </div>
      </div>

      <section className="profile-posts">
        <h2>{userData.displayName}'s Posts</h2>
        {userTweets.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>{userData.displayName} hasn't posted anything yet.</p>
          </div>
        ) : (
          userTweets.map(t => (
            <div key={t.id} className="profile-post-card">
              <div className="post-header">
                <img 
                  src={userData.photoURL || avatarImg} 
                  alt={userData.displayName} 
                  className="post-avatar" 
                />
                <div>
                  <strong>{userData.displayName}</strong>
                  <div className="post-meta" style={{ fontSize: '0.85rem', color: '#666' }}>
                    {t.date || 'Just now'}
                  </div>
                </div>
              </div>
              <h3 style={{ margin: '8px 0' }}>{t.title}</h3>
              <p>{t.message}</p>
              <div style={{ marginTop: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
                ❤️ {t.likes || 0} likes
              </div>
            </div>
          ))
        )}
      </section>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/feed" style={{ color: '#86c76b', textDecoration: 'none' }}>
          ← Back to Feed
        </Link>
      </div>
    </div>
  );
}
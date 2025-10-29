import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva.png';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Profile({ user }) {
  const [tweets = []] = useContext(TweetContext) || [];
  const [activeTab, setActiveTab] = useState('posts');

  const handleLogout = async () => {
  const confirmLogout = window.confirm('Are you sure you want to log out?');
  if (confirmLogout) {
    try {
      await signOut(auth);
      console.log('User logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  }
};
  
  const displayName = user?.displayName || 'New User';
  const email = user?.email || '';
  const avatar = user?.photoURL || avatarImg;
  
  const userData = {
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    bio: 'Welcome to my profile! I just joined Flink.',
  };

  const currentUserId = user?.uid || 'current-user';
  const myTweets = tweets.filter(t => t.userId === currentUserId);
  
  const friends = [];

  const photos = [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="posts-tab">
            {myTweets.length === 0 ? (
              <div className="empty-state">
                <h3>No posts yet</h3>
                <p>Share your first post to get started!</p>
                <Link to="/feed" className="primary-btn">Create Post</Link>
              </div>
            ) : (
              myTweets.map(tweet => (
                <div key={tweet.id} className="profile-post-card">
                  <div className="post-header">
                    <img src={avatar} alt={displayName} className="post-avatar" />
                    <div>
                      <strong>{displayName}</strong>
                      <div className="post-meta">{tweet.date || 'Just now'}</div>
                    </div>
                  </div>
                  <h3>{tweet.title}</h3>
                  <p>{tweet.message}</p>
                  <div className="post-actions">
                    <button className="action-btn">❤️ {tweet.likes || 0}</button>
                    <button className="action-btn">💬 Comment</button>
                    <button className="action-btn">↪️ Share</button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      
      case 'about':
        return (
          <div className="about-tab">
            <div className="about-section">
              <h3>Overview</h3>
              <div className="about-grid">
                <div className="about-item">
                  <span className="about-label">Joined </span>
                  <span className="about-value">{userData.joinDate}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Email </span>
                  <span className="about-value">{email}</span>
                </div>
              </div>
            </div>
            
            <div className="about-section">
              <h3>Bio</h3>
              <p style={{ color: '#666', lineHeight: '1.5', margin: 0 }}>
                {userData.bio}
              </p>
            </div>
          </div>
        );
      
      case 'friends':
        return (
          <div className="friends-tab">
            <div className="section-header">
              <h3>Friends ({friends.length})</h3>
            </div>
            {friends.length === 0 ? (
              <div className="empty-state">
                <h3>No friends yet</h3>
                <p>Start connecting with people to see them here!</p>
                <Link to="/feed" className="primary-btn">Find Friends</Link>
              </div>
            ) : (
              <div className="friends-grid">
                {friends.map(friend => (
                  <div key={friend.id} className="friend-card">
                    <img src={friend.avatar} alt={friend.name} className="friend-photo" />
                    <div className="friend-info">
                      <span className="friend-name">{friend.name}</span>
                    </div>
                    <button className="friend-action-btn">Message</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'photos':
        return (
          <div className="photos-tab">
            <div className="section-header">
              <h3>Photos ({photos.length})</h3>
            </div>
            {photos.length === 0 ? (
              <div className="empty-state">
                <h3>No photos yet</h3>
                <p>Upload photos to share them with your friends!</p>
                <button className="primary-btn">Upload Photo</button>
              </div>
            ) : (
              <div className="photos-grid">
                {photos.map(photo => (
                  <div key={photo.id} className="photo-item">
                    <img src={photo.url} alt={photo.alt} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return <div className="posts-tab">Select a tab to view content</div>;
    }
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
       
        <div className="cover-photo-container" style={{ 
          background: 'linear-gradient(135deg, #86c76b, #6bbf4e)',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          <span>{displayName}'s Profile</span>
        </div>
        
        {/* Profile Info */}
        <div className="profile-info-section">
          <div className="profile-picture-container">
            <img src={avatar} alt={displayName} className="profile-picture" />
            <button className="edit-picture-btn">✎</button>
          </div>
          
          <div className="profile-details">
            <h1>{displayName}</h1>
            <p className="friend-count">{friends.length} friends</p>
            <p className="profile-bio" style={{ marginBottom: '1rem', color: '#666' }}>
              {userData.bio}
            </p>
            <div className="profile-actions">
              <button className="primary-btn">Edit Profile</button>
              <button className="secondary-btn">Share Profile</button>
              <button onClick={handleLogout} 
              className="secondary-btn" style={{background:'#ff6b6b',color: 'white', border: '1px solid #ff6b6b'}}>Logout
              </button>
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="profile-stats">
          <div className="stat">
            <strong>{myTweets.length}</strong>
            <span>Posts</span>
          </div>
          <div className="stat">
            <strong>{friends.length}</strong>
            <span>Friends</span>
          </div>
          <div className="stat">
            <strong>0</strong>
            <span>Photos</span>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button 
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button 
          className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photos
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Back to feed */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/feed" style={{ color: '#86c76b', textDecoration: 'none' }}>
          ← Back to Feed
        </Link>
      </div>
    </div>
  );
}
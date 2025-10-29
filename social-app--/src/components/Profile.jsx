import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva.png';

export default function Profile({ user }) {
  const [tweets = []] = useContext(TweetContext) || [];
  const [activeTab, setActiveTab] = useState('posts');
  
  const displayName = user?.displayName || 'Your Name';
  const email = user?.email || '';
  const avatar = user?.photoURL || avatarImg;
  
  // Fake user data
  const userData = {
    work: 'Software Developer at Tech Co',
    education: 'University of Example',
    location: 'New York, NY',
    joinDate: 'January 2024',
    relationship: 'Single',
    birthday: 'January 1, 1990',
    hometown: 'Boston, MA',
    website: 'https://example.com',
    bio: 'Love sharing my thoughts and connecting with friends! 🌟 Always up for a good conversation and making new connections.',
    coverPhoto: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  };

  const currentUserId = user?.uid || 'current-user';
  const myTweets = tweets.filter(t => t.userId === currentUserId);
  
  // Fake friends data
  const friends = [
    { id: 1, name: 'Alice Johnson', avatar: avatarImg, mutual: 15 },
    { id: 2, name: 'Bob Smith', avatar: avatarImg, mutual: 8 },
    { id: 3, name: 'Carol Williams', avatar: avatarImg, mutual: 12 },
    { id: 4, name: 'David Brown', avatar: avatarImg, mutual: 6 },
    { id: 5, name: 'Emma Davis', avatar: avatarImg, mutual: 20 },
    { id: 6, name: 'Frank Miller', avatar: avatarImg, mutual: 3 }
  ];

  // Mock photos data
  const photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=200&h=200&fit=crop', alt: 'Photo 1' },
    { id: 2, url: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?w=200&h=200&fit=crop', alt: 'Photo 2' },
    { id: 3, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', alt: 'Photo 3' },
    { id: 4, url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop', alt: 'Photo 4' },
    { id: 5, url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop', alt: 'Photo 5' },
    { id: 6, url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', alt: 'Photo 6' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="posts-tab">
            {myTweets.length === 0 ? (
              <div className="empty-state">
                <h3>No posts yet</h3>
                <p>Share your first post to get started!</p>
                <Link to="/" className="primary-btn">Create Post</Link>
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
                  <span className="about-label">Work</span>
                  <span className="about-value">{userData.work}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Education</span>
                  <span className="about-value">{userData.education}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Location</span>
                  <span className="about-value">{userData.location}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Relationship</span>
                  <span className="about-value">{userData.relationship}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Joined</span>
                  <span className="about-value">{userData.joinDate}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Birthday</span>
                  <span className="about-value">{userData.birthday}</span>
                </div>
              </div>
            </div>
            
            <div className="about-section">
              <h3>Contact Information</h3>
              <div className="about-grid">
                <div className="about-item">
                  <span className="about-label">Email</span>
                  <span className="about-value">{email}</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Website</span>
                  <a href={userData.website} className="about-link">{userData.website}</a>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'friends':
        return (
          <div className="friends-tab">
            <div className="section-header">
              <h3>Friends ({friends.length})</h3>
              <button className="see-all-btn">See All Friends</button>
            </div>
            <div className="friends-grid">
              {friends.map(friend => (
                <div key={friend.id} className="friend-card">
                  <img src={friend.avatar} alt={friend.name} className="friend-photo" />
                  <div className="friend-info">
                    <span className="friend-name">{friend.name}</span>
                    <span className="mutual-friends">{friend.mutual} mutual friends</span>
                  </div>
                  <button className="friend-action-btn">Add Friend</button>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return <div className="posts-tab">Select a tab to view content</div>;
    }
  };

  return (
    <div className="profile-page">
      {/* Photo */}
      <div className="profile-header">
        <div className="cover-photo-container">
          <img 
            src={userData.coverPhoto} 
            alt="Cover" 
            className="cover-photo"
          />
          <button className="edit-cover-btn">✎ Edit Cover Photo</button>
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
            <div className="profile-actions">
              <button className="primary-btn">+ Add to Story</button>
              <button className="secondary-btn">✎ Edit Profile</button>
              <button className="secondary-btn">⋯</button>
            </div>
          </div>
        </div>

        {/* Profiles */}
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
            <strong>1.2K</strong>
            <span>Likes</span>
          </div>
        </div>
      </div>

      {/* Move tabs */}
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
        <button className="tab">Videos</button>
        <button className="tab">More ⋯</button>
      </div>

      {/* content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Back to the feed */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/" style={{ color: '#86c76b', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
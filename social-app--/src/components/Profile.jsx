import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva.png';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile({ user }) {
  const { tweets, setTweets } = useContext(TweetContext);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    displayName: '',
    bio: '',
    photoURL: ''
  });
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setEditedUser({
              displayName: user.displayName || '',
              bio: data.bio || 'Welcome to my profile! I just joined Flink.',
              photoURL: user.photoURL || ''
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      try {
        await signOut(auth);
        window.location.href = '/login';
      } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    
    try {

      const imageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}_${file.name}`);
      
      const snapshot = await uploadBytes(imageRef, file);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the edited user state with new photo URL
      setEditedUser(prev => ({...prev, photoURL: downloadURL}));
      
      console.log('Image uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedUser.displayName.trim()) {
      alert('Display name is required');
      return;
    }

    setUploading(true);
    
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: editedUser.displayName,
        photoURL: editedUser.photoURL || user.photoURL
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editedUser.displayName,
        bio: editedUser.bio,
        photoURL: editedUser.photoURL || user.photoURL,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUserData(prev => ({
        ...prev,
        displayName: editedUser.displayName,
        bio: editedUser.bio,
        photoURL: editedUser.photoURL
      }));
      
      setIsEditing(false);
      
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const displayName = user?.displayName || 'New User';
  const email = user?.email || '';
  const avatar = editedUser.photoURL || user?.photoURL || avatarImg;
  const bio = userData?.bio || 'Welcome to my profile! I just joined Flink.';
  
  const userJoinDate = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const currentUserId = user?.uid || 'current-user';
  const myTweets = tweets.filter(t => t.userId === currentUserId);
  
  const friends = userData?.friends || [];
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
                  {tweet.imageURL && (
                    <div style={{ marginTop: '1rem' }}>
                      <img 
                        src={tweet.imageURL} 
                        alt="Post attachment"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
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
                  <span className="about-value">{userJoinDate}</span>
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
                {bio}
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
                {friends.map(friendId => (
                  <div key={friendId} className="friend-card">
                    <img src={avatarImg} alt="Friend" className="friend-photo" />
                    <div className="friend-info">
                      <span className="friend-name">User {friendId.substring(0, 8)}</span>
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
                <button 
                  className="primary-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Upload Photo
                </button>
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
          <div className="profile-picture-container" style={{ position: 'relative' }}>
            <img src={avatar} alt={displayName} className="profile-picture" />
            {isEditing && (
              <label 
                htmlFor="profile-picture-upload"
                style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  background: '#86c76b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                title="Change profile picture"
              >
                ✎
              </label>
            )}
          </div>
          
          <div className="profile-details">
            {isEditing ? (
              <input
                type="text"
                value={editedUser.displayName}
                onChange={(e) => setEditedUser({...editedUser, displayName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}
                placeholder="Display Name"
              />
            ) : (
              <h1>{displayName}</h1>
            )}
            <p className="friend-count">{friends.length} friends</p>
            {isEditing ? (
              <textarea
                value={editedUser.bio}
                onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '1rem'
                }}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="profile-bio" style={{ marginBottom: '1rem', color: '#666' }}>
                {bio}
              </p>
            )}
            
            {/* Hidden file input for profile picture */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="profile-picture-upload"
              disabled={uploading}
            />

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveProfile}
                    className="primary-btn"
                    disabled={uploading}
                  >
                    {uploading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="secondary-btn"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="primary-btn" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                  <button className="secondary-btn">Share Profile</button>
                  <button 
                    onClick={handleLogout}
                    className="secondary-btn" 
                    style={{background:'#ff6b6b', color: 'white', border: '1px solid #ff6b6b'}}
                  >
                    Logout
                  </button>
                </>
              )}
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

      {/* Edit Profile Section */}
      {isEditing && (
        <div className="edit-profile-section" style={{
          background: 'var(--card-background)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}>
          <h3>Profile Picture</h3>
          <p style={{ color: '#666', marginBottom: '1rem', fontSize: '14px' }}>
            Click the edit icon on your profile picture to upload a new image
          </p>
          {uploading && (
            <div style={{ 
              padding: '1rem', 
              background: '#f8fff4', 
              borderRadius: '6px',
              border: '1px solid #86c76b',
              marginBottom: '1rem'
            }}>
              Uploading image...
            </div>
          )}
        </div>
      )}

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
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
  const [tweets = []] = useContext(TweetContext) || [];
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    displayName: '',
    bio: '',
    photoURL: '',
    coverPhotoURL: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
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
              photoURL: user.photoURL || '',
              coverPhotoURL: data.coverPhotoURL || ''
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

  const handleImageUpload = async (event, type = 'profile') => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (type === 'profile') {
      setUploading(true);
    } else {
      setUploadingCover(true);
    }
    
    try {
      const path = type === 'profile' 
        ? `profile-pictures/${user.uid}/${Date.now()}_${file.name}`
        : `cover-photos/${user.uid}/${Date.now()}_${file.name}`;
      
      const imageRef = ref(storage, path);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      if (type === 'profile') {
        setEditedUser(prev => ({...prev, photoURL: downloadURL}));
      } else {
        setEditedUser(prev => ({...prev, coverPhotoURL: downloadURL}));
      }
      
      console.log('Image uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      if (type === 'profile') {
        setUploading(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editedUser.displayName.trim()) {
      alert('Display name is required');
      return;
    }

    setUploading(true);
    
    try {
      await updateProfile(auth.currentUser, {
        displayName: editedUser.displayName,
        photoURL: editedUser.photoURL || user.photoURL
      });

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editedUser.displayName,
        bio: editedUser.bio,
        photoURL: editedUser.photoURL || user.photoURL,
        coverPhotoURL: editedUser.coverPhotoURL,
        updatedAt: new Date().toISOString()
      });

      setUserData(prev => ({
        ...prev,
        displayName: editedUser.displayName,
        bio: editedUser.bio,
        photoURL: editedUser.photoURL,
        coverPhotoURL: editedUser.coverPhotoURL
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
  const coverPhoto = editedUser.coverPhotoURL || userData?.coverPhotoURL;
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
      <div className="profile-header">
        <div 
          className="cover-photo-container" 
          style={{ 
            background: coverPhoto 
              ? `url(${coverPhoto}) center/cover`
              : 'linear-gradient(135deg, #86c76b, #6bbf4e)',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            position: 'relative'
          }}
        >
          {!coverPhoto && <span>{displayName}'s Profile</span>}
          
          {isEditing && (
            <label 
              htmlFor="cover-photo-upload"
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Change cover photo"
            >
              {uploadingCover ? '📤 Uploading...' : '📷 Change Cover'}
            </label>
          )}
        </div>
        
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'cover')}
          style={{ display: 'none' }}
          id="cover-photo-upload"
          disabled={uploadingCover}
        />

        <div className="profile-info-section" style={{
          background: 'var(--card-background)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          margin: '0 1rem',
          padding: '1.5rem',
          position: 'relative',
          top: '-60px',
          marginBottom: '-30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
            <div className="profile-picture-container" style={{ position: 'relative' }}>
              <img 
                src={avatar} 
                alt={displayName} 
                className="profile-picture" 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--card-background)'
                }}
              />
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
            
            <div className="profile-details" style={{ flex: 1 }}>
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
                    marginBottom: '1rem'
                  }}
                  placeholder="Display Name"
                />
              ) : (
                <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>{displayName}</h1>
              )}
              
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
                <p className="profile-bio" style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#666',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>
                  {bio}
                </p>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'profile')}
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
                      disabled={uploading || uploadingCover}
                    >
                      {(uploading || uploadingCover) ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="secondary-btn"
                      disabled={uploading || uploadingCover}
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

          <div className="profile-stats" style={{
            display: 'flex',
            justifyContent: 'space-around',
            gap: '1rem',
            padding: '1rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--background-color)',
            marginTop: '1.5rem'
          }}>
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
      </div>

      {isEditing && (
        <div className="edit-profile-section" style={{
          background: 'var(--card-background)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          margin: '1rem',
          marginTop: '0'
        }}>
          <h3>Upload Photos</h3>
          <p style={{ color: '#666', marginBottom: '1rem', fontSize: '14px' }}>
            Click the edit icons to upload profile picture and cover photo
          </p>
          {(uploading || uploadingCover) && (
            <div style={{ 
              padding: '1rem', 
              background: '#f8fff4', 
              borderRadius: '6px',
              border: '1px solid #86c76b',
              marginBottom: '1rem'
            }}>
              {uploading && 'Uploading profile picture...'}
              {uploadingCover && 'Uploading cover photo...'}
              {uploading && uploadingCover && 'Uploading both images...'}
            </div>
          )}
        </div>
      )}

      <div className="profile-tabs" style={{
        background: 'var(--card-background)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        margin: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
            style={{
              background: activeTab === 'posts' ? 'var(--background-color)' : 'none',
              border: 'none',
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              color: activeTab === 'posts' ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'posts' ? '3px solid var(--primary-color)' : '3px solid transparent'
            }}
          >
            Posts
          </button>
          <button 
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
            style={{
              background: activeTab === 'about' ? 'var(--background-color)' : 'none',
              border: 'none',
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              color: activeTab === 'about' ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'about' ? '3px solid var(--primary-color)' : '3px solid transparent'
            }}
          >
            About
          </button>
          <button 
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
            style={{
              background: activeTab === 'friends' ? 'var(--background-color)' : 'none',
              border: 'none',
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              color: activeTab === 'friends' ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'friends' ? '3px solid var(--primary-color)' : '3px solid transparent'
            }}
          >
            Friends
          </button>
          <button 
            className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
            style={{
              background: activeTab === 'photos' ? 'var(--background-color)' : 'none',
              border: 'none',
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              color: activeTab === 'photos' ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'photos' ? '3px solid var(--primary-color)' : '3px solid transparent'
            }}
          >
            Photos
          </button>
        </div>
      </div>

      <div className="tab-content" style={{
        background: 'var(--card-background)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        margin: '1rem',
        padding: '1rem',
        minHeight: '200px'
      }}>
        {renderTabContent()}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem' }}>
        <Link to="/feed" style={{ color: '#86c76b', textDecoration: 'none' }}>
          ← Back to Feed
        </Link>
      </div>
    </div>
  );
}
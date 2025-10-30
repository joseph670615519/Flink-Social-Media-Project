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
            console.log('👤 Loading user data:', data);
            setUserData(data);
            
            // Use Firestore photoURL first, then fallback to Auth photoURL
            const profilePhotoURL = data.photoURL || user.photoURL || '';
            console.log('📸 Profile photo URL:', profilePhotoURL.substring(0, 100) + '...');
            
            setEditedUser({
              displayName: user.displayName || data.displayName || '',
              bio: data.bio || 'Welcome to my profile! I just joined Flink.',
              photoURL: profilePhotoURL
            });
          } else {
            // If no Firestore doc exists, use Auth data
            setEditedUser({
              displayName: user.displayName || '',
              bio: 'Welcome to my profile! I just joined Flink.',
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
    console.log('Profile image selected:', file);
    
    if (!file) return;

    // Check file type first
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      console.error('Invalid file type:', file.type);
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      console.error('File too large:', file.size);
      return;
    }

    console.log('Profile image accepted:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setUploading(true);
    
    try {
      console.log('📤 Uploading profile image:', file.name);
      
      // Enhanced filename handling
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const sanitizedName = `${Date.now()}_profile.${fileExtension}`;
      const imagePath = `profile-images/${user.uid}/${sanitizedName}`;
      console.log('📁 Profile upload path:', imagePath);
      
      // Fix MIME type for JPG files
      let uploadFile = file;
      if (fileExtension === 'jpg' && !file.type.includes('jpeg')) {
        console.log('🔧 Fixing JPG MIME type for profile');
        uploadFile = new File([file], sanitizedName, { 
          type: 'image/jpeg',
          lastModified: file.lastModified 
        });
      }

      const imageRef = ref(storage, imagePath);
      console.log('🔗 Profile storage reference created');
      
      // Add timeout for profile upload
      console.log('⬆️ Starting profile upload with timeout...');
      const uploadPromise = uploadBytes(imageRef, uploadFile);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile upload timeout after 20 seconds')), 20000)
      );
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      console.log('✅ Profile upload completed:', snapshot.metadata);
      
      const urlPromise = getDownloadURL(snapshot.ref);
      const urlTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile URL timeout after 10 seconds')), 10000)
      );
      
      const downloadURL = await Promise.race([urlPromise, urlTimeoutPromise]);
      console.log('🔗 Profile download URL obtained');
      
      // Update the edited user state with new photo URL
      setEditedUser(prev => ({...prev, photoURL: downloadURL}));
      
      console.log('✅ Profile image uploaded successfully!');
    } catch (error) {
      console.error('❌ Profile image upload failed:', {
        error: error,
        code: error.code,
        message: error.message
      });
      
      // Fallback: try base64 for profile images too
      try {
        console.log('🔄 Trying base64 fallback for profile image...');
        const base64URL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        setEditedUser(prev => ({...prev, photoURL: base64URL}));
        console.log('✅ Profile image set using base64');
      } catch (base64Error) {
        console.error('❌ Profile image upload completely failed:', base64Error);
        let errorMsg = 'Failed to upload profile image.';
        if (error.message.includes('timeout')) {
          errorMsg = 'Upload timed out. Please try a smaller image.';
        }
        alert(errorMsg + ' Please try again with a different image.');
      }
    } finally {
      setUploading(false);
      console.log('🏁 Profile upload process finished');
    }
  };

  const handleSaveProfile = async () => {
    if (!editedUser.displayName.trim()) {
      alert('Display name is required');
      return;
    }

    setUploading(true);
    console.log('💾 Saving profile changes...');
    
    try {
      const newPhotoURL = editedUser.photoURL || user.photoURL;
      console.log('📸 Photo URL length:', newPhotoURL?.length || 0);
      
      // Check if photo URL is too long (Base64 issue)
      const isBase64 = newPhotoURL && newPhotoURL.startsWith('data:image');
      
      if (isBase64) {
        console.log('🔄 Base64 detected, saving to Firestore only');
        
        // For Base64: Only update Firestore, skip Firebase Auth
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: editedUser.displayName,
          bio: editedUser.bio,
          photoURL: newPhotoURL,
          updatedAt: new Date().toISOString()
        });
        
        // Update Auth with name only (no photo URL)
        await updateProfile(auth.currentUser, {
          displayName: editedUser.displayName
        });
        
      } else {
        console.log('🔗 Normal URL, updating both Auth and Firestore');
        
        // For normal URLs: Update both Firebase Auth and Firestore
        await updateProfile(auth.currentUser, {
          displayName: editedUser.displayName,
          photoURL: newPhotoURL
        });

        await updateDoc(doc(db, 'users', user.uid), {
          displayName: editedUser.displayName,
          bio: editedUser.bio,
          photoURL: newPhotoURL,
          updatedAt: new Date().toISOString()
        });
      }

      // Update local state
      setUserData(prev => ({
        ...prev,
        displayName: editedUser.displayName,
        bio: editedUser.bio,
        photoURL: editedUser.photoURL
      }));
      
      setIsEditing(false);
      console.log('✅ Profile updated successfully!');
      alert('Profile updated successfully! 🎉');
      
    } catch (error) {
      console.error('❌ Error updating profile:', {
        error: error,
        message: error.message,
        code: error.code
      });
      
      let errorMessage = 'Failed to update profile.';
      if (error.code === 'auth/invalid-profile-attribute') {
        errorMessage = 'Profile image is too large. Please try a smaller image.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check your login status.';
      }
      
      alert(errorMessage + '\n\nError: ' + error.message);
    } finally {
      setUploading(false);
      console.log('🏁 Profile save process finished');
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
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
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
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📤 Uploading profile image...</span>
              <button
                onClick={() => {
                  setUploading(false);
                  console.log('❌ Profile upload cancelled by user');
                }}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
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
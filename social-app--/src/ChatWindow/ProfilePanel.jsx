import { useState } from 'react';

function ProfilePanel({ friend, setShowProfile, windowWidth }) {
  const [notificationsMuted, setNotificationsMuted] = useState(false);

  return (
    <div className="profile-panel">
      {windowWidth <= 768 && <button className="close-profile" onClick={() => setShowProfile(false)}>✕</button>}
      <div className="profile-header">
        <div className="profile-avatar-large">{friend.profilePic}</div>
        <h2>{friend.name}</h2>
        <p className="profile-status">{friend.online ? '🟢 Active now' : '⚫ Offline'}</p>
      </div>
      <div className="profile-actions">
        <button className="profile-action-button"><span className="action-icon">👤</span>View Profile</button>
        <button className="profile-action-button" onClick={() => setNotificationsMuted(!notificationsMuted)}>
          <span className="action-icon">{notificationsMuted ? '🔕' : '🔔'}</span>{notificationsMuted ? 'Unmute' : 'Mute'} Notifications
        </button>
      </div>
      <div className="profile-section">
        <h3>Customize Chat</h3>
        <button className="profile-option"><span>🏷️</span>Edit Nicknames</button>
        <button className="profile-option"><span>🎨</span>Change Theme</button>
        <button className="profile-option"><span>👍</span>Change Emoji</button>
      </div>
      <div className="profile-section">
        <h3>More Actions</h3>
        <button className="profile-option"><span>🔍</span>Search in Conversation</button>
        <button className="profile-option"><span>📁</span>View Media & Files</button>
      </div>
    </div>
  );
}

export default ProfilePanel;

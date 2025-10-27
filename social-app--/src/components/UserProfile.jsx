import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TweetContext } from './TweetContext';
import avatarImg from '../assets/FlinkAva.png';
import { auth } from "../firebase";
import { sendFriendRequest, acceptFriendRequest, removeFriend, getFriendStatus } from "./Friends";

export default function UserProfile() {
  const { userId } = useParams();
  const [tweets = []] = useContext(TweetContext) || [];
  const [userData, setUserData] = useState(null);
  // Friend system state + functions
const [status, setStatus] = useState("none");

useEffect(() => {
  let current = auth.currentUser?.uid || "testUser123"; // support fake user
  getFriendStatus(current, userId).then(setStatus);
}, [userId]);

const handleFriendAction = async () => {
  console.log("current:", auth.currentUser?.uid, "target:", userId, "status:", status);

// 🔧 Local testing override — fake logged-in user ID
let current = auth.currentUser?.uid;
if (!current) {
  current = "testUser123"; // pretend you’re logged in
  console.log("⚠️ Using fake user for local testing:", current);
}

  if (status === "none") {
    await sendFriendRequest(current, userId);
    setStatus("sent");
  } else if (status === "received") {
    await acceptFriendRequest(current, userId);
    setStatus("friends");
  } else {
    await removeFriend(current, userId);
    setStatus("none");
  }

};


  useEffect(() => {
    // Fetch user data from your state management or Firebase
    // For demo, we'll use in-memory data
    const storedUsers = [
      {
        id: 'user1',
        displayName: 'Alice Johnson',
        email: 'alice@example.com',
        photoURL: avatarImg,
        bio: 'Love sharing my thoughts and connecting with friends! 🌟',
        friendsCount: 156,
        postsCount: 42,
        likesCount: 523
      },
      {
        id: 'user2',
        displayName: 'Bob Smith',
        email: 'bob@example.com',
        photoURL: avatarImg,
        bio: 'Tech enthusiast | Coffee lover ☕ | Always learning',
        friendsCount: 89,
        postsCount: 28,
        likesCount: 312
      },
      {
        id: 'user3',
        displayName: 'Carol Williams',
        email: 'carol@example.com',
        photoURL: avatarImg,
        bio: 'Artist & Designer | Creating beautiful things every day 🎨',
        friendsCount: 234,
        postsCount: 67,
        likesCount: 891
      }
    ];
    
    const user = storedUsers.find(u => u.id === userId);
    
    if (user) {
      setUserData(user);
    } else {
      // Fallback for demo purposes
      setUserData({
        id: userId,
        displayName: `User ${userId}`,
        email: `${userId}@example.com`,
        photoURL: avatarImg,
        bio: 'This user hasn\'t set up their bio yet.',
        friendsCount: Math.floor(Math.random() * 100),
        postsCount: 0,
        likesCount: 0
      });
    }
  }, [userId]);

  if (!userData) {
    return <div className="main-content">Loading profile...</div>;
  }

  // Filter tweets by this user
  const userTweets = tweets.filter(t => t.userId === userId);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover" />
        <div className="profile-meta">
          <img 
            src={userData.photoURL || avatarImg} 
            alt={userData.displayName} 
            className="profile-avatar-large" 
          />
          <div className="profile-info">
            <h1>{userData.displayName}</h1>
            {userData.email && <p className="profile-email">{userData.email}</p>}
            <p className="profile-bio">{userData.bio || 'No bio available.'}</p>
          </div>
          <div className="profile-actions">
            
            <button className="small-btn" onClick={handleFriendAction}>
            {status === "friends"
            ? "Unfriend"
            : status === "sent"
            ? "Request Sent"
            : status === "received"
            ? "Accept Request"
            : "Add Friend"}
            </button>

            <button className="small-btn" style={{ marginLeft: '0.5rem' }}>Message</button>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat">
            <strong>{userTweets.length}</strong>
            <span>Posts</span>
          </div>
          <div className="stat">
            <strong>{userData.friendsCount || 0}</strong>
            <span>Friends</span>
          </div>
          <div className="stat">
            <strong>{userData.likesCount || 0}</strong>
            <span>Likes</span>
          </div>
        </div>
      </div>

      <section className="profile-posts">
        <h2>{userData.displayName}'s posts</h2>
        {userTweets.length === 0 && (
          <p style={{ color: '#666' }}>
            {userData.displayName} hasn't posted anything yet.
          </p>
        )}
        {userTweets.map(t => (
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
        ))}
      </section>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/" style={{ color: '#86c76b', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
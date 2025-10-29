import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Heart, MessageCircle, Share, Phone } from 'lucide-react';
import CreatePost from './CreatePost';
import './PostsFeed.css';

const PostsFeed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (postId, currentLikes) => {
    const postRef = doc(db, 'posts', postId);
    const isLiked = currentLikes.includes(user.uid);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleCall = () => {
    // เปิดหน้าต่างใหม่ไปยัง ngrok URL ของคุณ
    window.open('https://tuyet-presystolic-jillian.ngrok-free.dev', '_blank');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${days} วันที่แล้ว`;
  };

  if (loading) {
    return (
      <div className="posts-feed-container">
        <div className="loading">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="posts-feed-container">
      <div className="feed-header">
        <h1>Flink Feed</h1>
        <button className="call-header-button" onClick={handleCall}>
          <Phone size={20} />
          Video Call
        </button>
      </div>
      
      <CreatePost user={user} onPostCreated={() => {}} />

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>ยังไม่มีโพสต์ เริ่มแชร์ความคิดของคุณกันเถอะ!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <img 
                  src={post.authorPhoto || '/default-avatar.png'} 
                  alt={post.authorName}
                  className="author-avatar"
                />
                <div className="author-info">
                  <h3>{post.authorName}</h3>
                  <p>{formatTimestamp(post.timestamp)}</p>
                </div>
                <button className="post-call-button" onClick={handleCall}>
                  <Phone size={18} />
                </button>
              </div>

              <div className="post-content">
                {post.text && <p>{post.text}</p>}
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post content" 
                    className="post-image"
                  />
                )}
              </div>

              <div className="post-actions">
                <button 
                  className={`action-button like-button ${post.likes?.includes(user.uid) ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id, post.likes || [])}
                >
                  <Heart size={20} />
                  <span>{post.likes?.length || 0}</span>
                </button>

                <button className="action-button comment-button">
                  <MessageCircle size={20} />
                  <span>{post.comments?.length || 0}</span>
                </button>

                <button className="action-button share-button">
                  <Share size={20} />
                  แชร์
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostsFeed;
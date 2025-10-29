import './Tweet.css';
import { useState } from 'react';
import { likePost, unlikePost, addComment } from '../services/postsService';
import { createNotification } from '../services/notificationService';
import avatarImg from '../assets/FlinkAva.png';

const Tweet = (props) => {
    const { 
        id, 
        title, 
        message, 
        likes = [], 
        comments = [],
        userName = "User", 
        avatar, 
        date,
        userId,
        currentUserId
    } = props;
    
    const [localLikes, setLocalLikes] = useState(likes || []);
    const [localComments, setLocalComments] = useState(comments || []);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    
    const isLiked = currentUserId && localLikes.includes(currentUserId);

    const handleLike = async () => {
        if (!currentUserId || !id) return;
        
        setLoading(true);
        try {
            if (isLiked) {
                await unlikePost(id, currentUserId);
                setLocalLikes(localLikes.filter(uid => uid !== currentUserId));
            } else {
                await likePost(id, currentUserId);
                setLocalLikes([...localLikes, currentUserId]);
                
                // สร้าง notification เมื่อกดไลค์
                if (userId && userId !== currentUserId) {
                    try {
                        await createNotification(userId, 'like', {
                            senderId: currentUserId,
                            senderName: props.currentUserName || 'Someone',
                            senderAvatar: props.currentUserAvatar || avatarImg,
                            message: 'ชอบโพสต์ของคุณ',
                            postId: id
                        });
                    } catch (error) {
                        console.error('Error creating notification:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!currentUserId || !id || !commentText.trim()) return;
        
        setLoading(true);
        try {
            const newComment = await addComment(
                id,
                currentUserId,
                props.currentUserName || 'Anonymous',
                props.currentUserAvatar || avatarImg,
                commentText
            );
            setLocalComments([...localComments, newComment]);
            setCommentText('');
            
            // สร้าง notification เมื่อมีคอมเมนท์
            if (userId && userId !== currentUserId) {
                try {
                    await createNotification(userId, 'comment', {
                        senderId: currentUserId,
                        senderName: props.currentUserName || 'Someone',
                        senderAvatar: props.currentUserAvatar || avatarImg,
                        message: 'แสดงความคิดเห็นโพสต์ของคุณ',
                        postId: id
                    });
                } catch (error) {
                    console.error('Error creating notification:', error);
                }
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tweet-card">
            <div className="tweet-header">
                <img src={avatar || avatarImg} alt="User" className="tweet-avatar" />
                <div className="tweet-user-info">
                    <strong>{userName}</strong>
                    <span className="tweet-date">{date || new Date().toLocaleDateString()}</span>
                </div>
            </div>
            <div className="tweet-content">
                <h3>{title}</h3>
                <p>{message}</p>
            </div>
            <div className="tweet-actions">
                <button 
                    onClick={handleLike} 
                    className={`like-btn ${isLiked ? 'liked' : ''}`}
                    disabled={loading || !currentUserId}
                >
                    ❤️ {localLikes.length}
                </button>
                <button 
                    className="comment-btn"
                    onClick={() => setShowComments(!showComments)}
                >
                    💬 {localComments.length} Comments
                </button>
                <button className="share-btn">↪️ Share</button>
            </div>
            
            {showComments && (
                <div className="comments-section">
                    <div className="comments-list">
                        {localComments.length === 0 ? (
                            <p className="no-comments">No comments yet. Be the first to comment!</p>
                        ) : (
                            localComments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <img src={comment.userAvatar || avatarImg} alt={comment.userName} className="comment-avatar" />
                                    <div className="comment-content">
                                        <strong>{comment.userName}</strong>
                                        <p>{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {currentUserId && (
                        <div className="add-comment-form">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !loading) {
                                        handleAddComment();
                                    }
                                }}
                                disabled={loading}
                            />
                            <button 
                                onClick={handleAddComment}
                                disabled={loading || !commentText.trim()}
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Tweet;

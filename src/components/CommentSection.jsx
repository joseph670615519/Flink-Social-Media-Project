import React, { useState, useContext, useEffect } from 'react';
import { TweetContext } from './TweetContext';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { createNotification } from './Notification';
import avatarImg from '../assets/FlinkAva.png';
import './CommentSection.css';

const CommentSection = ({ tweetId, comments = [], onClose }) => {
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [user, setUser] = useState(null);
    const { addComment, tweets } = useContext(TweetContext);

    // Debug: Log the tweetId received
    console.log('CommentSection received tweetId:', tweetId);
    console.log('tweetId type:', typeof tweetId);
    console.log('Is valid?', tweetId && tweetId !== 'unknown');

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Find the main tweet
    const mainTweet = tweets.find(t => t.id === tweetId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user) {
            console.log('Cannot submit comment:', { 
                hasText: !!commentText.trim(), 
                hasUser: !!user,
                tweetId 
            });
            alert('Please login and enter a comment');
            return;
        }

        setPosting(true);
        
        try {
            console.log('Starting comment submission...');
            console.log('User:', user.uid, user.displayName || user.email);
            console.log('Tweet ID received:', tweetId);
            console.log('Comment text:', commentText.trim());

            // Validate tweetId first
            if (!tweetId || tweetId === 'unknown') {
                console.error('❌ Invalid tweetId:', tweetId);
                throw new Error('Invalid tweet ID');
            }

            // Debug: Check if tweet exists in local tweets array
            const localTweet = tweets.find(t => t.id === tweetId);
            console.log('Local tweet found:', localTweet ? 'YES' : 'NO');
            if (localTweet) {
                console.log('Local tweet data:', localTweet.title || localTweet.message);
            }

        // Validate tweetId first
        if (!tweetId || tweetId === 'unknown') {
            console.error('Invalid tweetId:', tweetId);
            alert('Error: Cannot find tweet ID. Please try refreshing the page.');
            return;
        }            // Direct Firestore approach
            const tweetRef = doc(db, 'tweets', tweetId);
            console.log('Getting tweet document...');
            
            const tweetSnap = await getDoc(tweetRef);
            if (!tweetSnap.exists()) {
                console.error('Tweet not found:', tweetId);
                throw new Error('Tweet not found');
            }
            
            const tweetData = tweetSnap.data();
            console.log('Tweet found:', tweetData.title || tweetData.message);
            console.log('Adding comment...');
            
            const now = new Date();
            const newComment = {
                id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: commentText.trim(),
                userId: user.uid,
                userName: user.displayName || user.email.split('@')[0],
                userAvatar: user.photoURL || '',
                timestamp: now,
                createdAt: now.toISOString(),
                date: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            console.log('Comment object created:', newComment);
            
            // Add the comment
            console.log('Saving to Firestore...');
            await updateDoc(tweetRef, {
                comments: arrayUnion(newComment)
            });
            
            console.log('Comment saved successfully!');
            
            // Create notification if not own post
            if (tweetData.userId !== user.uid) {
                console.log('Creating notification for post owner:', tweetData.userId);
                try {
                    await createNotification(
                        tweetData.userId,
                        user.uid,
                        user.displayName || user.email,
                        'comment',
                        'commented on your post',
                        tweetId
                    );
                    console.log('Notification created successfully!');
                } catch (notifError) {
                    console.error('Notification failed:', notifError);
                }
            } else {
                console.log('Skipping notification (own post)');
            }
            
            setCommentText('');
            console.log('Comment process completed!');
            // Reload the page to see the comment
            window.location.reload();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment: ' + error.message);
        }
        
        setPosting(false);
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'just now';
        
        // Handle both Date objects and Firestore Timestamps
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            return 'just now';
        }
        
        const now = new Date();
        const diff = now - date;
        const mins = Math.floor(diff / 60000);
        
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="comment-overlay" onClick={onClose}>
            <div className="comment-box" onClick={e => e.stopPropagation()}>
                <div className="comment-header">
                    <h4>Post & Comments</h4>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="comments-list">
                    {/* Main Tweet at the top */}
                    {mainTweet && (
                        <div className="main-tweet-display">
                            <div className="tweet-header-in-comments">
                                <img 
                                    src={mainTweet.userAvatar || avatarImg} 
                                    alt=""
                                    className="comment-avatar"
                                />
                                <div className="comment-content">
                                    <div className="comment-meta">
                                        <span className="commenter-name">{mainTweet.userName}</span>
                                        <span className="comment-time">{mainTweet.date}</span>
                                    </div>
                                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '16px', color: '#333' }}>
                                        {mainTweet.title}
                                    </h4>
                                    <p style={{ margin: '0 0 8px 0' }}>{mainTweet.message}</p>
                                    {mainTweet.imageURL && (
                                        <img 
                                            src={mainTweet.imageURL} 
                                            alt="Post"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '300px',
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                                marginTop: '8px'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div style={{
                                borderBottom: '2px solid #86c76b',
                                margin: '16px 0',
                                paddingBottom: '8px'
                            }}>
                                <strong style={{ color: '#86c76b', fontSize: '14px' }}>
                                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                                </strong>
                            </div>
                        </div>
                    )}

                    {/* Comments section */}
                    {comments.length === 0 ? (
                        <div className="no-comments">
                            <p>No comments yet</p>
                            <small>Start the conversation</small>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <img 
                                    src={comment.userAvatar || avatarImg} 
                                    alt=""
                                    className="comment-avatar"
                                />
                                <div className="comment-content">
                                    <div className="comment-meta">
                                        <span className="commenter-name">{comment.userName}</span>
                                        <span className="comment-time">
                                            {getTimeAgo(comment.timestamp)}
                                        </span>
                                    </div>
                                    <p>{comment.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {user && (
                    <div className="comment-input-area">
                        <form onSubmit={handleSubmit}>
                            <div className="input-row">
                                <img 
                                    src={user.photoURL || avatarImg} 
                                    alt="You"
                                    className="current-user-avatar"
                                />
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="comment-input"
                                        disabled={posting}
                                    />
                                    {commentText.trim() && (
                                        <button 
                                            type="submit" 
                                            className="post-comment-btn"
                                            disabled={posting}
                                        >
                                            {posting ? '...' : 'Post'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
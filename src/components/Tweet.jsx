import './Tweet.css';
import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import avatarImg from '../assets/FlinkAva.png';
import { TweetContext } from './TweetContext';
import CommentSection from './CommentSection';
import { createNotification } from './Notification';

const Tweet = (props) => {
    const [likes, setLikes] = useState(props.likes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isRetweeting, setIsRetweeting] = useState(false);
    const [hasRetweeted, setHasRetweeted] = useState(false);
    const [user, setUser] = useState(null);
    const { tweets, retweetPost, checkIfRetweeted, deleteTweet } = useContext(TweetContext);
    
    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);
    
    // Load like status from Firestore
    useEffect(() => {
        const loadLikeStatus = async () => {
            if (!user || !props.id) return;
            
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');
                
                const tweetRef = doc(db, 'tweets', props.id);
                const tweetSnap = await getDoc(tweetRef);
                
                if (tweetSnap.exists()) {
                    const tweetData = tweetSnap.data();
                    const likedUsers = tweetData.likedUsers || [];
                    const tweetLikes = tweetData.likes || 0;
                    
                    setLikes(tweetLikes);
                    setIsLiked(likedUsers.includes(user.uid));
                    console.log(' Loaded like status for tweet:', props.id, {
                        likes: tweetLikes,
                        isLiked: likedUsers.includes(user.uid)
                    });
                }
            } catch (error) {
                console.error('Error loading like status:', error);
            }
        };
        
        loadLikeStatus();
    }, [user, props.id]);
    
    const isOwnTweet = user && props.userId === user.uid;
    
    // Debug delete button
    useEffect(() => {
        console.log(' Delete button debug:', {
            user: user?.uid,
            tweetUserId: props.userId,
            isOwnTweet,
            tweetId: props.id
        });
    }, [user, props.userId, isOwnTweet]);

    const tweetId = props.id || props.tweetId || 'unknown';
    
    const thisTweet = tweetId !== 'unknown' ? tweets.find(t => t.id === tweetId) : null;
    const comments = Array.isArray(thisTweet?.comments) ? thisTweet.comments : [];
    const commentCount = comments.length;
    const retweetCount = thisTweet?.retweetCount || 0;

    // Debug logging
    useEffect(() => {
        if (thisTweet && comments.length > 0) {
            console.log(`Tweet ${tweetId} has ${comments.length} comments:`, comments);
        }
    }, [comments.length, tweetId]);

    // Check if this is a retweet
    const isRetweet = props.isRetweet || false;
    const originalTweetId = props.originalTweetId || tweetId;

    // Check if user has retweeted this post
    useEffect(() => {
        const checkRetweet = async () => {
            if (user && originalTweetId !== 'unknown') {
                const retweeted = await checkIfRetweeted(originalTweetId, user.uid);
                setHasRetweeted(retweeted);
            }
        };
        checkRetweet();
    }, [user, originalTweetId, checkIfRetweeted, tweets]);

    const handleLike = async () => {
        if (!user) {
            alert('You must be logged in to like posts!');
            return;
        }

        try {
            const { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            console.log(' Processing like for tweet:', props.id, 'by user:', user.uid);
            
            const tweetRef = doc(db, 'tweets', props.id);
            const tweetSnap = await getDoc(tweetRef);
            
            if (!tweetSnap.exists()) {
                console.error('Tweet not found for like');
                return;
            }
            
            const tweetData = tweetSnap.data();
            const likedUsers = tweetData.likedUsers || [];
            const currentLikes = tweetData.likes || 0;
            
            if (likedUsers.includes(user.uid)) {
                // Unlike
                console.log(' Removing like');
                await updateDoc(tweetRef, {
                    likes: increment(-1),
                    likedUsers: arrayRemove(user.uid)
                });
                setLikes(currentLikes - 1);
                setIsLiked(false);
            } else {
                // Like  
                console.log(' Adding like');
                await updateDoc(tweetRef, {
                    likes: increment(1),
                    likedUsers: arrayUnion(user.uid)
                });
                setLikes(currentLikes + 1);
                setIsLiked(true);
                
                // Create notification for post owner (only if it's not own post)
                if (props.userId !== user.uid) {
                    console.log(' Creating like notification for:', props.userId);
                    try {
                        await createNotification(
                            props.userId,
                            user.uid,
                            user.displayName || user.email,
                            'like',
                            'liked your post',
                            props.id
                        );
                        console.log(' Like notification created successfully');
                    } catch (notifyError) {
                        console.error(' Failed to create like notification:', notifyError);
                    }
                } else {
                    console.log(' Skipping like notification (own post)');
                }
            }
        } catch (error) {
            console.error('Error handling like:', error);
            alert('Failed to like post');
        }
    }

    const handleRetweet = async () => {
        if (!user) {
            alert('You must be logged in to retweet!');
            return;
        }

        if (isRetweeting) return;

        setIsRetweeting(true);
        const success = await retweetPost(originalTweetId, user);
        
        if (success) {
            // Toggle the retweeted state
            setHasRetweeted(!hasRetweeted);
            
            // Create notification for post owner (only if it's not own post and not already retweeted)
            if (!hasRetweeted && props.userId !== user.uid) {
                await createNotification(
                    props.userId,
                    user.uid,
                    user.displayName || user.email,
                    'retweet',
                    'retweeted your post',
                    tweetId
                );
            }
        }
        
        setIsRetweeting(false);
    }

    const handleDelete = async () => {
        if (!user || !isOwnTweet) return;
        
        const confirmDelete = window.confirm('Are you sure you want to delete this post?');
        if (!confirmDelete) return;
        
        const success = await deleteTweet(tweetId, user.uid);
        if (success) {
            console.log('Tweet deleted successfully');
        } else {
            alert('Failed to delete post');
        }
    }

    if (!props.title && !props.message) {
        return null;
    }

    // Determine which user info to show
    const displayUserId = isRetweet ? props.originalUserId : props.userId;
    const displayUserName = isRetweet ? props.originalUserName : props.userName;
    const displayAvatar = isRetweet ? props.originalUserAvatar : props.avatar;
    const displayDate = isRetweet ? props.originalDate : props.date;

    return (
        <>
            <div className="tweet-card">
                {/* Retweet indicator */}
                {isRetweet && (
                    <div className="retweet-indicator">
                        <span className="retweet-icon">↪️</span>
                        <Link 
                            to={isOwnTweet ? "/me" : `/profile/${props.userId}`}
                            className="retweet-text"
                        >
                            {isOwnTweet ? 'You' : props.userName} shared
                        </Link>
                    </div>
                )}

                <div className="tweet-header">
                    <Link to={user && displayUserId === user.uid ? "/me" : `/profile/${displayUserId}`}>
                        <img 
                            src={displayAvatar || avatarImg} 
                            alt="" 
                            className="tweet-avatar"
                        />
                    </Link>
                    <div className="tweet-user-info">
                        <Link 
                            to={user && displayUserId === user.uid ? "/me" : `/profile/${displayUserId}`}
                            className="user-link"
                        >
                            {displayUserName || "User"}
                        </Link>
                        <span className="tweet-date">{displayDate}</span>
                    </div>
                    
                    {/* Delete button - only show for own tweets */}
                    {isOwnTweet && (
                        <button 
                            onClick={handleDelete}
                            className="delete-btn"
                            title="Delete post"
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#666',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#fee';
                                e.target.style.color = '#d32f2f';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#666';
                            }}
                        >
                    
                        </button>
                    )}
                </div>
                
                <div className="tweet-content">
                    <h3>{props.title}</h3>
                    <p>{props.message}</p>
                    
                    {props.imageURL && (
                        <div className="tweet-image">
                            <img 
                                src={props.imageURL} 
                                alt="Post"
                            />
                        </div>
                    )}
                </div>
                
                <div className="tweet-actions">
                    <button 
                        onClick={handleLike} 
                        className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                    >
                         {likes}
                    </button>
                    <button 
                        className="action-btn comment-btn" 
                        onClick={() => tweetId !== 'unknown' && setShowComments(true)}
                        disabled={tweetId === 'unknown'}
                    >
                         {commentCount > 0 ? commentCount : ''}
                    </button>
                    <button 
                        className={`action-btn share-btn ${hasRetweeted ? 'retweeted' : ''}`}
                        onClick={handleRetweet}
                        disabled={isRetweeting}
                        title={hasRetweeted ? 'Undo retweet' : 'Retweet'}
                    >
                        {hasRetweeted ? '' : ''} {retweetCount > 0 ? retweetCount : ''}
                    </button>
                </div>
            </div>

            {showComments && (
                <CommentSection 
                    tweetId={props.id || props.tweetId}
                    comments={comments}
                    onClose={() => setShowComments(false)}
                />
            )}
        </>
    );
}

export default Tweet;
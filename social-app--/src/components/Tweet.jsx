import './Tweet.css';
import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import avatarImg from '../assets/FlinkAva.png';
import { TweetContext } from './TweetContext';
import CommentSection from './CommentSection';

const Tweet = (props) => {
    const [likes, setLikes] = useState(props.likes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isRetweeting, setIsRetweeting] = useState(false);
    const [hasRetweeted, setHasRetweeted] = useState(false);
    const { tweets, retweetPost, checkIfRetweeted } = useContext(TweetContext);
    
    const user = auth.currentUser;
    const isOwnTweet = user && props.userId === user.uid;

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

    const handleLike = () => {
        if (isLiked) {
            setLikes(likes - 1);
        } else {
            setLikes(likes + 1);
        }
        setIsLiked(!isLiked);
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
        }
        
        setIsRetweeting(false);
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
                        ❤️ {likes}
                    </button>
                    <button 
                        className="action-btn comment-btn" 
                        onClick={() => tweetId !== 'unknown' && setShowComments(true)}
                        disabled={tweetId === 'unknown'}
                    >
                        💬 {commentCount > 0 ? commentCount : ''}
                    </button>
                    <button 
                        className={`action-btn share-btn ${hasRetweeted ? 'retweeted' : ''}`}
                        onClick={handleRetweet}
                        disabled={isRetweeting}
                        title={hasRetweeted ? 'Undo retweet' : 'Retweet'}
                    >
                        {hasRetweeted ? '✓' : '↪️'} {retweetCount > 0 ? retweetCount : ''}
                    </button>
                </div>
            </div>

            {showComments && tweetId !== 'unknown' && (
                <CommentSection 
                    tweetId={originalTweetId}
                    comments={comments}
                    onClose={() => setShowComments(false)}
                />
            )}
        </>
    );
}

export default Tweet;
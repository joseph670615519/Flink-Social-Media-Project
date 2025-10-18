import './Tweet.css';
import { useState } from 'react';
import avatarImg from '../assets/FlinkAva.png';

const Tweet = (props) => {
    const [likes, setLikes] = useState(props.likes);
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setLikes(isLiked ? likes - 1 : likes + 1);
        setIsLiked(!isLiked);
    }

     return (
        <div className="tweet-card">
            <div className="tweet-header">
                <img src={props.avatar || avatarImg} alt="User" className="tweet-avatar" />
                <div className="tweet-user-info">
                    <strong>{props.userName || "User"}</strong>
                    <span className="tweet-date">{props.date}</span>
                </div>
            </div>
            <div className="tweet-content">
                <h3>{props.title}</h3>
                <p>{props.message}</p>
            </div>
            <div className="tweet-actions">
                <button onClick={handleLike} className={`like-btn ${isLiked ? 'liked' : ''}`}>
                    ❤️ {likes}
                </button>
                <button className="comment-btn">💬 Comment</button>
                <button className="share-btn">↪️ Share</button>
            </div>
        </div>
    );
}

export default Tweet;

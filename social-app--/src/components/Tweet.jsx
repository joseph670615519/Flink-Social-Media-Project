import './Tweet.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
                <Link to={`/profile/${props.userId}`}>
                    <img 
                        src={props.avatar || avatarImg} 
                        alt="User" 
                        className="tweet-avatar"
                        style={{ cursor: 'pointer' }}
                    />
                </Link>
                <div className="tweet-user-info">
                    <Link 
                        to={`/profile/${props.userId}`} 
                        style={{ 
                            textDecoration: 'none', 
                            color: 'inherit',
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: '2px'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#86c76b'}
                        onMouseOut={(e) => e.target.style.color = 'inherit'}
                    >
                        {props.userName || "User"}
                    </Link>
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
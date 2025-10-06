import React, { useState, useContext } from 'react';
import { TweetContext } from './TweetContext';

const AddTweet = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [tweets, setTweets] = useContext(TweetContext);

    const updateTitle = (e) => setTitle(e.target.value);
    const updateMessage = (e) => setMessage(e.target.value);

    const addTweet = (e) => {
        e.preventDefault();
        const newTweet = { title, message, likes: 0, id: tweets.length };
        setTweets(prevTweets => [...prevTweets, newTweet]);
        localStorage.setItem('tweets', JSON.stringify([...tweets, newTweet]));
        setTitle('');
        setMessage('');
    };

    return (
        <div className="add-tweet-card">
            {/* Optional: Add a user avatar */}
            {/* <img src="/avatar.png" alt="User" className="avatar" /> */}
            <form onSubmit={addTweet}>
                <input
                    type="text"
                    name="title"
                    placeholder="Add Title"
                    value={title}
                    onChange={updateTitle}
                    className="tweet-title-input"
                />
                <textarea
                    name="message"
                    placeholder="Type what you have in mind!"
                    value={message}
                    onChange={updateMessage}
                    className="tweet-message-input"
                    rows={3}
                />
                <button type="submit" className="small-btn">Post</button>
            </form>
        </div>
    );
};

export default AddTweet;
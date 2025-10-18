import React, { useState, useContext } from 'react';
import { TweetContext } from './TweetContext';
import { auth } from '../firebase'; 

const AddTweet = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [tweets, setTweets] = useContext(TweetContext);

    const updateTitle = (e) => setTitle(e.target.value);
    const updateMessage = (e) => setMessage(e.target.value);

    const addTweet = (e) => {
        e.preventDefault();
        const currentUserId = auth.currentUser?.uid || 'current-user';

         const newTweet = { 
            title, 
            message, 
            likes: 0, 
            id: Date.now(),
            userId: currentUserId,
            date: new Date().toLocaleDateString()
        };
        
        const updatedTweets = [...tweets, newTweet];
        setTweets(updatedTweets);
        
        setTitle('');
        setMessage('');
    };

    return (
        <div className="add-tweet-card">
            <form onSubmit={addTweet}>
                <input
                    type="text"
                    name="title"
                    placeholder="Add Title"
                    value={title}
                    onChange={updateTitle}
                    className="tweet-title-input"
                    required
                />
                <textarea
                    name="message"
                    placeholder="Type what you have in mind!"
                    value={message}
                    onChange={updateMessage}
                    className="tweet-message-input"
                    rows={3}
                    required
                />
                <button type="submit" className="small-btn">Post</button>
            </form>
        </div>
    );
};

export default AddTweet;
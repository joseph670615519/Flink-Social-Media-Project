import React, { useState, useContext } from 'react';
import { TweetContext } from './TweetContext';
import { auth } from '../firebase'; // Fixed import path

const AddTweet = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [tweets, setTweets] = useContext(TweetContext);

    const updateTitle = (e) => setTitle(e.target.value);
    const updateMessage = (e) => setMessage(e.target.value);

    const addTweet = (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser; // Now this should work
        
        if (!currentUser) {
            alert('You must be logged in to post!');
            return;
        }

        const newTweet = { 
            title, 
            message, 
            likes: 0, 
            id: Date.now(),
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email,
            userAvatar: currentUser.photoURL,
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
                    id="add-title"
                    placeholder="Add Title"
                    value={title}
                    onChange={updateTitle}
                    className="tweet-title-input"
                    required
                />
                <textarea
                    name="message"
                    id="add-message"
                    placeholder="Type what you have in mind!"
                    value={message}
                    onChange={updateMessage}
                    className="tweet-message-input"
                    rows={3}
                    required
                />
                <button type="submit" className="post-btn">Post</button>
            </form>
        </div>
    );
};

export default AddTweet;
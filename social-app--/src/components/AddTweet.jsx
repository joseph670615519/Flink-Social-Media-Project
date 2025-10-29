import React, { useState, useContext } from 'react';
import { TweetContext } from './TweetContext';
import { auth } from '../firebase';
import { createPost } from '../services/postsService';
import './AddTweet.css';

const AddTweet = ({ user }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [tweets, setTweets] = useContext(TweetContext);

    const updateTitle = (e) => setTitle(e.target.value);
    const updateMessage = (e) => setMessage(e.target.value);

    const addTweet = async (e) => {
        e.preventDefault();
        
        if (!user) {
            alert('Please log in to post');
            return;
        }

        if (!title.trim() || !message.trim()) {
            alert('Please fill in both title and message');
            return;
        }

        setLoading(true);
        try {
            // Save to Firebase
            const postId = await createPost(user.uid, title, message);
            
            // Also add to local context for immediate display
            const newTweet = { 
                id: postId,
                title, 
                message, 
                likes: [], 
                comments: [],
                userId: user.uid,
                userDisplayName: user.displayName || user.email,
                userPhotoURL: user.photoURL || '',
                date: new Date().toLocaleDateString(),
                createdAt: new Date()
            };
            
            setTweets([newTweet, ...tweets]);
            
            setTitle('');
            setMessage('');
            alert('Post created successfully!');
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post: ' + error.message);
        } finally {
            setLoading(false);
        }
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
                    disabled={loading}
                />
                <textarea
                    name="message"
                    id="add-message"
                    placeholder="Type what you have in mind!"
                    value={message}
                    onChange={updateMessage}
                    className="tweet-message-input"
                    rows={3}
                    disabled={loading}
                />
                <button type="submit" className="post-btn" disabled={loading}>
                    {loading ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    );
};

export default AddTweet;
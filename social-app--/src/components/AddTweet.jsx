import React, { useState, useContext } from 'react';
import { TweetContext } from './TweetContext';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddTweet = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [tweets, setTweets] = useContext(TweetContext);

    const updateTitle = (e) => setTitle(e.target.value);
    const updateMessage = (e) => setMessage(e.target.value);

    const addTweet = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('You must be logged in to post!');
            return;
        }

        try {
   
            const docRef = await addDoc(collection(db, 'tweets'), {
                title, 
                message, 
                likes: 0,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userAvatar: currentUser.photoURL,
                date: new Date().toLocaleDateString(),
                createdAt: serverTimestamp()
            });
        
            const newTweet = { 
                title, 
                message, 
                likes: 0, 
                id: docRef.id,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userAvatar: currentUser.photoURL,
                date: new Date().toLocaleDateString()
            };
            
            const updatedTweets = [...tweets, newTweet];
            setTweets(updatedTweets);
            
            setTitle('');
            setMessage('');
            
            console.log('Tweet saved to Firestore tweets with ID:', docRef.id);
        } catch (error) {
            console.error('Error saving tweet:', error);
            alert('Failed to post tweet: ' + error.message);
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
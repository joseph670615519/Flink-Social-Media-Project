import React, { useState, useContext, useRef } from 'react';
import { TweetContext } from './TweetContext';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddTweet = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const { tweets, setTweets } = useContext(TweetContext);
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const updateTitle = (e) => setTitle(e.target.value);
    const updateMessage = (e) => setMessage(e.target.value);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {

            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be smaller than 5MB');
                return;
            }
            setImage(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const addTweet = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('You must be logged in to post!');
            return;
        }

        setUploading(true);

        try {
            let imageURL = null;

            if (image) {
                const imageRef = ref(storage, `tweet-images/${currentUser.uid}/${Date.now()}_${image.name}`);
                const snapshot = await uploadBytes(imageRef, image);
                imageURL = await getDownloadURL(snapshot.ref);
            }

            const docRef = await addDoc(collection(db, 'tweets'), {
                title, 
                message, 
                imageURL,
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
                imageURL,
                likes: 0, 
                id: docRef.id,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userAvatar: currentUser.photoURL,
                date: new Date().toLocaleDateString()
            };
            
            const updatedTweets = [...tweets, newTweet];
            setTweets(updatedTweets);
            
            // Reset form
            setTitle('');
            setMessage('');
            setImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            console.log('Tweet saved with ID:', docRef.id);
        } catch (error) {
            console.error('Error saving tweet:', error);
            alert('Failed to post tweet: ' + error.message);
        } finally {
            setUploading(false);
        }
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
                
                {/* Image upload section */}
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        id="tweet-image-input"
                    />
                    <label 
                        htmlFor="tweet-image-input"
                        style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            background: 'var(--background-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        📷 Add Photo
                    </label>
                    
                    {image && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                                {image.name}
                            </span>
                            <button 
                                type="button"
                                onClick={removeImage}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff6b6b',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    className="post-btn"
                    disabled={uploading}
                >
                    {uploading ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    );
};

export default AddTweet;
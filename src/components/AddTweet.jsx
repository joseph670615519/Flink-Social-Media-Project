import React, { useState, useContext, useRef } from 'react';
import { TweetContext } from './TweetContext';
import { auth, db, storage, trackPostCreate } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { debugImageUpload } from '../utils/firebaseDebug';

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
        console.log('File picker opened, selected file:', file);
        console.log('Input element:', e.target);
        console.log('Files array:', e.target.files);
        
        if (file) {
            // Use debug helper
            const isValid = debugImageUpload(file);
            
            // Enhanced file type check with fallback
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const fileExtension = file.name.toLowerCase().split('.').pop();
            const isValidType = allowedTypes.includes(file.type) || 
                               ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(fileExtension);
            
            if (!isValidType) {
                alert(`Please select a valid image file (JPEG, PNG, GIF, WEBP)\nSelected: ${file.type || 'unknown type'}`);
                console.error('Invalid file:', {
                    type: file.type,
                    extension: fileExtension,
                    name: file.name
                });
                return;
            }

            // Check file size
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be smaller than 5MB');
                console.error('File too large:', file.size);
                return;
            }
            
            console.log('File accepted for upload:', {
                name: file.name,
                type: file.type,
                size: file.size,
                extension: fileExtension
            });
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

        if (!title.trim() || !message.trim()) {
            alert('Please fill in both title and message!');
            return;
        }

        setUploading(true);
        console.log('Starting tweet creation process...');

        try {
            let imageURL = null;

            if (image) {
                console.log('Starting image upload:', {
                    name: image.name,
                    size: image.size,
                    type: image.type,
                    extension: image.name.split('.').pop()
                });
                
                try {
                    // Enhanced upload with better error handling
                    const fileExtension = image.name.split('.').pop().toLowerCase();
                    const timestamp = Date.now();
                    const sanitizedName = `${timestamp}_${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const imagePath = `tweet-images/${currentUser.uid}/${sanitizedName}`;
                    
                    console.log('Upload path:', imagePath);
                    console.log('User:', currentUser.uid);
                    
                    const imageRef = ref(storage, imagePath);
                    console.log('Storage reference created successfully');
                    
                    // Create proper file with correct MIME type
                    let uploadFile = image;
                    if (fileExtension === 'jpg' && !image.type.includes('jpeg')) {
                        console.log('Fixing JPG MIME type from', image.type, 'to image/jpeg');
                        uploadFile = new File([image], sanitizedName, { 
                            type: 'image/jpeg',
                            lastModified: image.lastModified 
                        });
                    }
                    
                    console.log('Starting Firebase upload...');
                    
                    // Add timeout for upload
                    const uploadPromise = uploadBytes(imageRef, uploadFile);
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
                    );
                    
                    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
                    console.log('Firebase upload successful:', snapshot.metadata);
                    
                    console.log('Getting download URL...');
                    const urlPromise = getDownloadURL(snapshot.ref);
                    const urlTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('URL timeout after 10 seconds')), 10000)
                    );
                    
                    imageURL = await Promise.race([urlPromise, urlTimeoutPromise]);
                    console.log('Download URL obtained:', imageURL.substring(0, 100) + '...');
                    
                } catch (uploadError) {
                    console.error('Firebase Storage upload failed:', {
                        error: uploadError,
                        code: uploadError.code,
                        message: uploadError.message,
                        details: uploadError.details
                    });
                    
                    // Fallback: Base64 encoding (works for smaller images)
                    console.log('Attempting Base64 fallback...');
                    try {
                        imageURL = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                console.log('Base64 conversion successful');
                                resolve(e.target.result);
                            };
                            reader.onerror = (e) => {
                                console.error('Base64 conversion failed:', e);
                                reject(e);
                            };
                            reader.readAsDataURL(image);
                        });
                    } catch (base64Error) {
                        console.error('Both upload methods failed:', base64Error);
                        alert('Image upload failed. Please try a smaller image or different format.');
                        setUploading(false);
                        return;
                    }
                }
            }

            console.log('Saving tweet to Firestore...');
            
            // Get user profile data from Firestore for updated avatar
            let userAvatar = currentUser.photoURL;
            let userName = currentUser.displayName || currentUser.email;
            
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userAvatar = userData.photoURL || currentUser.photoURL;
                    userName = userData.displayName || currentUser.displayName || currentUser.email;
                    console.log('Using updated profile data for tweet');
                }
            } catch (error) {
                console.warn('Could not load user profile, using auth data:', error);
            }
            
            const docRef = await addDoc(collection(db, 'tweets'), {
                title, 
                message, 
                imageURL,
                likes: 0,
                likedUsers: [], // Track who liked the post
                userId: currentUser.uid,
                userName: userName,
                userAvatar: userAvatar,
                date: new Date().toLocaleDateString(),
                createdAt: serverTimestamp(),
                comments: [] // Initialize comments array
            });
            console.log('Tweet saved with ID:', docRef.id);

            const newTweet = { 
                title, 
                message, 
                imageURL,
                likes: 0, 
                likedUsers: [],
                id: docRef.id,
                userId: currentUser.uid,
                userName: userName,
                userAvatar: userAvatar,
                date: new Date().toLocaleDateString(),
                comments: []
            };
            
            console.log('Adding tweet to local state...');
            const updatedTweets = [...tweets, newTweet];
            setTweets(updatedTweets);
            
            // Track post creation
            try {
                trackPostCreate();
            } catch (trackError) {
                console.warn('Analytics tracking failed:', trackError);
            }
            
            // Reset form
            console.log('Resetting form...');
            setTitle('');
            setMessage('');
            setImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            console.log('Tweet creation completed successfully!');
            alert('Tweet posted successfully!');
            
        } catch (error) {
            console.error('Error saving tweet:', {
                error: error,
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            let errorMessage = 'Failed to post tweet';
            if (error.message.includes('timeout')) {
                errorMessage = 'Upload timed out. Please try a smaller image.';
            } else if (error.message.includes('storage')) {
                errorMessage = 'Image upload failed. Please check your internet connection.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. Please check Firebase settings.';
            }
            
            alert(errorMessage + '\n\nDetails: ' + error.message);
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
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={handleImageSelect}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        id="image-upload"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.click();
                            }
                        }}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <img 
                            src="https://cdn-icons-png.flaticon.com/512/54/54799.png" 
                            alt="Camera"
                            style={{
                                width: '16px',
                                height: '16px',
                                marginRight: '6px'
                            }}
                        />
                        Add a photo
                    </button>
                    
                    {image && (
                        <div style={{ 
                            marginTop: '0.5rem', 
                            padding: '0.5rem', 
                            background: '#f8f9fa', 
                            borderRadius: '4px',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                                {image.name}
                            </span>
                            {!uploading && (
                                <button 
                                    type="button"
                                    onClick={removeImage}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Remove
                                </button>
                            )}
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
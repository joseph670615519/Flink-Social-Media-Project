import React, { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Image, Send, X } from 'lucide-react';
import './CreatePost.css';

const CreatePost = ({ user, onPostCreated }) => {
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file) => {
    const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !selectedImage) return;

    setIsLoading(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await addDoc(collection(db, 'posts'), {
        text: postText,
        imageUrl: imageUrl,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL || '',
        timestamp: new Date(),
        likes: [],
        comments: []
      });

      setPostText('');
      setSelectedImage(null);
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('เกิดข้อผิดพลาดในการสร้างโพสต์');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <img 
          src={user.photoURL || '/default-avatar.png'} 
          alt={user.displayName}
          className="user-avatar"
        />
        <div className="user-info">
          <h3>{user.displayName || user.email}</h3>
          <p>แชร์ความคิดของคุณกับ Flink</p>
        </div>
      </div>

      <form onSubmit={createPost} className="create-post-form">
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder="คุณกำลังคิดอะไรอยู่?"
          className="post-textarea"
          rows={4}
        />

        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button 
              type="button" 
              className="remove-image"
              onClick={removeImage}
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="post-actions">
          <div className="media-options">
            <button 
              type="button"
              className="image-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
              เพิ่มรูปภาพ
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            className="post-button"
            disabled={(!postText.trim() && !selectedImage) || isLoading}
          >
            {isLoading ? (
              <span>กำลังโพสต์...</span>
            ) : (
              <>
                <Send size={20} />
                โพสต์
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
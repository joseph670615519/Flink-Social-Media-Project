import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// อัพโหลดรูปโพสต์
export const uploadPostImage = async (file, postId) => {
    try {
        if (!file) return null;
        
        const storageRef = ref(storage, `post-images/${postId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading post image:', error);
        throw error;
    }
};

// อัพโหลดรูป Profile
export const uploadProfileImage = async (file, userId) => {
    try {
        if (!file) return null;
        
        const storageRef = ref(storage, `profile-images/${userId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading profile image:', error);
        throw error;
    }
};

// ลบรูป
export const deleteImage = async (imageUrl) => {
    try {
        if (!imageUrl) return;
        
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    arrayUnion,
    arrayRemove,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { updateProfile } from 'firebase/auth';

// Get user profile by ID
export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return {
                id: userSnap.id,
                ...userSnap.data()
            };
        } else {
            console.log('User not found');
            return null;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

// Create or initialize user profile (called on first signup)
export const createUserProfile = async (user, additionalData = {}) => {
    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            displayName: user.displayName || user.email,
            email: user.email,
            photoURL: user.photoURL || '',
            bio: additionalData.bio || '',
            location: additionalData.location || '',
            website: additionalData.website || '',
            followers: [],
            following: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...additionalData
        });
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
};

// Follow a user
export const followUser = async (currentUserId, targetUserId) => {
    try {
        // Add to current user's following
        const currentUserRef = doc(db, 'users', currentUserId);
        await updateDoc(currentUserRef, {
            following: arrayUnion(targetUserId)
        });

        // Add to target user's followers
        const targetUserRef = doc(db, 'users', targetUserId);
        await updateDoc(targetUserRef, {
            followers: arrayUnion(currentUserId)
        });
    } catch (error) {
        console.error('Error following user:', error);
        throw error;
    }
};

// Unfollow a user
export const unfollowUser = async (currentUserId, targetUserId) => {
    try {
        // Remove from current user's following
        const currentUserRef = doc(db, 'users', currentUserId);
        await updateDoc(currentUserRef, {
            following: arrayRemove(targetUserId)
        });

        // Remove from target user's followers
        const targetUserRef = doc(db, 'users', targetUserId);
        await updateDoc(targetUserRef, {
            followers: arrayRemove(currentUserId)
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
    }
};

// Get all users (for friend suggestions)
export const getAllUsers = async (excludeUserId = null) => {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            if (!excludeUserId || doc.id !== excludeUserId) {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });
        return users;
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};

// Search users by display name
export const searchUsers = async (searchTerm) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '>=', searchTerm), where('displayName', '<=', searchTerm + '\uf8ff'));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        // Fallback: search in memory (less efficient but works)
        const allUsers = await getAllUsers();
        return allUsers.filter(user => 
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
};

// Subscribe to user profile changes
export const subscribeToUserProfile = (userId, callback) => {
    try {
        const userRef = doc(db, 'users', userId);
        
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                callback({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });
        
        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to user profile:', error);
        throw error;
    }
};

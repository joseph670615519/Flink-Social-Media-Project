import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    getDocs, 
    updateDoc,
    doc,
    where,
    arrayUnion,
    arrayRemove,
    getDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Create a new post
export const createPost = async (userId, title, message) => {
    try {
        const postsRef = collection(db, 'posts');
        const docRef = await addDoc(postsRef, {
            userId,
            title,
            message,
            likes: [],
            comments: [],
            shares: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

// Get all posts ordered by newest first
export const getAllPosts = async () => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            });
        });
        return posts;
    } catch (error) {
        console.error('Error getting posts:', error);
        throw error;
    }
};

// Get posts from specific user
export const getUserPosts = async (userId) => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            });
        });
        return posts;
    } catch (error) {
        console.error('Error getting user posts:', error);
        throw error;
    }
};

// Like a post
export const likePost = async (postId, userId) => {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            likes: arrayUnion(userId)
        });
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
};

// Unlike a post
export const unlikePost = async (postId, userId) => {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            likes: arrayRemove(userId)
        });
    } catch (error) {
        console.error('Error unliking post:', error);
        throw error;
    }
};

// Add a comment to a post
export const addComment = async (postId, userId, userName, userAvatar, comment) => {
    try {
        const postRef = doc(db, 'posts', postId);
        const newComment = {
            id: Date.now().toString(),
            userId,
            userName,
            userAvatar,
            text: comment,
            createdAt: new Date()
        };
        
        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });
        return newComment;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

// Get a single post
export const getPost = async (postId) => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
            return {
                id: postSnap.id,
                ...postSnap.data(),
                createdAt: postSnap.data().createdAt?.toDate?.() || new Date(),
                updatedAt: postSnap.data().updatedAt?.toDate?.() || new Date()
            };
        } else {
            console.log('Post not found');
            return null;
        }
    } catch (error) {
        console.error('Error getting post:', error);
        throw error;
    }
};

// Subscribe to real-time posts updates
export const subscribeToAllPosts = (callback) => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const posts = [];
            querySnapshot.forEach((doc) => {
                posts.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
                });
            });
            callback(posts);
        });
        
        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to posts:', error);
        throw error;
    }
};

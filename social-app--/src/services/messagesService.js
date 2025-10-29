import { 
    collection, 
    addDoc, 
    query, 
    where,
    orderBy, 
    getDocs,
    doc,
    setDoc,
    arrayUnion,
    onSnapshot,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Create or get conversation between two users
export const getOrCreateConversation = async (userId1, userId2) => {
    try {
        // Create a unique conversation ID (sort user IDs to ensure consistency)
        const conversationId = [userId1, userId2].sort().join('_');
        
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', '==', [userId1, userId2].sort()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }
        
        // Create new conversation if it doesn't exist
        const newConversation = await addDoc(conversationsRef, {
            participants: [userId1, userId2].sort(),
            createdAt: new Date(),
            lastMessageAt: new Date(),
            lastMessage: ''
        });
        
        return newConversation.id;
    } catch (error) {
        console.error('Error getting or creating conversation:', error);
        throw error;
    }
};

// Send a message
export const sendMessage = async (conversationId, senderId, senderName, senderAvatar, message) => {
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        
        const docRef = await addDoc(messagesRef, {
            senderId,
            senderName,
            senderAvatar,
            text: message,
            createdAt: new Date(),
            read: false
        });
        
        // Update conversation's last message
        const conversationRef = doc(db, 'conversations', conversationId);
        await setDoc(conversationRef, {
            lastMessageAt: new Date(),
            lastMessage: message
        }, { merge: true });
        
        return docRef.id;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Get all messages in a conversation
export const getConversationMessages = async (conversationId) => {
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
        });
        
        return messages;
    } catch (error) {
        console.error('Error getting conversation messages:', error);
        throw error;
    }
};

// Get user's conversations
export const getUserConversations = async (userId) => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', userId));
        const querySnapshot = await getDocs(q);
        
        const conversations = [];
        for (const conversationDoc of querySnapshot.docs) {
            const conversationData = conversationDoc.data();
            const otherUserId = conversationData.participants.find(id => id !== userId);
            
            // Get the other user's info
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            const userData = userDoc.data();
            
            conversations.push({
                id: conversationDoc.id,
                otherUserId,
                otherUserName: userData?.displayName || 'Unknown User',
                otherUserAvatar: userData?.photoURL || '',
                lastMessage: conversationData.lastMessage,
                lastMessageAt: conversationData.lastMessageAt?.toDate?.() || new Date(),
                participants: conversationData.participants
            });
        }
        
        return conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    } catch (error) {
        console.error('Error getting user conversations:', error);
        throw error;
    }
};

// Subscribe to conversation messages in real-time
export const subscribeToConversationMessages = (conversationId, callback) => {
    try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messages = [];
            querySnapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || new Date()
                });
            });
            
            callback(messages);
        });
        
        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to messages:', error);
        throw error;
    }
};

// Subscribe to user's conversations in real-time
export const subscribeToUserConversations = (userId, callback) => {
    try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', userId));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const conversations = [];
            for (const conversationDoc of querySnapshot.docs) {
                const conversationData = conversationDoc.data();
                const otherUserId = conversationData.participants.find(id => id !== userId);
                
                // Get the other user's info
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                const userData = userDoc.data();
                
                conversations.push({
                    id: conversationDoc.id,
                    otherUserId,
                    otherUserName: userData?.displayName || 'Unknown User',
                    otherUserAvatar: userData?.photoURL || '',
                    lastMessage: conversationData.lastMessage,
                    lastMessageAt: conversationData.lastMessageAt?.toDate?.() || new Date(),
                    participants: conversationData.participants
                });
            }
            
            callback(conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt));
        });
        
        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to conversations:', error);
        throw error;
    }
};

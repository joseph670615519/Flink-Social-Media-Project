import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// สร้าง notification ใหม่
export const createNotification = async (recipientId, type, data) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        
        const notification = {
            recipientId,
            type, // 'like', 'comment', 'message', 'follow'
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            message: data.message,
            postId: data.postId || null,
            conversationId: data.conversationId || null,
            createdAt: new Date(),
            read: false
        };
        
        const docRef = await addDoc(notificationsRef, notification);
        return docRef.id;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// ดึงเตือนทั้งหมดของผู้ใช้
export const getUserNotifications = async (userId) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(where('recipientId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const notifications = [];
        querySnapshot.forEach((doc) => {
            notifications.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
        });
        
        // เรียงจากใหม่สุดไปเก่าสุด
        return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
    }
};

// ทำให้เตือนเป็นอ่านแล้ว
export const markNotificationAsRead = async (notificationId) => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// ทำให้เตือนทั้งหมดเป็นอ่านแล้ว
export const markAllNotificationsAsRead = async (userId) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(where('recipientId', '==', userId), where('read', '==', false));
        const querySnapshot = await getDocs(q);
        
        const updates = querySnapshot.docs.map(doc => 
            updateDoc(doc.ref, { read: true })
        );
        
        await Promise.all(updates);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// ลบเตือน
export const deleteNotification = async (notificationId) => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await deleteDoc(notificationRef);
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

// Debug Helper for Flink Application
// Add this to browser console to debug issues

window.FlinkDebug = {
  // Check current user authentication
  checkAuth: () => {
    import('./firebase.js').then(({ auth }) => {
      console.log('Current User:', auth.currentUser);
      console.log('User ID:', auth.currentUser?.uid);
      console.log('User Email:', auth.currentUser?.email);
      console.log('User Display Name:', auth.currentUser?.displayName);
    });
  },

  // Test notification creation
  testNotification: async () => {
    try {
      const { createNotification } = await import('./components/Notification.jsx');
      const { auth } = await import('./firebase.js');
      
      if (!auth.currentUser) {
        console.error('Not logged in');
        return;
      }
      
      // Create a test notification
      await createNotification(
        auth.currentUser.uid,
        auth.currentUser.uid,
        'Test User',
        'test',
        'This is a test notification'
      );
      console.log('Test notification created');
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  },

  // Check Firestore connection
  checkFirestore: async () => {
    try {
      const { db } = await import('./firebase.js');
      const { collection, getDocs } = await import('firebase/firestore');
      
      const snapshot = await getDocs(collection(db, 'users'));
      console.log('Firestore connected. Users found:', snapshot.size);
      
      snapshot.forEach((doc) => {
        console.log('User:', doc.id, doc.data());
      });
    } catch (error) {
      console.error('Firestore connection failed:', error);
    }
  },

  // Test messaging
  testMessaging: async () => {
    try {
      const { db, auth } = await import('./firebase.js');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      if (!auth.currentUser) {
        console.error('Not logged in');
        return;
      }

      // Try to create a test conversation
      const conversationData = {
        participants: [auth.currentUser.uid, 'test-user-id'],
        createdAt: serverTimestamp(),
        lastMessage: 'Test message',
        lastMessageTime: serverTimestamp()
      };

      console.log('Testing conversation creation...');
      console.log('Conversation data:', conversationData);
    } catch (error) {
      console.error('Messaging test failed:', error);
    }
  },

  // Check component loading
  checkComponents: () => {
    const components = [
      'MessagingSystem',
      'Notification', 
      'FriendsSystem',
      'CommentSection'
    ];
    
    components.forEach(componentName => {
      const element = document.querySelector(`[data-component="${componentName}"]`);
      console.log(`${componentName}:`, element ? 'Loaded' : 'Not found');
    });
  },

  // Monitor Firebase errors
  monitorFirebase: () => {
    // Override console.error to catch Firebase errors
    const originalError = console.error;
    console.error = function(...args) {
      if (args.some(arg => String(arg).includes('Firebase') || String(arg).includes('firestore'))) {
        console.log('Firebase Error Detected:', ...args);
      }
      originalError.apply(console, args);
    };
    console.log('Firebase error monitoring enabled');
  }
};

// Auto-run basic checks
console.log('Flink Debug Helper Loaded');
console.log('Available commands:');
console.log('- FlinkDebug.checkAuth()');
console.log('- FlinkDebug.testNotification()'); 
console.log('- FlinkDebug.checkFirestore()');
console.log('- FlinkDebug.testMessaging()');
console.log('- FlinkDebug.checkComponents()');
console.log('- FlinkDebug.monitorFirebase()');

// Auto-check auth on load
setTimeout(() => {
  FlinkDebug.checkAuth();
}, 2000);
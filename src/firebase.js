import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, logEvent, setUserId, setUserProperties } from "firebase/analytics";

// ----------------------------
// Firebase Config
// ----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAtDdMoZ8YIB-eNg41sPOKTujiGkEvtVeo",
  authDomain: "flink-bae4c.firebaseapp.com",
  projectId: "flink-bae4c",
  storageBucket: "flink-bae4c.firebasestorage.app",
  messagingSenderId: "699898972129",
  appId: "1:699898972129:web:b97dd1cadba3d7ce1634a0",
  measurementId: "G-47RFJRK1ZN"
};

// ----------------------------
// Initialize Firebase
// ----------------------------
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// ----------------------------
// Auth persistence
// ----------------------------
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence enabled");
  })
  .catch((error) => {
    console.error("❌ Error setting persistence:", error);
  });

// ----------------------------
// ensureUserDoc()
// Creates a user document if it doesn't already exist
// ----------------------------
export async function ensureUserDoc() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return; // Don’t overwrite existing data

  await setDoc(ref, {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "Anonymous",
    displayNameLower: (user.displayName || "anonymous").toLowerCase(),
    friends: [],
    friendRequests: [],
    requestsSent: [],
    requestsReceived: [],
  });
}

// ----------------------------
// Analytics Helper Functions
// ----------------------------
export const trackEvent = (eventName, parameters = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, parameters);
  }
};

export const trackUserLogin = (userId) => {
  if (analytics) {
    setUserId(analytics, userId);
    logEvent(analytics, 'login', {
      method: 'email'
    });
  }
};

export const trackPostCreate = () => {
  if (analytics) {
    logEvent(analytics, 'post_create');
  }
};

export const trackPostLike = () => {
  if (analytics) {
    logEvent(analytics, 'post_like');
  }
};

export const trackPageView = (pageName) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_title: pageName
    });
  }
};

// ----------------------------
// Google Sign-in Function
// ----------------------------
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create/update user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Google User',
      displayNameLower: (user.displayName || 'Google User').toLowerCase(),
      photoURL: user.photoURL,
      createdAt: new Date().toISOString(),
      friends: [],
      friendRequests: [],
      requestsSent: [],
      requestsReceived: [],
    }, { merge: true }); // Merge prevents overwriting existing data
    
    // Track login event
    trackUserLogin(user.uid);
    
    return { success: true, user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Pop-up was blocked. Please allow pop-ups for this site.' };
    } else if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in was cancelled.' };
    } else if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
    
    return { success: false, error: error.message };
  }
};

// ----------------------------
// Admin Management Functions
// ----------------------------
export const makeUserAdmin = async (userEmail) => {
  try {
    // First, find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('User not found with email:', userEmail);
      return { success: false, error: 'User not found' };
    }
    
    // Update user role to admin
    const userDoc = querySnapshot.docs[0];
    await setDoc(doc(db, 'users', userDoc.id), {
      role: 'admin',
      isAdmin: true,
      adminGrantedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('User is now admin:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Error making user admin:', error);
    return { success: false, error: error.message };
  }
};

export const checkUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role || 'user';
    }
    return 'user';
  } catch (error) {
    console.error('Error checking user role:', error);
    return 'user';
  }
};

// List of admin emails (for fallback)
export const ADMIN_EMAILS = [
  'admin@flink.com',
  // Add your email here
];

export default app;

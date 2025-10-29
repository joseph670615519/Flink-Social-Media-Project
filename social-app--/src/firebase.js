// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8dsgddYLojpbSsq05UIQ4yaDRzL9U7Xw",
  authDomain: "social-app-e00fe.firebaseapp.com",
  projectId: "social-app-e00fe",
  storageBucket: "social-app-e00fe.firebasestorage.app",
  messagingSenderId: "960244998667",
  appId: "1:960244998667:web:069002e726266f5db95d0e",
  measurementId: "G-PD2856JMSR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
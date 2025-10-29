import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ----------------------------
// Firebase Config
// ----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAtDdMoZ8YIB-eNg41sPOKTujiGkEvtVeo",
  authDomain: "flink-bae4c.firebaseapp.com",
  projectId: "flink-bae4c",
  storageBucket: "flink-bae4c.firebasestorage.app",
  messagingSenderId: "699898972129",
  appId: "1:699898972129:web:751dba5d41ec9a161634a0",
  measurementId: "G-96NCV06KC3",
};

// ----------------------------
// Initialize Firebase
// ----------------------------
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ----------------------------
// Auth persistence
// ----------------------------
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Auth persistence enabled");
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

export default app;

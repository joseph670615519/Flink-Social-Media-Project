import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAtDdMoZ8YIB-eNg41sPOKTujiGkEvtVeo",
  authDomain: "flink-bae4c.firebaseapp.com",
  projectId: "flink-bae4c",
  storageBucket: "flink-bae4c.firebasestorage.app",
  messagingSenderId: "699898972129",
  appId: "1:699898972129:web:751dba5d41ec9a161634a0",
  measurementId: "G-96NCV06KC3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

export async function ensureUserDoc() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  // Only create the doc if it doesn't exist yet
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    // Don't overwrite existing data
    return;
  }

  await setDoc(ref, {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "Anonymous",
    displayNameLower: (user.displayName || "anonymous").toLowerCase(),
    friends: [],
    requestsSent: [],
    requestsReceived: []
  });
}

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence enabled");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

export default app;
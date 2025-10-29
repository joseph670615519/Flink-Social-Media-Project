// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtDdMoZ8YIB-eNg41sPOKTujiGkEvtVeo",
  authDomain: "flink-bae4c.firebaseapp.com",
  projectId: "flink-bae4c",
  storageBucket: "flink-bae4c.appspot.com",
  messagingSenderId: "699898972129",
  appId: "1:699898972129:web:b97dd1cadba3d7ce1634a0",
  measurementId: "G-47RFJRK1ZN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

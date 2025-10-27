import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

// Send a friend request
export async function sendFriendRequest(currentUid, targetUid) {
  if (!currentUid || !targetUid || currentUid === targetUid) return;
  const currentRef = doc(db, "users", currentUid);
  const targetRef = doc(db, "users", targetUid);

  await updateDoc(currentRef, { requestsSent: arrayUnion(targetUid) });
  await updateDoc(targetRef, { requestsReceived: arrayUnion(currentUid) });
}

// Accept a friend request
export async function acceptFriendRequest(currentUid, targetUid) {
  const currentRef = doc(db, "users", currentUid);
  const targetRef = doc(db, "users", targetUid);

  await updateDoc(currentRef, {
    friends: arrayUnion(targetUid),
    requestsReceived: arrayRemove(targetUid)
  });
  await updateDoc(targetRef, {
    friends: arrayUnion(currentUid),
    requestsSent: arrayRemove(currentUid)
  });
}

// Remove or cancel friendship/request
export async function removeFriend(currentUid, targetUid) {
  const currentRef = doc(db, "users", currentUid);
  const targetRef = doc(db, "users", targetUid);

  await updateDoc(currentRef, {
    friends: arrayRemove(targetUid),
    requestsSent: arrayRemove(targetUid),
    requestsReceived: arrayRemove(targetUid)
  });
  await updateDoc(targetRef, {
    friends: arrayRemove(currentUid),
    requestsSent: arrayRemove(currentUid),
    requestsReceived: arrayRemove(currentUid)
  });
}

// Check relationship status
export async function getFriendStatus(currentUid, targetUid) {
  if (!currentUid || !targetUid) return "none";
  const snap = await getDoc(doc(db, "users", currentUid));
  const data = snap.data() || {};

  if (data.friends?.includes(targetUid)) return "friends";
  if (data.requestsSent?.includes(targetUid)) return "sent";
  if (data.requestsReceived?.includes(targetUid)) return "received";
  return "none";
}
